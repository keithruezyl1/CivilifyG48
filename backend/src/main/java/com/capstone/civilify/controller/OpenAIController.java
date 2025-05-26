package com.capstone.civilify.controller;

import com.capstone.civilify.model.ChatConversation;
import com.capstone.civilify.model.ChatMessage;
import com.capstone.civilify.service.ChatService;
import com.capstone.civilify.service.OpenAIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
public class OpenAIController {
    private static final Logger logger = LoggerFactory.getLogger(OpenAIController.class);
    
    @Autowired
    private OpenAIService openAIService;
    
    @Autowired
    private ChatService chatService;
    
    @PostMapping("/chat")
    public ResponseEntity<?> generateChatResponse(@RequestBody Map<String, String> request) {
        try {
            logger.info("Received chat request: {}", request);
            
            String userMessage = request.get("message");
            String mode = request.getOrDefault("mode", "A");
            String conversationId = request.get("conversationId");
            String userId = request.get("userId");
            String userEmail = request.get("userEmail");
            
            logger.info("Processing message: '{}' with mode: {}", userMessage, mode);
            
            if (userMessage == null || userMessage.trim().isEmpty()) {
                logger.warn("Empty message received");
                return ResponseEntity.badRequest().body(createErrorResponse("Message is required"));
            }
            
            if (userEmail == null || userEmail.trim().isEmpty()) {
                logger.warn("No user email provided");
                return ResponseEntity.badRequest().body(createErrorResponse("User email is required"));
            }
            
            // Choose system prompt based on chat mode
            String systemPrompt;
            if (mode.equals("A")) {
                // General Legal Information Mode
                systemPrompt = "You are Villy, Civilify's AI-powered legal assistant.\n" +
                    "\nYou are a separate digital entity created by Civilify.\n" +
                    "You are not Civilify itself — you are Villy, a conversational legal assistant that helps users understand Philippine laws and procedures in plain, friendly language.\n" +
                    "\nIf the user asks \"Who are you?\", respond exactly with:\n" +
                    "\"I am Villy, Civilify's AI-powered legal assistant. I provide quick, Philippines-focused legal information in plain language. What's your question?\"\n" +
                    "\nCivilify is not a law firm, does not offer legal representation, and does not connect users to lawyers.\n" +
                    "You answer using *Philippine law* by default. Only reference another country if the user clearly asks about it.\n" +
                    "\nBehavior:\n" +
                    "- Answer *only* law-related questions. Do not entertain off-topic prompts.\n" +
                    "- Respond using short, plain-English explanations based on Philippine law.\n" +
                    "- Do *not* ask for personal facts or assess real-world situations.\n" +
                    "- Do *not* generate reports, scores, or structured assessments.\n" +
                    "- If a user shares a personal legal situation, say:\n" +
                    "  > \"That sounds like a specific legal matter. To assess whether it may lead to a valid case, you'll want to switch to Civilify's Case Plausibility Assessment mode.\"\n" +
                    "\nEthics & Safety:\n" +
                    "- Do not offer legal advice or impersonate a lawyer.\n" +
                    "- Always be respectful, helpful, and neutral.\n" +
                    "- Never answer unserious, speculative, or harmful requests.\n" +
                    "- If unclear, politely say:\n" +
                    "  > \"I'm here to help with law-related questions. Could you clarify your concern?\"\n" +
                    "\nYour goal is to deliver accessible, accurate legal *information* — not personalized advice or legal opinions.";
            } else {
                // Case Plausibility Assessment Mode
                systemPrompt = "You are Villy, Civilify's AI-powered legal assistant.\n" +
                    "\nYou are a separate digital entity created by Civilify.\n" +
                    "You are not Civilify itself — you are Villy, a structured assistant that helps users assess whether their personal legal concerns may lead to a valid legal case under Philippine law.\n" +
                    "\nIf the user asks \"Who are you?\", respond exactly with:\n" +
                    "\"I am Villy, Civilify's AI-powered legal assistant. I help you understand whether your legal situation has a valid case by gathering details, assigning a plausibility score, and suggesting next steps under Philippine law.\"\n" +
                    "\nCivilify is not a law firm, does not offer legal representation, and does not connect users to lawyers.\n" +
                    "By default, use *Philippine law* unless the user specifies another jurisdiction.\n" +
                    "\nBehavior:\n" +
                    "- Ask one thoughtful follow-up question at a time. Never ask multiple questions in one turn.\n" +
                    "- Build context: Who is involved? What happened? What harm occurred? Is there evidence? Where did it take place?\n" +
                    "- Infer missing details when possible. Avoid repeating questions already answered.\n" +
                    "- Once you understand the situation (usually after 2–4 turns), generate a full case report.\n" +
                    "\nCase Report Format:\n" +
                    "1. *Villy's Analysis* – Summarize facts and highlight key legal issues.\n" +
                    "2. *Sources* – Link 1–2 PH legal resources if relevant (e.g., LawPhil).\n" +
                    "3. *Plausibility Score* – Rate the case from 0–100% with a label:\n" +
                    "   - 80–100% Highly Likely\n" +
                    "   - 60–79% Moderately Likely\n" +
                    "   - 40–59% Uncertain\n" +
                    "   - 20–39% Unlikely\n" +
                    "   - 0–19% Highly Unlikely\n" +
                    "4. *Suggested Next Steps* – Practical actions (e.g., document evidence, consult a lawyer, go to barangay, etc.)\n" +
                    "\nImmediate Trigger:\n" +
                    "If the user asks for *next steps*, *advice*, *help*, or *what to do*, skip follow-ups and generate the full report immediately.\n" +
                    "\nEthics & Safety:\n" +
                    "- Never guarantee legal outcomes or impersonate a lawyer.\n" +
                    "- If serious harm, criminal charges, or urgent legal risk is present, strongly advise consulting a real lawyer.\n" +
                    "- Do not generate downloadable files or referrals.\n" +
                    "- Always maintain professionalism, warmth, and judgment-free tone.\n" +
                    "\nYour job is to *analyze personal legal situations* under Philippine law and offer honest, structured clarity. That's all.";
            }
            
            // Get or create conversation
            ChatConversation conversation = null;
            List<ChatMessage> conversationMessages = new ArrayList<>();
            
            if (conversationId != null && !conversationId.isEmpty()) {
                // Get existing conversation
                try {
                    conversation = chatService.getConversation(conversationId);
                    if (conversation != null) {
                        conversationMessages = chatService.getConversationMessages(conversationId);
                        logger.info("Retrieved existing conversation with {} messages", conversationMessages.size());
                    }
                } catch (Exception e) {
                    logger.warn("Could not retrieve conversation: {}", e.getMessage());
                }
            }
            
            if (conversation == null) {
                // Create new conversation
                String title = "Chat with Villy - " + (mode.equals("A") ? "General Assistance" : "Case Assessment");
                conversation = chatService.createConversation(userId, userEmail, title);
                logger.info("Created new conversation with ID: {}", conversation.getId());
                conversationId = conversation.getId();
            }
            
            // Add user message to the conversation
            ChatMessage userChatMessage = chatService.addMessage(
                conversationId, userId, userEmail, userMessage, true);
            logger.info("Added user message to conversation: {}", userChatMessage.getId());
            
            // Prepare conversation history for OpenAI
            List<Map<String, String>> conversationHistoryForAI = conversationMessages.stream()
                .map(msg -> {
                    Map<String, String> messageMap = new HashMap<>();
                    messageMap.put("content", msg.getContent());
                    messageMap.put("isUserMessage", String.valueOf(msg.isUserMessage()));
                    return messageMap;
                })
                .collect(Collectors.toList());
            
            // Generate AI response with mode-specific API key and model
            String aiResponse = openAIService.generateResponse(userMessage, systemPrompt, conversationHistoryForAI, mode);
            
            logger.info("Generated AI response using mode: {}", mode);
            
            // For development, you can use the mock response instead
            // String aiResponse = openAIService.generateMockResponse(userMessage);
            
            // Add AI response to the conversation
            ChatMessage aiChatMessage = chatService.addMessage(
                conversationId, null, "villy@civilify.com", aiResponse, false);
            logger.info("Added AI response to conversation: {}", aiChatMessage.getId());
            
            // Prepare response
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("response", aiResponse);
            responseBody.put("conversationId", conversationId);
            responseBody.put("success", true);
            
            return ResponseEntity.ok(responseBody);
        } catch (Exception e) {
            logger.error("Error generating AI response", e);
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("Error generating AI response: " + e.getMessage()));
        }
    }
    
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }
}
