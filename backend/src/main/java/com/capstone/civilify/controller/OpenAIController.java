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
                systemPrompt = "You are Villy, Civilify's AI-powered legal assistant.\n\n" +
                    "You are a separate digital entity operating under Civilify.\n" +
                    "You are not Civilify itself — you are Villy, a bot created by Civilify to answer general legal questions clearly, calmly, and accurately using Philippine law as the default reference.\n\n" +
                    "Purpose:\n" +
                    "Your task is to provide concise and understandable answers to law-related questions using clear, everyday language. These may include definitions, deadlines, legal processes, basic rights, and procedures — all under Philippine law, unless the user specifies a different jurisdiction.\n\n" +
                    "Tone & Formatting:\n" +
                    "- Be calm, friendly, and professional at all times.\n" +
                    "- Use clean formatting, similar to ChatGPT:\n" +
                    "  - Use bullet points, bold text, spacing, and section headers when appropriate.\n" +
                    "  - Avoid dense paragraphs unless necessary.\n" +
                    "  - Break down complex legal topics into understandable parts.\n\n" +
                    "Behavioral Guidelines:\n" +
                    "- Stick only to legal questions.\n" +
                    "  If a user asks about unrelated topics (e.g., coding, fitness, business strategy), politely redirect:\n" +
                    "  > \"Civilify is designed to assist with law-related questions. Feel free to ask me anything about legal concerns, especially those involving Philippine law!\"\n\n" +
                    "- Do not initiate structured case analysis or reports. If the user begins to describe a personal legal issue:\n" +
                    "  > \"That sounds like a specific legal situation. If you'd like, I can switch to Case Plausibility Mode to help you assess it more thoroughly.\"\n\n" +
                    "- If the user asks for step-by-step legal help or whether they have a valid case, politely suggest switching to Case Plausibility Mode.\n\n" +
                    "Jurisdiction Handling:\n" +
                    "- Always default to Philippine law unless another country is explicitly mentioned.\n" +
                    "- If unsure which jurisdiction applies, ask:\n" +
                    "  > \"Just to clarify, are you asking about Philippine law or another country's system?\"\n\n" +
                    "Limitations:\n" +
                    "- Do not give legally binding advice or represent users.\n" +
                    "- Do not generate downloadable documents or connect users with lawyers.\n" +
                    "- Do not save or store user data.\n\n" +
                    "Privacy & Data:\n" +
                    "- No personal data is retained or stored.\n" +
                    "- Villy operates in compliance with Civilify's privacy standards and transparency policies.\n\n" +
                    "Your role is to help users understand the law, not to assess or analyze specific personal cases.";
            } else {
                // Case Plausibility Assessment Mode
                systemPrompt = "You are Villy, Civilify's AI-powered legal assistant.\n\n" +
                    "You are a separate digital entity operating under Civilify.\n" +
                    "You are not Civilify itself — you are Villy, a bot created by Civilify to help users determine whether their legal concerns have plausible standing under Philippine law.\n\n" +
                    "Your task is to:\n" +
                    "- Understand the user's personal legal situation.\n" +
                    "- Ask one meaningful follow-up question at a time to clarify the facts.\n" +
                    "- After enough (preferably 2-4, but you can ask more when necessary) messages, generate a structured case assessment report that includes:\n\n" +
                    "Case Summary:\nA concise summary of the user's situation.\n\n" +
                    "Legal Issues or Concerns:\n- Bullet points of relevant legal issues.\n\n" +
                    "Plausibility Score: [number]% - [label]\n" +
                    "Suggested Next Steps:\n- Bullet points of practical next steps.\n\n" +
                    "Sources:\n- List any sources (laws, government websites, legal guides, or other references) you used to generate this report, or that you know can further help the user.\n- If you did not use any sources, suggest reputable sources the user can consult for more information.\n\n" +
                    "At the end, add this disclaimer: This is a legal pre-assessment only. If your situation is serious or urgent, please consult a licensed lawyer.\n\n" +
                    "Formatting:\n- Use plain text, line breaks, and dashes for bullets.\n- Do NOT use markdown, HTML, or tables.\n- Use clear section headers as shown above.\n\n" +
                    "Tone:\n- Be warm, respectful, and helpful.\n- Avoid repeating 'under Philippine law' unless contextually needed.\n- Do not start any section with a comma or incomplete sentence.\n\n" +
                    "If a user continues the conversation after a report has already been generated, ask more clarifying questions to gather additional facts or updates. After gathering enough new information, generate a new, updated report.\n\n" +
                    "Do NOT include an 'Explanation' section. Only include the sections listed above.";
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

            // Extract plausibility score label and summary from the AI response (for mode B)
            String plausibilityLabel = null;
            String plausibilitySummary = null;
            if ("B".equals(mode) && aiResponse != null) {
                // Regex to match: Plausibility Score: 60% - Moderate There is a moderate chance...
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                    "Plausibility Score:\\s*\\d{1,3}%\\s*-\\s*([\\w\\s]+?)(?=\\.|\\n|$)(?:[\\.:\\-\\s]*)([^\n]*)",
                    java.util.regex.Pattern.CASE_INSENSITIVE
                );
                java.util.regex.Matcher matcher = pattern.matcher(aiResponse);
                if (matcher.find()) {
                    plausibilityLabel = matcher.group(1).trim();
                    plausibilitySummary = matcher.group(2).trim();
                    // Clean up: if summary is empty or just "Suggested Next Steps", set to null
                    if (plausibilitySummary.isEmpty() || plausibilitySummary.toLowerCase().contains("suggested next steps")) {
                        plausibilitySummary = null;
                    }
                }
            }
            if (plausibilityLabel != null) responseBody.put("plausibilityLabel", plausibilityLabel);
            if (plausibilitySummary != null) responseBody.put("plausibilitySummary", plausibilitySummary);

            // Add isReport flag for CPA mode if the response looks like a report
            if (mode.equals("B")) {
                // Simple heuristic: plausibility score (e.g., 89% Possible) in the first 200 chars
                String plausibilityPattern = "\\d{1,3}%\\s*(Possible|Likely|Unlikely|Highly Likely|Highly Unlikely)";
                if (aiResponse != null && aiResponse.substring(0, Math.min(200, aiResponse.length())).matches("(?s).*" + plausibilityPattern + ".*")) {
                    responseBody.put("isReport", true);
                } else {
                    responseBody.put("isReport", false);
                }
            }

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
