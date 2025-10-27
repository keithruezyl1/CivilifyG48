package com.capstone.civilify.controller;

import com.capstone.civilify.dto.EnhancedRAGResponse;
import com.capstone.civilify.dto.RAGMetadata;
import com.capstone.civilify.model.ChatConversation;
import com.capstone.civilify.model.ChatMessage;
import com.capstone.civilify.service.ChatService;
import com.capstone.civilify.service.OpenAIService;
import com.capstone.civilify.service.EnhancedKnowledgeBaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Enhanced OpenAI Controller implementing Villy's KB-first RAG approach.
 * Follows SOLID principles with clear separation of concerns.
 */
@RestController
@RequestMapping("/api/ai")
public class EnhancedOpenAIController {
    
    private static final Logger logger = LoggerFactory.getLogger(EnhancedOpenAIController.class);
    
    @Autowired
    private OpenAIService openAIService;
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private EnhancedKnowledgeBaseService enhancedKBService;
    
    /**
     * Enhanced chat endpoint with KB-first RAG approach.
     * Implements Villy's confidence gating and hybrid retrieval.
     */
    @PostMapping("/chat")
    public ResponseEntity<?> generateEnhancedChatResponse(@RequestBody Map<String, String> request) {
        try {
            logger.info("Received enhanced chat request: {}", request);
            
            String userMessage = request.get("message");
            String mode = request.getOrDefault("mode", "A");
            String conversationId = request.get("conversationId");
            String userId = request.get("userId");
            String userEmail = request.get("userEmail");
            
            logger.info("Processing enhanced message: '{}' with mode: {}", userMessage, mode);
            
            // Validate input
            if (userMessage == null || userMessage.trim().isEmpty()) {
                logger.warn("Empty message received");
                return ResponseEntity.badRequest().body(createErrorResponse("Message is required"));
            }
            
            if (userEmail == null || userEmail.trim().isEmpty()) {
                logger.warn("No user email provided");
                return ResponseEntity.badRequest().body(createErrorResponse("User email is required"));
            }
            
            // Get or create conversation
            ChatConversation conversation = getOrCreateConversation(conversationId, userId, userEmail, mode);
            conversationId = conversation.getId();
            
            // Add user message to conversation
            ChatMessage userChatMessage;
            try {
                userChatMessage = chatService.addMessage(
                    conversationId, userId, userEmail, userMessage, true);
                logger.info("Added user message to conversation: {}", userChatMessage.getId());
            } catch (Exception e) {
                logger.error("Failed to add user message to conversation", e);
                throw new RuntimeException("Failed to add user message: " + e.getMessage(), e);
            }
            
            // Step 1: Try KB-first approach first
            EnhancedRAGResponse kbResponse = enhancedKBService.chatWithKnowledgeBase(userMessage, mode);
            
            String finalAnswer;
            List<Map<String, Object>> sources = new ArrayList<>();
            RAGMetadata metadata = kbResponse.metadata();
            
            if (kbResponse.isHighConfidence() && kbResponse.isKBFirst()) {
                // High confidence KB response - use it directly
                logger.info("Using high-confidence KB response (confidence: {})", metadata.confidence());
                finalAnswer = kbResponse.answer();
                sources = convertKBEntriesToSources(kbResponse.sources());
                
            } else {
                // Low confidence or KB unavailable - fallback to OpenAI with KB context
                logger.info("Falling back to OpenAI with KB context (confidence: {})", metadata.confidence());
                
                // Get conversation history
                List<ChatMessage> conversationMessages = chatService.getConversationMessages(conversationId);
                List<Map<String, String>> conversationHistoryForAI = conversationMessages.stream()
                    .map(msg -> {
                        Map<String, String> messageMap = new HashMap<>();
                        messageMap.put("content", msg.getContent());
                        messageMap.put("isUserMessage", String.valueOf(msg.isUserMessage()));
                        return messageMap;
                    })
                    .collect(Collectors.toList());
                
                // Build enhanced system prompt with KB context
                String enhancedSystemPrompt = buildEnhancedSystemPrompt(mode, kbResponse.sources(), metadata);
                
                // Generate OpenAI response with KB context
                finalAnswer = openAIService.generateResponse(
                    userMessage,
                    enhancedSystemPrompt,
                    conversationHistoryForAI,
                    mode
                );
                
                // Include KB sources even in fallback
                sources = convertKBEntriesToSources(kbResponse.sources());
                
                // Update metadata to reflect hybrid approach
                metadata = new RAGMetadata(
                    Math.max(metadata.confidence(), 0.3), // Minimum confidence for OpenAI fallback
                    false, // Not KB-first
                    metadata.usedSQG(),
                    false, // No reranking
                    "hybrid",
                    metadata.legalTopics()
                );
            }
            
            // Add AI response to conversation
            ChatMessage aiChatMessage;
            try {
                aiChatMessage = chatService.addMessage(
                    conversationId, null, "villy@civilify.com", finalAnswer, false);
                logger.info("Added AI response to conversation: {}", aiChatMessage.getId());
            } catch (Exception e) {
                logger.error("Failed to add AI response to conversation", e);
                // Don't throw here as the response is already generated
            }
            
            // Prepare enhanced response
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("response", finalAnswer);
            responseBody.put("conversationId", conversationId);
            responseBody.put("success", true);
            responseBody.put("sources", sources);
            responseBody.put("hasKnowledgeBaseContext", !sources.isEmpty());
            
            // Add RAG metadata
            responseBody.put("ragMetadata", Map.of(
                "confidence", metadata.confidence(),
                "kbFirst", metadata.kbFirst(),
                "usedSQG", metadata.usedSQG(),
                "retrievalMethod", metadata.retrievalMethod(),
                "legalTopics", metadata.legalTopics()
            ));
            
            // Extract plausibility information for CPA mode
            if ("B".equals(mode) && finalAnswer != null) {
                extractPlausibilityInfo(finalAnswer, responseBody);
            }
            
            logger.info("Enhanced chat response generated successfully");
            return ResponseEntity.ok(responseBody);
            
        } catch (Exception e) {
            logger.error("Error in enhanced chat response generation", e);
            return ResponseEntity.internalServerError()
                .body(createErrorResponse("Error generating chat response: " + e.getMessage()));
        }
    }
    
