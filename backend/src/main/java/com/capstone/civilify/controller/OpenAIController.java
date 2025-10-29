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
    
    // Endpoint to delete all previous conversations for a user
    @PostMapping("/delete-previous-conversations")
    public ResponseEntity<?> deleteAllPreviousConversations(@RequestBody Map<String, String> request) {
        try {
            String userEmail = request.get("userEmail");
            String excludeConversationId = request.get("excludeConversationId");
            
            if (userEmail == null || userEmail.trim().isEmpty()) {
                logger.warn("No user email provided for deleting conversations");
                return ResponseEntity.badRequest().body(createErrorResponse("User email is required"));
            }
            
            // First check if the user has any conversations to delete
            boolean hasConversations = chatService.userHasConversations(userEmail);
            
            // Only proceed with deletion if conversations exist
            int deletedCount = 0;
            if (hasConversations) {
                if (excludeConversationId != null && !excludeConversationId.trim().isEmpty()) {
                    deletedCount = chatService.deleteAllUserConversationsExcept(userEmail, excludeConversationId);
                } else {
                    deletedCount = chatService.deleteAllUserConversations(userEmail);
                }
                logger.info("Deleted {} previous conversations for user: {} (excluding {})", deletedCount, userEmail, excludeConversationId);
            } else {
                logger.info("No conversations found to delete for user: {}", userEmail);
            }
            
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", true);
            responseBody.put("message", deletedCount > 0 ? "Successfully deleted previous conversations" : "No conversations found to delete");
            responseBody.put("deletedCount", deletedCount);
            responseBody.put("conversationsExisted", hasConversations);
            
            return ResponseEntity.ok(responseBody);
        } catch (Exception e) {
            logger.error("Error deleting previous conversations", e);
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("Error deleting previous conversations: " + e.getMessage()));
        }
    }
    
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
                systemPrompt = "YOU ARE VILLY, CIVILIFY'S AI-POWERED LEGAL ASSISTANT.\n\n" +
                    "ROLE: Answer ONLY general legal questions using Philippine law as default reference.\n\n" +
                    "STRICT SCOPE:\n" +
                    "- ONLY answer questions related to Philippine law, legal processes, rights, duties, and legal concepts\n" +
                    "- DO NOT answer general knowledge questions (math, science, history, geography, etc.)\n" +
                    "- DO NOT answer personal advice, medical, financial, or non-legal questions\n" +
                    "- For non-legal questions: Politely redirect to legal topics ONLY\n" +
                    "- Example redirect: \"I specialize in Philippine legal information. Please ask me about laws, legal processes, or legal rights instead.\"\n\n" +
                    "RESPONSE FORMAT:\n" +
                    "- Use clear headings, bullet points, and numbered lists\n" +
                    "- Be concise but comprehensive\n" +
                    "- Use plain language, avoid legalese\n" +
                    "- Structure information logically (general to specific)\n" +
                    "- Include actionable information when possible\n" +
                    "- Use examples to clarify complex legal concepts\n\n" +
                    "BEHAVIOR:\n" +
                    "- For legal questions: Provide accurate, helpful information\n" +
                    "- For non-legal questions: Redirect to legal topics without answering the original question\n" +
                    "- Always be professional and respectful\n" +
                    "- When uncertain: Acknowledge limitations and recommend consulting a licensed attorney\n\n" +
                    "LIMITATIONS:\n" +
                    "- Do not provide legal advice or representation\n" +
                    "- Do not draft legal documents\n" +
                    "- Do not connect users with lawyers\n" +
                    "- Recommend consulting licensed attorneys for serious matters\n\n" +
                    "SOURCES: Include relevant sources in your response using this format:\n" +
                    "- [Source Title](URL)\n" +
                    "- [Another Source](URL)\n" +
                    "Do not include a 'Sources:' header - just list the links directly after your main content.\n" +
                    "Only include sources that are relevant to the legal question asked.\n\n" +
                    "You are Villy, created by Civilify to help with legal questions using Philippine law.";
            } else {
                // Case Plausibility Assessment Mode
                systemPrompt = "You are Villy, Civilify's AI-powered legal assistant.\n\n" +
                    "ROLE: Help users assess the plausibility of their legal cases under Philippine law.\n\n" +
                    "CONVERSATION FLOW:\n" +
                    "- Always respond with helpful, relevant questions or information\n" +
                    "- Ask one meaningful follow-up question at a time to clarify facts\n" +
                    "- Be empathetic and supportive, especially for serious legal matters\n" +
                    "- NEVER leave responses blank or empty\n" +
                    "- If uncertain, ask clarifying questions rather than staying silent\n\n" +
                    "ASSESSMENT PROCESS:\n" +
                    "- Gather key facts: what happened, where, when, who was involved\n" +
                    "- Understand the user's goal: file a case, defend against charges, etc.\n" +
                    "- Ask about legal documents: subpoenas, complaints, police reports\n" +
                    "- When you have enough information, provide a structured assessment\n\n" +
                    "ASSESSMENT FORMAT:\n" +
                    "Case Summary:\n[Brief summary of the situation]\n\n" +
                    "Legal Issues:\n- [Key legal issues identified]\n\n" +
                    "Plausibility Score: [X]% - [Label]\n\n" +
                    "Suggested Next Steps:\n- [Practical recommendations]\n\n" +
                    "DISCLAIMER: This is a legal pre-assessment only. If your situation is serious or urgent, please consult a licensed lawyer.\n\n" +
                    "IMPORTANT: Always provide a response. Never leave the user without guidance or next steps.";
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
            
            // Do NOT re-save the user message here to avoid duplicates; frontend already persists it
            logger.info("Skipping backend user-message save to avoid duplicates (conversationId={})", conversationId);
            
            // Prepare conversation history for OpenAI
            List<Map<String, String>> conversationHistoryForAI = conversationMessages.stream()
                .map(msg -> {
                    Map<String, String> messageMap = new HashMap<>();
                    messageMap.put("content", msg.getContent());
                    messageMap.put("isUserMessage", String.valueOf(msg.isUserMessage()));
                    return messageMap;
                })
                .collect(Collectors.toList());
            
            // Limit conversation history for CPA mode to prevent context confusion
            if ("B".equals(mode) && conversationHistoryForAI.size() > 8) {
                logger.info("CPA: Limiting conversation history from {} to 8 messages", conversationHistoryForAI.size());
                conversationHistoryForAI = conversationHistoryForAI.subList(
                    Math.max(0, conversationHistoryForAI.size() - 8), 
                    conversationHistoryForAI.size()
                );
            }
            
            logger.info("Conversation history prepared: {} messages for conversation {}", 
                conversationHistoryForAI.size(), conversationId);
            
            // Mode-aware KB usage
            String primaryKbAnswer = null;
            java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> kbSources = new java.util.ArrayList<>();

            if ("A".equals(mode)) {
                // GLI: KB-first to gather context and sources for UI, but do NOT print "Sources:" in the AI text
                com.capstone.civilify.DTO.KnowledgeBaseChatResponse kbResponse =
                    openAIService.getKnowledgeBaseService().chatWithKnowledgeBaseEnhanced(userMessage, mode);

                if (kbResponse != null && !kbResponse.hasError()) {
                    primaryKbAnswer = kbResponse.getAnswer();
                    if (kbResponse.getSources() != null) {
                        kbSources.addAll(kbResponse.getSources());
                    }
                    logger.info("GLI: KB response obtained: answer length={}, sources count={}",
                        primaryKbAnswer != null ? primaryKbAnswer.length() : 0, kbSources.size());
                } else {
                    logger.warn("GLI: KB response failed or empty: {}", kbResponse != null ? kbResponse.getError() : "null response");
                }
            } else {
                // CPA: Do not call KB during conversational probing phase (performance + avoid blank responses)
                logger.info("CPA: Skipping KB calls during conversational phase.");
            }

            // Step 2: Generate enhanced AI response with KB context (GLI may include KB context; CPA will pass nulls here)
            String enhancedSystemPrompt = buildEnhancedSystemPrompt(systemPrompt, primaryKbAnswer, kbSources, mode);
            
            String aiResponse;
            try {
                aiResponse = openAIService.generateResponse(
                    userMessage,
                    enhancedSystemPrompt,
                    conversationHistoryForAI,
                    mode
                );
                logger.info("Enhanced AI response generated with mode {} using KB context. Response length: {}", 
                    mode, aiResponse != null ? aiResponse.length() : 0);
            } catch (Exception e) {
                logger.error("Error generating AI response: {}", e.getMessage(), e);
                aiResponse = "I apologize, but I'm experiencing technical difficulties. Please try again or consult with a licensed attorney for urgent matters.";
            }
            
            // Handle blank responses - provide fallback
            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                logger.warn("AI generated blank response, providing fallback");
                if ("B".equals(mode)) {
                    aiResponse = "I understand you're going through a difficult situation. Could you please provide more details about your case so I can better assist you? For urgent legal matters, I recommend consulting with a licensed attorney immediately.";
                } else {
                    aiResponse = "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question or ask about Philippine legal matters.";
                }
            }

            // GLI: Allow AI to include sources as instructed in system prompt
            
            // Add AI response to the conversation BEFORE report processing
            ChatMessage aiChatMessage = chatService.addMessage(
                conversationId, null, "villy@civilify.com", aiResponse, false);
            logger.info("Added AI response to conversation: {}", aiChatMessage.getId());

            // CPA: Extract and persist structured facts after each user turn to build memory
            Double latestCompleteness = null;
            java.util.List<String> missingSlots = new java.util.ArrayList<>();
            boolean reportTriggered = false;
            String reportContent = null;
            if ("B".equals(mode)) {
                try {
                    long t0 = System.currentTimeMillis();
                    Map<String, Object> facts = openAIService.extractCaseFacts(conversationHistoryForAI, userMessage);
                    long t1 = System.currentTimeMillis();
                    logger.info("CPA: extractor latency={}ms", (t1 - t0));
                    if (facts != null && !facts.isEmpty()) {
                        Double confidence = null;
                        Object c = facts.get("confidence");
                        if (c instanceof Number n) confidence = n.doubleValue();
                        chatService.addFactsMessage(conversationId, facts, confidence);
                        double score = openAIService.computeCompletenessScore(facts);
                        latestCompleteness = score;
                        missingSlots = openAIService.computeMissingSlots(facts);
                        chatService.updateCompletenessScore(conversationId, score);
                        logger.info("CPA: Extracted facts saved (confidence={}), completeness={}", confidence, score);

                        boolean explicitRequest = userMessage.toLowerCase().matches(".*(assess|assessment|report|score|plausibility).*\u0000?");
                        boolean thresholdReached = score >= 70.0;
                        if (explicitRequest || thresholdReached) {
                            String triggerReason = explicitRequest ? "explicit_request" : "threshold_reached";
                            // Fetch KB only now using synthesized query from facts
                            try {
                                String kbQuery = openAIService.synthesizeKbQueryFromFacts(facts);
                                java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> kbForReport =
                                    openAIService.getKnowledgeBaseSources(kbQuery);

                                // Compose report from facts + KB
                                java.util.Map<String, String> digest = new java.util.LinkedHashMap<>();
                                int take = Math.min(4, conversationHistoryForAI.size());
                                for (int i = conversationHistoryForAI.size() - take; i < conversationHistoryForAI.size(); i++) {
                                    java.util.Map<String, String> m = conversationHistoryForAI.get(i);
                                    String role = "true".equals(m.get("isUserMessage")) ? "User" : "Assistant";
                                    String content = m.get("content");
                                    if (content != null && content.length() > 300) content = content.substring(0, 300);
                                    digest.put(role, content);
                                }
                                long r0 = System.currentTimeMillis();
                                reportContent = openAIService.composeReportFromFacts(digest, facts, kbForReport);
                                long r1 = System.currentTimeMillis();
                                logger.info("CPA: report composed in {}ms (reason={})", (r1 - r0), triggerReason);
                                if (reportContent != null && !reportContent.isBlank()) {
                                    chatService.addReportMessage(conversationId, reportContent);
                                    reportTriggered = true;
                                }
                            } catch (Exception rex) {
                                logger.warn("CPA: Report generation failed: {}", rex.getMessage());
                            }
                        }
                    } else {
                        logger.info("CPA: No facts extracted this turn");
                    }
                } catch (Exception ex) {
                    logger.warn("CPA: Failed to extract/persist facts: {}", ex.getMessage());
                }
            }
            
            // Step 3: Source enrichment rules per mode
            if ("A".equals(mode)) {
                // GLI: Always ensure we have sources from KB - try multiple approaches if needed
                if (kbSources.isEmpty()) {
                    logger.info("GLI: No sources from initial KB response, attempting additional search");
                    int desiredLimit = computeDesiredSourceLimit(userMessage);
                    java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> additionalKbEntries =
                        openAIService.getKnowledgeBaseSources(userMessage, desiredLimit);
                    if (additionalKbEntries != null) {
                        kbSources.addAll(additionalKbEntries);
                    }
                    logger.info("GLI: Additional KB sources obtained: {}", kbSources.size());
                }
                
                // If still no sources, try a broader search with keywords
                if (kbSources.isEmpty()) {
                    logger.info("GLI: Still no sources, attempting broader keyword search");
                    String[] keywords = userMessage.toLowerCase().split("\\s+");
                    for (String keyword : keywords) {
                        if (keyword.length() > 3) { // Only search meaningful keywords
                            int desiredLimit = computeDesiredSourceLimit(userMessage);
                            java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> keywordResults =
                                openAIService.getKnowledgeBaseSources(keyword, desiredLimit);
                            if (keywordResults != null && !keywordResults.isEmpty()) {
                                kbSources.addAll(keywordResults);
                                logger.info("GLI: Found sources for keyword '{}': {}", keyword, keywordResults.size());
                                break; // Stop at first successful keyword search
                            }
                        }
                    }
                }
            }

            java.util.List<java.util.Map<String, Object>> sources = new java.util.ArrayList<>();
            
            // Only provide sources for law-related queries
            boolean shouldProvideSources = isLawRelatedQuery(userMessage, aiResponse);
            
            if (shouldProvideSources && kbSources != null && !kbSources.isEmpty()) {
                // Limit to maximum 3 sources for relevance
                int maxSources = Math.min(kbSources.size(), 3);
                for (int i = 0; i < maxSources; i++) {
                    com.capstone.civilify.DTO.KnowledgeBaseEntry entry = kbSources.get(i);
                    Map<String, Object> source = new HashMap<>();
                    source.put("entryId", entry.getEntryId());
                    source.put("title", entry.getTitle());
                    source.put("type", entry.getType());
                    source.put("canonicalCitation", entry.getCanonicalCitation());
                    source.put("summary", entry.getSummary());
                    // Only include source URLs if they exist and are valid
                    if (entry.getSourceUrls() != null && !entry.getSourceUrls().isEmpty()) {
                        // Filter out any invalid or empty URLs
                        List<String> validUrls = entry.getSourceUrls().stream()
                            .filter(url -> url != null && !url.trim().isEmpty() && url.startsWith("http"))
                            .collect(Collectors.toList());
                        if (!validUrls.isEmpty()) {
                            source.put("sourceUrls", validUrls);
                        }
                    }
                    sources.add(source);
                }
                logger.info("Providing {} sources for law-related query", sources.size());
            } else {
                logger.info("Not providing sources - query not law-related or no KB sources available");
            }
            logger.info("Knowledge base sources included in response: {}", sources.size());
            
            // GLI: Let AI include sources as instructed in system prompt - no backend appending needed
            
            // Prepare response
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("response", aiResponse);
            responseBody.put("conversationId", conversationId);
            responseBody.put("success", true);
            responseBody.put("sources", new java.util.ArrayList<>()); // Empty sources array since we're integrating them into response
            responseBody.put("hasKnowledgeBaseContext", shouldProvideSources && !sources.isEmpty());
            if ("B".equals(mode)) {
                if (latestCompleteness != null) responseBody.put("completenessScore", latestCompleteness);
                responseBody.put("missingSlots", missingSlots);
                responseBody.put("reportTriggered", reportTriggered);
                if (reportTriggered && reportContent != null) responseBody.put("reportPreview", reportContent);
            }

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
                    // CPA: Only now fetch KB sources to support the report
                    try {
                        // Build full conversation context for KB search
                        StringBuilder fullContext = new StringBuilder();
                        fullContext.append("User's current message: ").append(userMessage).append("\n\n");
                        fullContext.append("Conversation history:\n");
                        
                        for (Map<String, String> msg : conversationHistoryForAI) {
                            String role = msg.get("isUserMessage").equals("true") ? "User" : "Assistant";
                            fullContext.append(role).append(": ").append(msg.get("content")).append("\n");
                        }
                        
                        String fullContextString = fullContext.toString();
                        logger.info("CPA: Using full conversation context for KB search (length: {})", fullContextString.length());
                        
                        int desiredLimitForReport = computeDesiredSourceLimit(userMessage);
                        java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> reportSources =
                            openAIService.getKnowledgeBaseSources(fullContextString, desiredLimitForReport);
                        if (reportSources != null) {
                            // Merge into kbSources without duplicates by entryId
                            java.util.Map<String, com.capstone.civilify.DTO.KnowledgeBaseEntry> uniq = new java.util.LinkedHashMap<>();
                            for (com.capstone.civilify.DTO.KnowledgeBaseEntry e : kbSources) {
                                if (e.getEntryId() != null) uniq.put(e.getEntryId(), e);
                            }
                            for (com.capstone.civilify.DTO.KnowledgeBaseEntry e : reportSources) {
                                if (e.getEntryId() != null) uniq.put(e.getEntryId(), e);
                            }
                            kbSources = new java.util.ArrayList<>(uniq.values());
                        }
                        logger.info("CPA: KB sources fetched for report: {}", kbSources.size());
                    } catch (Exception ex) {
                        logger.warn("CPA: Failed fetching KB sources for report: {}", ex.getMessage());
                    }
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
    
    /**
     * Build enhanced system prompt with KB context for Villy RAG
     */
    /**
     * Determines if a query is law-related based on user message and AI response
     */
    private boolean isLawRelatedQuery(String userMessage, String aiResponse) {
        if (userMessage == null || aiResponse == null) {
            return false;
        }
        
        String lowerUserMessage = userMessage.toLowerCase();
        String lowerAiResponse = aiResponse.toLowerCase();
        
        // Non-law-related queries that should not have sources
        String[] nonLegalPatterns = {
            "who are you", "what are you", "what is your", "what can you do", 
            "what are your capabilities", "introduce yourself", "tell me about yourself",
            "hello", "hi", "good morning", "good afternoon", "good evening",
            "how are you", "thank you", "thanks", "bye", "goodbye"
        };
        
        // Check if user message matches non-legal patterns
        for (String pattern : nonLegalPatterns) {
            if (lowerUserMessage.contains(pattern)) {
                return false;
            }
        }
        
        // Check if AI response indicates it's not providing legal information
        String[] nonLegalResponsePatterns = {
            "i am villy", "i am designed to assist", "my capabilities", 
            "i can help", "i'm here to help", "what would you like to ask",
            "general legal information", "case plausibility assessment"
        };
        
        for (String pattern : nonLegalResponsePatterns) {
            if (lowerAiResponse.contains(pattern) && lowerAiResponse.length() < 200) {
                return false;
            }
        }
        
        // Check if AI response contains legal terms (indicating it's law-related)
        String[] legalTerms = {
            "law", "legal", "statute", "act", "code", "article", "section", 
            "court", "judge", "lawyer", "attorney", "rights", "duties", 
            "penalty", "punishment", "crime", "criminal", "civil", "contract",
            "property", "family", "marriage", "divorce", "inheritance", "tax",
            "constitution", "bill", "amendment", "regulation", "ordinance",
            "obligations", "liability", "damages", "compensation", "agreement",
            "violation", "fine", "legal advice", "jurisdiction", "precedent",
            "lawsuit", "litigation", "mediation", "arbitration", "settlement",
            "evidence", "testimony", "witness", "plaintiff", "defendant",
            "prosecution", "defense", "verdict", "judgment", "appeal",
            "bail", "arrest", "detention", "custody", "probation", "parole",
            "tort", "negligence", "fraud", "theft", "assault", "battery",
            "defamation", "libel", "slander", "copyright", "patent", "trademark",
            "employment", "labor", "discrimination", "harassment", "termination",
            "immigration", "citizenship", "visa", "deportation", "asylum",
            "bankruptcy", "debt", "credit", "loan", "mortgage", "foreclosure",
            "insurance", "coverage", "claim", "premium", "deductible",
            "real estate", "landlord", "tenant", "lease", "eviction",
            "business", "corporation", "partnership", "sole proprietorship",
            "intellectual property", "trade secret", "confidentiality",
            "environmental", "zoning", "permits", "licenses", "compliance"
        };
        
        for (String term : legalTerms) {
            if (lowerUserMessage.contains(term) || lowerAiResponse.contains(term)) {
                return true;
            }
        }
        
        // If AI response is very short and doesn't contain legal terms, likely not law-related
        if (lowerAiResponse.length() < 150 && !lowerAiResponse.contains("law")) {
            return false;
        }
        
        // Default to true for longer responses that might be law-related
        return lowerAiResponse.length() > 200;
    }

    /**
     * Determine desired number of KB sources from the user's message.
     * Defaults to 4. Allows 1..10. If user mentions a number before 'source(s)/citations/references', use it.
     * If user asks for 'multiple/more sources' without a number, use 6.
     */
    private int computeDesiredSourceLimit(String userMessage) {
        int defaultLimit = 4;
        if (userMessage == null) return defaultLimit;
        String lower = userMessage.toLowerCase();
        java.util.regex.Pattern p = java.util.regex.Pattern.compile("(\\d{1,2})\\s*(source|sources|citation|citations|reference|references)");
        java.util.regex.Matcher m = p.matcher(lower);
        if (m.find()) {
            try {
                int n = Integer.parseInt(m.group(1));
                if (n < 1) n = 1;
                if (n > 10) n = 10;
                return n;
            } catch (NumberFormatException ignore) {}
        }
        if (lower.contains("multiple sources") || lower.contains("more sources") || lower.contains("several sources")) {
            return 6;
        }
        return defaultLimit;
    }

    private String buildEnhancedSystemPrompt(String baseSystemPrompt, String primaryKbAnswer,
                                           java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> kbSources, String mode) {
        StringBuilder enhancedPrompt = new StringBuilder(baseSystemPrompt);
        
        // Add KB context if available and meaningful
        if (primaryKbAnswer != null && !primaryKbAnswer.trim().isEmpty() && 
            !primaryKbAnswer.trim().equalsIgnoreCase("I don't know") && 
            !primaryKbAnswer.trim().equalsIgnoreCase("No relevant information found")) {
            
            enhancedPrompt.append("\n\nKNOWLEDGE BASE CONTEXT:\n");
            enhancedPrompt.append("The following information was retrieved from the legal knowledge base:\n\n");
            enhancedPrompt.append(primaryKbAnswer);
            
            if (kbSources != null && !kbSources.isEmpty()) {
                enhancedPrompt.append("\n\nSUPPORTING LEGAL SOURCES:\n");
                for (com.capstone.civilify.DTO.KnowledgeBaseEntry source : kbSources) {
                    enhancedPrompt.append("- ").append(source.getTitle());
                    if (source.getCanonicalCitation() != null && !source.getCanonicalCitation().isEmpty()) {
                        enhancedPrompt.append(" (").append(source.getCanonicalCitation()).append(")");
                    }
                    // Include source URLs if available and valid
                    if (source.getSourceUrls() != null && !source.getSourceUrls().isEmpty()) {
                        enhancedPrompt.append(" - Available Sources: ");
                        for (int i = 0; i < source.getSourceUrls().size(); i++) {
                            if (i > 0) enhancedPrompt.append(", ");
                            enhancedPrompt.append(source.getSourceUrls().get(i));
                        }
                    }
                    enhancedPrompt.append("\n");
                }
            }
            
            enhancedPrompt.append("\nIMPORTANT: Base your response primarily on the knowledge base context provided above. ");
            enhancedPrompt.append("Use the specific legal provisions, citations, and information from the knowledge base. ");
            enhancedPrompt.append("Only cite sources that are explicitly mentioned in the knowledge base context above.");
            enhancedPrompt.append("\n\nSOURCE INSTRUCTIONS: Include relevant sources in your response using Markdown format: ");
            enhancedPrompt.append("- [Source Title](URL) ");
            enhancedPrompt.append("Do not include a 'Sources:' header - just list the links directly after your main content. ");
            enhancedPrompt.append("You may mention specific laws, acts, or regulations by name if they are essential to the main answer content. ");
            enhancedPrompt.append("Ensure your response is comprehensive and accurate based on the knowledge base context provided.");
        } else {
            enhancedPrompt.append("\n\nNOTE: No relevant information was found in the knowledge base for this query. ");
            enhancedPrompt.append("Provide general guidance while acknowledging this limitation. ");
            enhancedPrompt.append("Do not invent or hallucinate sources. If you cannot provide accurate information, ");
            enhancedPrompt.append("recommend consultation with a legal professional.");
        }
        
        return enhancedPrompt.toString();
    }
}