    /**
     * Build enhanced system prompt with KB context integration rules.
     * Based on Villy's strict grounding approach.
     */
    private String buildEnhancedSystemPrompt(String mode, List<com.capstone.civilify.dto.KnowledgeBaseEntry> kbSources, RAGMetadata metadata) {
        StringBuilder prompt = new StringBuilder();
        
        if ("A".equals(mode)) {
            // Enhanced GLI system prompt with KB integration
            prompt.append("YOU ARE VILLY, CIVILIFY'S AI-POWERED LEGAL ASSISTANT. ")
                  .append("YOUR ROLE IS TO ANSWER GENERAL LEGAL QUESTIONS CLEARLY, CALMLY, AND ACCURATELY, ")
                  .append("USING PHILIPPINE LAW AS THE DEFAULT REFERENCE UNLESS OTHERWISE SPECIFIED.\n\n");
            
            // KB Integration Rules
            if (!kbSources.isEmpty()) {
                prompt.append("### KNOWLEDGE BASE INTEGRATION RULES (CRITICAL) ###\n")
                      .append("- You have access to relevant legal knowledge base entries below.\n")
                      .append("- ALWAYS prioritize information from these entries over general knowledge.\n")
                      .append("- Quote and cite specific entries using parenthetical citations.\n")
                      .append("- If the KB entries don't fully answer the question, say so explicitly.\n")
                      .append("- NEVER contradict information from the knowledge base.\n\n");
                
                // Add KB context
                prompt.append("### KNOWLEDGE BASE CONTEXT ###\n");
                for (com.capstone.civilify.dto.KnowledgeBaseEntry entry : kbSources) {
                    prompt.append("Entry: ").append(entry.getTitle()).append("\n");
                    if (entry.getCanonicalCitation() != null) {
                        prompt.append("Citation: ").append(entry.getCanonicalCitation()).append("\n");
                    }
                    if (entry.getSummary() != null) {
                        prompt.append("Summary: ").append(entry.getSummary()).append("\n");
                    }
                    prompt.append("---\n");
                }
                prompt.append("\n");
            }
            
            // Add original GLI rules
            prompt.append("### FORMATTING & SOURCE RULES (ALWAYS FOLLOW) ###\n")
                  .append("- ALWAYS structure responses with clear formatting: bullet points, numbered lists, bold text, spacing, and section headers.\n")
                  .append("- ALWAYS include at least one relevant, reliable online source in every answer unless truly unnecessary.\n")
                  .append("- FORMAT sources as clickable links when possible (Markdown-style links are preferred).\n")
                  .append("- DISTINGUISH between the \"Answer Section\" and the \"Sources Section\":\n")
                  .append("  - Answer Section -> Main explanation in clear language.\n")
                  .append("  - Sources Section -> List of relevant links that validate or expand on the answer.\n")
                  .append("- IF multiple sources exist, PRIORITIZE government (.gov.ph), official, primary legal sources, then academic or leading legal publishers, and lastly reputable secondary sources.\n")
                  .append("- NEVER invent a source. If no reliable source is found, explicitly state:\n")
                  .append("  \"I could not find a directly relevant online source for this, but here is the general principle under Philippine law…\"\n\n");
            
        } else {
            // Enhanced CPA system prompt with KB integration
            prompt.append("You are Villy, Civilify's AI-powered legal assistant.\n\n")
                  .append("You are a separate digital entity operating under Civilify.\n")
                  .append("You are not Civilify itself — you are Villy, a bot created by Civilify to help users ")
                  .append("determine whether their legal concerns have plausible standing under Philippine law.\n\n");
            
            // KB Integration Rules for CPA
            if (!kbSources.isEmpty()) {
                prompt.append("### KNOWLEDGE BASE INTEGRATION RULES (CRITICAL) ###\n")
                      .append("- You have access to relevant legal knowledge base entries below.\n")
                      .append("- Use these entries to inform your case assessment.\n")
                      .append("- Reference specific legal provisions when applicable.\n")
                      .append("- If the KB entries don't cover the specific situation, note this limitation.\n\n");
                
                // Add KB context
                prompt.append("### RELEVANT LEGAL CONTEXT ###\n");
                for (com.capstone.civilify.dto.KnowledgeBaseEntry entry : kbSources) {
                    prompt.append("Legal Provision: ").append(entry.getTitle()).append("\n");
                    if (entry.getCanonicalCitation() != null) {
                        prompt.append("Citation: ").append(entry.getCanonicalCitation()).append("\n");
                    }
                    if (entry.getSummary() != null) {
                        prompt.append("Summary: ").append(entry.getSummary()).append("\n");
                    }
                    prompt.append("---\n");
                }
                prompt.append("\n");
            }
            
            // Add original CPA rules
            prompt.append("Your task is to:\n")
                  .append("- Understand the user's personal legal situation.\n")
                  .append("- Ask one meaningful follow-up question at a time to clarify the facts.\n")
                  .append("- After you have gathered enough information to make a reasonable assessment, ")
                  .append("generate a structured case assessment report that includes:\n\n")
                  .append("Case Summary:\nA concise summary of the user's situation.\n\n")
                  .append("Legal Issues or Concerns:\n- Bullet points of relevant legal issues.\n\n")
                  .append("Plausibility Score: [number]% - [label]\n")
                  .append("Suggested Next Steps:\n- Bullet points of practical next steps.\n\n")
                  .append("Sources:\n- As much as possible, provide at least one online link to a working, ")
                  .append("reputable reference (such as a law, government website, or legal guide) ")
                  .append("that supports your assessment.\n")
                  .append("At the end, add this disclaimer: This is a legal pre-assessment only. ")
                  .append("If your situation is serious or urgent, please consult a licensed lawyer.\n\n");
        }
        
        // Add confidence and SQG information
        if (metadata != null) {
            prompt.append("### RETRIEVAL METADATA ###\n")
                  .append("- Confidence Score: ").append(String.format("%.1f%%", metadata.confidence() * 100)).append("\n")
                  .append("- Retrieval Method: ").append(metadata.retrievalMethod()).append("\n");
            
            if (!metadata.legalTopics().isEmpty()) {
                prompt.append("- Detected Legal Topics: ").append(String.join(", ", metadata.legalTopics())).append("\n");
            }
            prompt.append("\n");
        }
        
        return prompt.toString();
    }
    
    /**
     * Get or create conversation following DRY principles.
     */
    private ChatConversation getOrCreateConversation(String conversationId, String userId, String userEmail, String mode) {
        ChatConversation conversation = null;
        
        if (conversationId != null && !conversationId.isEmpty()) {
            try {
                conversation = chatService.getConversation(conversationId);
                if (conversation != null) {
                    logger.info("Retrieved existing conversation: {}", conversationId);
                }
            } catch (Exception e) {
                logger.warn("Could not retrieve conversation: {}", e.getMessage());
            }
        }
        
        if (conversation == null) {
            try {
                String title = "Chat with Villy - " + (mode.equals("A") ? "General Assistance" : "Case Assessment");
                conversation = chatService.createConversation(userId, userEmail, title);
                logger.info("Created new conversation with ID: {}", conversation.getId());
            } catch (Exception e) {
                logger.error("Failed to create conversation", e);
                throw new RuntimeException("Failed to create conversation: " + e.getMessage(), e);
            }
        }
        
        return conversation;
    }
    
    /**
     * Convert KB entries to source format for response.
     */
    private List<Map<String, Object>> convertKBEntriesToSources(List<com.capstone.civilify.dto.KnowledgeBaseEntry> entries) {
        return entries.stream()
            .map(entry -> {
                Map<String, Object> source = new HashMap<>();
                source.put("entryId", entry.getEntryId());
                source.put("title", entry.getTitle());
                source.put("type", entry.getType());
                source.put("canonicalCitation", entry.getCanonicalCitation());
                source.put("summary", entry.getSummary());
                source.put("similarity", entry.getSimilarity());
                return source;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Extract plausibility information from CPA response.
     */
    private void extractPlausibilityInfo(String response, Map<String, Object> responseBody) {
        try {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "Plausibility Score:\\s*\\d{1,3}%\\s*-\\s*([\\w\\s]+?)(?=\\.|\\n|$)(?:[\\.:\\-\\s]*)([^\n]*)",
                java.util.regex.Pattern.CASE_INSENSITIVE
            );
            java.util.regex.Matcher matcher = pattern.matcher(response);
            if (matcher.find()) {
                String plausibilityLabel = matcher.group(1).trim();
                String plausibilitySummary = matcher.group(2).trim();
                
                if (plausibilitySummary.isEmpty() || plausibilitySummary.toLowerCase().contains("suggested next steps")) {
                    plausibilitySummary = null;
                }
                
                responseBody.put("plausibilityLabel", plausibilityLabel);
                if (plausibilitySummary != null) {
                    responseBody.put("plausibilitySummary", plausibilitySummary);
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to extract plausibility information", e);
        }
    }
    
    /**
     * Create error response following consistent format.
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", message);
        errorResponse.put("response", "I apologize, but I encountered an error processing your request. Please try again later.");
        return errorResponse;
    }
}
