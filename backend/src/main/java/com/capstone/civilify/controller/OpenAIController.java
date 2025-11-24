package com.capstone.civilify.controller;

import com.capstone.civilify.model.ChatConversation;
import com.capstone.civilify.model.ChatMessage;
import com.capstone.civilify.service.ChatService;
import com.capstone.civilify.service.OpenAIService;
import com.capstone.civilify.util.KnowledgeBaseSkipClassifier;
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
    
    @Autowired
    private KnowledgeBaseSkipClassifier kbSkipClassifier;
    
    // CPA structured facts feature removed
    
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
                    "- Example redirect: \"I specialize in Philippine legal information. Please ask me about laws, legal processes, or legal rights instead.\"\n" +
                    "- CRITICAL: When a user asks a non-legal question (like math, general knowledge, etc.), DO NOT answer it. Instead, redirect them to legal topics.\n" +
                    "- If a user message contains both legal and non-legal questions, address ONLY the legal part and redirect the non-legal part.\n\n" +
                    "BEHAVIOR FOR NON-LEGAL QUESTIONS:\n" +
                    "- When you detect a non-legal question (math, science, history, general knowledge, etc.):\n" +
                    "  1. DO NOT provide the answer to the non-legal question\n" +
                    "  2. Politely redirect the user to legal topics\n" +
                    "  3. Example: \"I specialize in Philippine legal information. I can't answer math or general knowledge questions, but I'm here to help with legal matters. Please ask me about laws, legal processes, or legal rights instead.\"\n" +
                    "- If a message contains both legal and non-legal questions:\n" +
                    "  1. Address ONLY the legal question\n" +
                    "  2. Politely redirect the non-legal question without answering it\n" +
                    "  3. Example: \"Regarding your legal question [address legal part]... As for your math question, I specialize in legal matters. Please ask me about laws or legal processes instead.\"\n\n" +
                    "FORMATTING AND STYLE REQUIREMENTS:\n" +
                    "- ALWAYS capitalize the first letter of sentences, including list items\n" +
                    "- Ensure proper text alignment: all text should be left-aligned\n" +
                    "- List items must start with a capital letter (e.g., \"**Historical Context**: The current...\" not \"**historical context**: the current...\")\n" +
                    "- Maintain consistent formatting throughout your response\n" +
                    "- Use proper paragraph spacing and list indentation\n" +
                    "- Ensure all sentences, including those in lists, begin with uppercase letters\n\n" +
                    "ABOUT CIVILIFY MODES (when asked):\n" +
                    "Civilify offers TWO modes to assist users with Philippine legal matters:\n\n" +
                    "1. **General Legal Information (GLI) Mode** - This mode (the current mode you're in):\n" +
                    "   - Provides general legal information about Philippine laws, rights, and legal processes\n" +
                    "   - Answers questions about legal concepts, procedures, and requirements\n" +
                    "   - Offers educational legal information backed by authoritative sources\n" +
                    "   - Best for: Learning about laws, understanding legal rights, researching legal topics\n\n" +
                    "2. **Case Plausibility Assessment (CPA) Mode**:\n" +
                    "   - Analyzes specific legal situations and provides plausibility assessments\n" +
                    "   - Asks clarifying questions to gather case facts and details\n" +
                    "   - Generates structured reports with plausibility scores and recommended next steps\n" +
                    "   - Best for: Evaluating a specific legal situation, getting case-specific guidance\n\n" +
                    "IMPORTANT: When explaining modes, be accurate and specific about what Civilify does.\n\n" +
                    "RESPONSE FORMAT:\n" +
                    "- Use clear headings, bullet points, and numbered lists\n" +
                    "- Be concise but comprehensive\n" +
                    "- Use plain language, avoid legalese\n" +
                    "- Structure information logically (general to specific)\n" +
                    "- Include actionable information when possible\n" +
                    "- Use examples to clarify complex legal concepts\n\n" +
                    "BEHAVIOR:\n" +
                    "- For legal questions: Provide accurate, helpful information\n" +
                    "- For mode explanation questions: Use the information provided above\n" +
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
                    "STRICT SCOPE:\n" +
                    "- ONLY help with legal cases, legal situations, and legal questions under Philippine law\n" +
                    "- DO NOT answer general knowledge questions (math, science, history, geography, etc.)\n" +
                    "- DO NOT answer personal advice, medical, financial, or non-legal questions\n" +
                    "- For non-legal questions: Politely redirect to legal topics ONLY\n" +
                    "- Example redirect: \"I specialize in helping assess legal cases under Philippine law. Please share details about your legal situation, or ask me about legal matters related to your case instead.\"\n" +
                    "- CRITICAL: When a user asks a non-legal question (like math, general knowledge, etc.), DO NOT answer it. Instead, redirect them to legal topics.\n" +
                    "- If a user message contains both legal and non-legal questions, address ONLY the legal part and redirect the non-legal part.\n\n" +
                    "ABOUT CIVILIFY MODES (when asked):\n" +
                    "Civilify offers TWO modes to assist users with Philippine legal matters:\n\n" +
                    "1. **General Legal Information (GLI) Mode**:\n" +
                    "   - Provides general legal information about Philippine laws, rights, and legal processes\n" +
                    "   - Answers questions about legal concepts, procedures, and requirements\n" +
                    "   - Offers educational legal information backed by authoritative sources\n" +
                    "   - Best for: Learning about laws, understanding legal rights, researching legal topics\n\n" +
                    "2. **Case Plausibility Assessment (CPA) Mode** - This mode (the current mode you're in):\n" +
                    "   - Analyzes specific legal situations and provides plausibility assessments\n" +
                    "   - Asks clarifying questions to gather case facts and details\n" +
                    "   - Generates structured reports with plausibility scores and recommended next steps\n" +
                    "   - Best for: Evaluating a specific legal situation, getting case-specific guidance\n\n" +
                    "IMPORTANT: When explaining modes, be accurate and specific about what Civilify does.\n\n" +
                    "CRITICAL - WHEN TO USE CONVERSATIONAL RESPONSES (NOT REPORTS):\n" +
                    "- Questions about Civilify's features, modes, or capabilities: Answer conversationally, DO NOT generate a report\n" +
                    "- Questions about how to use the system: Answer conversationally, DO NOT generate a report\n" +
                    "- Greetings or general chitchat: Respond conversationally, DO NOT generate a report\n" +
                    "- Questions about what you can do: Answer conversationally, DO NOT generate a report\n" +
                    "- Non-legal questions (math, science, general knowledge): Redirect to legal topics, DO NOT answer them\n" +
                    "- ONLY generate structured assessment reports when analyzing ACTUAL LEGAL CASES with specific facts\n\n" +
                    "CONVERSATION FLOW:\n" +
                    "- Always respond with helpful, relevant questions or information\n" +
                    "- Ask one meaningful follow-up question at a time to clarify facts\n" +
                    "- Be empathetic and supportive, especially for serious legal matters\n" +
                    "- NEVER leave responses blank or empty\n" +
                    "- If uncertain, ask clarifying questions rather than staying silent\n" +
                    "- For mode explanation questions: Use the information provided above in a conversational manner\n" +
                    "- For non-legal questions: Politely redirect without answering the question\n\n" +
                    "BEHAVIOR FOR NON-LEGAL QUESTIONS:\n" +
                    "- When you detect a non-legal question (math, science, history, general knowledge, etc.):\n" +
                    "  1. DO NOT provide the answer to the non-legal question\n" +
                    "  2. Politely redirect the user to legal topics\n" +
                    "  3. Example: \"I specialize in helping assess legal cases under Philippine law. I can't answer math or general knowledge questions, but I'm here to help with your legal situation. Please share details about your legal case, or ask me about legal matters instead.\"\n" +
                    "- If a message contains both legal and non-legal questions:\n" +
                    "  1. Address ONLY the legal question\n" +
                    "  2. Politely redirect the non-legal question without answering it\n" +
                    "  3. Example: \"Regarding your legal situation [address legal part]... As for your math question, I specialize in legal matters. Please focus on your legal case instead.\"\n\n" +
                    "ASSESSMENT PROCESS (ONLY for actual legal cases with specific facts):\n" +
                    "- Gather key facts: what happened, where, when, who was involved\n" +
                    "- Understand the user's goal: file a case, defend against charges, etc.\n" +
                    "- Ask about legal documents: subpoenas, complaints, police reports\n" +
                    "- When you have enough information about an ACTUAL CASE, provide a structured assessment\n\n" +
                    "ASSESSMENT FORMAT (STRICT STRUCTURE - Follow exactly):\n" +
                    "Case Summary:\n[Brief summary of the situation in a single paragraph. No bullet points, no markdown bold markers, just plain text.]\n\n" +
                    "Legal Issues or Concerns:\n- [First key legal issue identified - no markdown bold markers]\n" +
                    "- [Second key legal issue identified - no markdown bold markers]\n" +
                    "- [Additional issues if applicable - no markdown bold markers]\n\n" +
                    "Plausibility Score: [X]% - [Label]\n" +
                    "[Label should be descriptive like 'Moderately Strong', 'Weak', 'Very Strong', 'Highly Likely', etc. No markdown bold markers.]\n\n" +
                    "Suggested Next Steps:\n" +
                    "1. **Step Label:** [Detailed description of the step - ONLY the label should be bold with **]\n" +
                    "2. **Step Label:** [Detailed description of the step - ONLY the label should be bold with **]\n" +
                    "3. **Step Label:** [Detailed description of the step - ONLY the label should be bold with **]\n" +
                    "[Continue with numbered list, each with bold label using **Label:** format]\n\n" +
                    "DISCLAIMER: This is a legal pre-assessment only. Please consult a licensed lawyer, especially if your situation is urgent. [Optional: Add a follow-up question if relevant]\n\n" +
                    "FORMATTING RULES:\n" +
                    "- Section headings (Case Summary, Legal Issues or Concerns, Plausibility Score, Suggested Next Steps, DISCLAIMER) should be plain text with colon, NO markdown bold (**)\n" +
                    "- Case Summary must be a single paragraph, no bullets, no markdown bold markers\n" +
                    "- Legal Issues or Concerns must use bullet points (-), no markdown bold markers in the content\n" +
                    "- Plausibility Score must be on its own line with plain heading, followed by percentage and label (no markdown bold)\n" +
                    "- Suggested Next Steps must be a numbered list (1., 2., 3., etc.)\n" +
                    "- Each step in Suggested Next Steps must have a bold label using **Label:** format (ONLY the label should be bold)\n" +
                    "- DISCLAIMER must be plain text with colon (no markdown bold), followed by the disclaimer text\n" +
                    "- Use proper spacing between sections (blank line between each major section)\n" +
                    "- DO NOT use ** for section headings - the frontend will style them automatically\n" +
                    "- ONLY use ** for step labels within Suggested Next Steps\n\n" +
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
            
            // Classify query to determine if KB lookup is needed
            boolean canSkipKB = kbSkipClassifier.canSkipKnowledgeBase(userMessage, mode, false);
            String classificationReason = kbSkipClassifier.getClassificationReason(userMessage, mode, false);
            logger.info("KB Skip Classification: {} - Reason: {}", canSkipKB ? "SKIP KB" : "USE KB", classificationReason);
            
            // Check if this is a meta/informational question about Civilify itself (should not trigger CPA report)
            boolean isMetaQuestion = isMetaOrInformationalQuestion(userMessage);
            if (isMetaQuestion) {
                logger.info("CPA: Detected meta/informational question - will skip report generation");
            }
            
            // Mode-aware KB usage
            String primaryKbAnswer = null;
            java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> kbSources = new java.util.ArrayList<>();

            if ("A".equals(mode)) {
                // GLI: Check if KB lookup can be skipped for faster response
                if (canSkipKB) {
                    logger.info("GLI: Skipping KB lookup - Query classified as: {}", classificationReason);
                } else {
                    // GLI: KB-first to gather context and sources for UI
                    logger.info("GLI: Fetching KB for query requiring legal provisions");
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
                }
            } else {
                // CPA: Do not call KB during conversational probing phase (performance + avoid blank responses)
                logger.info("CPA: Skipping KB calls during conversational phase. Classification: {}", classificationReason);
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
            
            // Defer saving AI response until after CPA report enrichment (if any)

            // CPA: Extract and persist structured facts after each user turn to build memory
            // CPA structured facts/report generation removed
            
            // Step 3: Source enrichment rules per mode
            if ("A".equals(mode) && !canSkipKB) {
                // GLI: Only attempt additional source enrichment if query requires KB
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
            } else if ("A".equals(mode) && canSkipKB) {
                logger.info("GLI: Skipping source enrichment for conversational query");
            }

            // Prepare initial response body (will be populated with sources later)
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
                // Check if this is a meta question - if so, never mark as report
                if (isMetaQuestion) {
                    responseBody.put("isReport", false);
                    logger.info("CPA: Meta question detected - marking as non-report (conversational response)");
                } else {
                    // Check if response contains actual report structure
                    boolean hasReportStructure = aiResponse != null && (
                        aiResponse.contains("Case Summary:") || 
                        aiResponse.contains("Plausibility Score:") ||
                        aiResponse.contains("Legal Issues or Concerns:")
                    );
                    
                    if (hasReportStructure) {
                        responseBody.put("isReport", true);
                    // CPA: Fetch KB sources based on what's actually mentioned in the report
                    try {
                        // NEW APPROACH: Extract citations/sources mentioned in the report response
                        List<String> citationsFromReport = extractCitationsFromReport(aiResponse);
                        logger.info("CPA: Extracted {} citations from report: {}", citationsFromReport.size(), citationsFromReport);
                        
                        java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> reportSources = new java.util.ArrayList<>();
                        int desiredLimitForReport = computeDesiredSourceLimit(userMessage);
                        
                        // Query KB API for each citation found in the report
                        if (!citationsFromReport.isEmpty()) {
                            for (String citation : citationsFromReport) {
                                logger.info("CPA: Querying KB API for citation: {}", citation);
                                java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> citationSources =
                                    openAIService.getKnowledgeBaseSources(citation, Math.max(2, desiredLimitForReport / citationsFromReport.size()));
                                if (citationSources != null && !citationSources.isEmpty()) {
                                    // Filter to only include sources that match the citation
                                    for (com.capstone.civilify.DTO.KnowledgeBaseEntry source : citationSources) {
                                        if (source != null && source.getEntryId() != null && 
                                            (source.getCanonicalCitation() != null && source.getCanonicalCitation().contains(citation) ||
                                             source.getTitle() != null && source.getTitle().toLowerCase().contains(citation.toLowerCase()))) {
                                            reportSources.add(source);
                                        }
                                    }
                                    logger.info("CPA: Found {} matching sources for citation: {}", citationSources.size(), citation);
                                }
                            }
                        }
                        
                        // If no sources found from citations, query based on legal concepts mentioned in the report
                        if (reportSources.isEmpty()) {
                            logger.info("CPA: No sources from citations, querying based on report content");
                            // Extract key legal terms from the actual report text (not just legal issues section)
                            String reportQuery = extractLegalConceptsFromReport(aiResponse);
                            if (reportQuery == null || reportQuery.isBlank()) {
                                reportQuery = userMessage;
                            }
                            if (reportQuery != null && !reportQuery.isBlank()) {
                                reportSources = openAIService.getKnowledgeBaseSources(reportQuery, desiredLimitForReport);
                                logger.info("CPA: Report-based KB search completed, returned {} sources", reportSources != null ? reportSources.size() : 0);
                            }
                        }
                        
                        logger.info("CPA: Total KB sources found: {}", reportSources != null ? reportSources.size() : 0);
                        
                        if (reportSources != null && !reportSources.isEmpty()) {
                            // Make aiResponse effectively final for lambda
                            final String finalAiResponse = aiResponse;
                            
                            // Validate that sources are from KB (must have entryId) and are relevant to the report
                            List<com.capstone.civilify.DTO.KnowledgeBaseEntry> validReportSources = reportSources.stream()
                                .filter(e -> e != null && e.getEntryId() != null && !e.getEntryId().trim().isEmpty())
                                .filter(e -> e.getSourceUrls() != null && !e.getSourceUrls().isEmpty())
                                .filter(e -> isSourceRelevantToReport(e, finalAiResponse)) // Filter to only include relevant sources
                                .collect(Collectors.toList());
                            
                            logger.info("CPA: KB search returned {} sources, {} have valid entryIds", 
                                reportSources.size(), validReportSources.size());
                            
                            for (com.capstone.civilify.DTO.KnowledgeBaseEntry e : validReportSources) {
                                logger.debug("KB source: entryId={}, title={}, similarity={}, hasUrls={}", 
                                    e.getEntryId(), e.getTitle(), e.getSimilarity(), 
                                    e.getSourceUrls() != null && !e.getSourceUrls().isEmpty());
                            }
                            
                            // Merge into kbSources without duplicates by entryId
                            java.util.Map<String, com.capstone.civilify.DTO.KnowledgeBaseEntry> uniq = new java.util.LinkedHashMap<>();
                            for (com.capstone.civilify.DTO.KnowledgeBaseEntry e : kbSources) {
                                if (e != null && e.getEntryId() != null && !e.getEntryId().trim().isEmpty()) {
                                    uniq.put(e.getEntryId(), e);
                                }
                            }
                            for (com.capstone.civilify.DTO.KnowledgeBaseEntry e : validReportSources) {
                                if (e.getEntryId() != null) {
                                    uniq.put(e.getEntryId(), e);
                                }
                            }
                            kbSources = new java.util.ArrayList<>(uniq.values());
                            logger.info("CPA: KB sources fetched for report: {} unique sources (all with entryIds)", kbSources.size());
                        } else {
                            logger.warn("CPA: KB search returned null or empty sources");
                        }

                        // Regenerate the report with KB context and strict source-citation instructions
                        String reportPrompt = buildEnhancedSystemPrompt(systemPrompt, null, kbSources, mode);
                        String regenerated = openAIService.generateResponse(
                            userMessage,
                            reportPrompt,
                            conversationHistoryForAI,
                            mode
                        );
                        if (regenerated != null && !regenerated.isBlank()) {
                            aiResponse = regenerated;
                            logger.info("CPA: Regenerated report with KB context and citations.");
                        }
                    } catch (Exception ex) {
                        logger.warn("CPA: Failed fetching KB sources for report: {}", ex.getMessage());
                    }
                    } else {
                        responseBody.put("isReport", false);
                        logger.info("CPA: No report structure detected - conversational response");
                    }
                }
            }
            
            // Prepare sources list for response (after CPA report generation to include KB sources)
            java.util.List<java.util.Map<String, Object>> sources = new java.util.ArrayList<>();
            
            // Determine if we should provide sources
            boolean shouldProvideSources;
            boolean hasReportStructure = aiResponse != null && (
                aiResponse.contains("Case Summary") || 
                aiResponse.contains("Plausibility Score") ||
                aiResponse.contains("Legal Issues")
            );
            
            if ("B".equals(mode) && hasReportStructure) {
                // CPA mode with report: Always try to provide sources if available
                shouldProvideSources = true; // Always try for CPA reports
                logger.info("CPA: Report detected, will attempt to provide sources ({} KB sources available)", 
                    kbSources != null ? kbSources.size() : 0);
            } else {
                // GLI mode or no report: Only provide sources for law-related queries
                shouldProvideSources = isLawRelatedQuery(userMessage, aiResponse);
                logger.debug("isLawRelatedQuery returned: {} for mode: {}", shouldProvideSources, mode);
            }
            
            if (shouldProvideSources && kbSources != null && !kbSources.isEmpty()) {
                // Filter and sort sources by relevance (similarity score)
                // Only include sources with valid entryId, title, and URLs (ensures they're from KB and have clickable links)
                List<com.capstone.civilify.DTO.KnowledgeBaseEntry> validSources = kbSources.stream()
                    .filter(entry -> entry != null 
                        && entry.getEntryId() != null && !entry.getEntryId().trim().isEmpty()
                        && entry.getTitle() != null && !entry.getTitle().trim().isEmpty()
                        && entry.getSourceUrls() != null && !entry.getSourceUrls().isEmpty()) // Must have URLs
                    .sorted((e1, e2) -> {
                        // Sort by similarity (higher is better), then by title for consistency
                        Double sim1 = e1.getSimilarity();
                        Double sim2 = e2.getSimilarity();
                        if (sim1 != null && sim2 != null) {
                            int compare = Double.compare(sim2, sim1); // Descending order
                            if (compare != 0) return compare;
                        } else if (sim1 != null) return -1;
                        else if (sim2 != null) return 1;
                        // If similarity is null or equal, sort by title
                        String title1 = e1.getTitle() != null ? e1.getTitle() : "";
                        String title2 = e2.getTitle() != null ? e2.getTitle() : "";
                        return title1.compareTo(title2);
                    })
                    .collect(Collectors.toList());
                
                // Limit to maximum 3 most relevant sources
                int maxSources = Math.min(validSources.size(), 3);
                logger.info("Filtered {} KB sources to {} most relevant sources with URLs", kbSources.size(), maxSources);
                
                for (int i = 0; i < maxSources; i++) {
                    com.capstone.civilify.DTO.KnowledgeBaseEntry entry = validSources.get(i);
                    Map<String, Object> source = new HashMap<>();
                    source.put("entryId", entry.getEntryId());
                    source.put("title", entry.getTitle());
                    source.put("type", entry.getType());
                    source.put("canonicalCitation", entry.getCanonicalCitation());
                    source.put("summary", entry.getSummary());
                    
                    // Log similarity score for debugging
                    if (entry.getSimilarity() != null) {
                        logger.debug("Including source: {} (similarity: {})", entry.getTitle(), entry.getSimilarity());
                    }
                    
                    // Only include source URLs if they exist and are valid
                    // These URLs come from KB API (if provided) or are generated from citations (as fallback)
                    if (entry.getSourceUrls() != null && !entry.getSourceUrls().isEmpty()) {
                        // Filter out any invalid or empty URLs
                        List<String> validUrls = entry.getSourceUrls().stream()
                            .filter(url -> url != null && !url.trim().isEmpty() && url.startsWith("http"))
                            .collect(Collectors.toList());
                        if (!validUrls.isEmpty()) {
                            source.put("sourceUrls", validUrls);
                            logger.info("Added {} source URLs for entry: {} (entryId: {})", 
                                validUrls.size(), entry.getTitle(), entry.getEntryId());
                        } else {
                            logger.debug("No valid URLs found for entry: {} (raw URLs: {})", entry.getTitle(), entry.getSourceUrls());
                        }
                    } else {
                        logger.warn("Entry '{}' (entryId: {}) has no sourceUrls - this should not happen for KB entries", 
                            entry.getTitle(), entry.getEntryId());
                    }
                    sources.add(source);
                }
                logger.info("Providing {} sources for law-related query (including CPA report sources)", sources.size());
            } else {
                logger.info("Not providing sources - query not law-related or no KB sources available");
            }
            logger.info("Knowledge base sources included in response: {}", sources.size());
            
            // Add sources to response body
            responseBody.put("sources", sources);
            responseBody.put("hasKnowledgeBaseContext", shouldProvideSources && !sources.isEmpty());

            // Now persist the final AI response (original or regenerated)
            ChatMessage aiChatMessage = chatService.addMessage(
                conversationId, null, "villy@civilify.com", aiResponse, false);
            logger.info("Added AI response to conversation: {}", aiChatMessage.getId());

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
            enhancedPrompt.append("\n\nACCURACY REQUIREMENT: Your analysis must accurately reflect the legal sources provided. ");
            enhancedPrompt.append("Do not make up legal provisions or citations. Only reference laws, articles, or acts that are ");
            enhancedPrompt.append("explicitly listed in the SUPPORTING LEGAL SOURCES section above.");
            
            if ("B".equals(mode)) {
                // CPA mode: Reinforce strict formatting requirements
                enhancedPrompt.append("\n\nCRITICAL FORMATTING REQUIREMENTS FOR CPA REPORT:\n");
                enhancedPrompt.append("- Section headings (Case Summary, Legal Issues or Concerns, Plausibility Score, Suggested Next Steps, DISCLAIMER) must be plain text with colon, NO markdown bold (**)\n");
                enhancedPrompt.append("- Follow the exact structure: Case Summary, Legal Issues or Concerns, Plausibility Score, Suggested Next Steps, DISCLAIMER\n");
                enhancedPrompt.append("- Case Summary must be a single paragraph (no bullets, no markdown bold)\n");
                enhancedPrompt.append("- Legal Issues or Concerns must use bullet points (-), no markdown bold in content\n");
                enhancedPrompt.append("- Suggested Next Steps must be numbered (1., 2., 3.) with bold labels using **Label:** format (ONLY labels should be bold)\n");
                enhancedPrompt.append("- DISCLAIMER must be plain text with colon (no markdown bold)\n");
                enhancedPrompt.append("- DO NOT use ** for section headings - only use ** for step labels within Suggested Next Steps\n");
                enhancedPrompt.append("- Integrate KB sources naturally into your analysis, but maintain the strict formatting structure above.");
                enhancedPrompt.append("\n\nSOURCE ACCURACY: The sources listed in SUPPORTING LEGAL SOURCES above are the ONLY sources you should reference. ");
                enhancedPrompt.append("Your legal analysis must be based on these specific sources. Do not reference laws or provisions that are not listed above.");
            } else {
                enhancedPrompt.append("\n\nSOURCE INSTRUCTIONS: Include relevant sources in your response using Markdown format: ");
                enhancedPrompt.append("- [Source Title](URL) ");
                enhancedPrompt.append("Do not include a 'Sources:' header - just list the links directly after your main content. ");
                enhancedPrompt.append("You may mention specific laws, acts, or regulations by name if they are essential to the main answer content. ");
                enhancedPrompt.append("Ensure your response is comprehensive and accurate based on the knowledge base context provided.");
            }
        } else {
            if ("B".equals(mode)) {
                // CPA mode: Even without KB, maintain formatting requirements
                enhancedPrompt.append("\n\nCRITICAL FORMATTING REQUIREMENTS FOR CPA REPORT:\n");
                enhancedPrompt.append("- Section headings (Case Summary, Legal Issues or Concerns, Plausibility Score, Suggested Next Steps, DISCLAIMER) must be plain text with colon, NO markdown bold (**)\n");
                enhancedPrompt.append("- Follow the exact structure: Case Summary, Legal Issues or Concerns, Plausibility Score, Suggested Next Steps, DISCLAIMER\n");
                enhancedPrompt.append("- Case Summary must be a single paragraph (no bullets, no markdown bold)\n");
                enhancedPrompt.append("- Legal Issues or Concerns must use bullet points (-), no markdown bold in content\n");
                enhancedPrompt.append("- Suggested Next Steps must be numbered (1., 2., 3.) with bold labels using **Label:** format (ONLY labels should be bold)\n");
                enhancedPrompt.append("- DISCLAIMER must be plain text with colon (no markdown bold)\n");
                enhancedPrompt.append("- DO NOT use ** for section headings - only use ** for step labels within Suggested Next Steps\n");
            } else {
                enhancedPrompt.append("\n\nNOTE: No relevant information was found in the knowledge base for this query. ");
                enhancedPrompt.append("Provide general guidance while acknowledging this limitation. ");
                enhancedPrompt.append("Do not invent or hallucinate sources. If you cannot provide accurate information, ");
                enhancedPrompt.append("recommend consultation with a legal professional.");
            }
        }
        
        return enhancedPrompt.toString();
    }
    
    /**
     * Extract citations and legal references mentioned in the report response.
     * This ensures we query KB API for sources that are actually mentioned in the report.
     */
    private List<String> extractCitationsFromReport(String reportText) {
        List<String> citations = new ArrayList<>();
        if (reportText == null || reportText.trim().isEmpty()) {
            return citations;
        }
        
        try {
            // Pattern 1: Rules of Court citations (e.g., "Rule 114 Sec. 21", "Rule 35, Section 6")
            java.util.regex.Pattern rocPattern = java.util.regex.Pattern.compile(
                "Rule\\s+(\\d+)(?:\\s*,\\s*)?(?:Section|Sec\\.?|Sec)\\s*(\\d+)",
                java.util.regex.Pattern.CASE_INSENSITIVE
            );
            java.util.regex.Matcher rocMatcher = rocPattern.matcher(reportText);
            while (rocMatcher.find()) {
                String citation = "Rules of Court, Rule " + rocMatcher.group(1) + 
                    (rocMatcher.group(2) != null ? " Sec. " + rocMatcher.group(2) : "");
                if (!citations.contains(citation)) {
                    citations.add(citation);
                }
            }
            
            // Pattern 2: Republic Act citations (e.g., "RA 9003", "Republic Act No. 11053")
            java.util.regex.Pattern raPattern = java.util.regex.Pattern.compile(
                "(?:R\\.?A\\.?|Republic Act)\\s*(?:No\\.?)?\\s*(\\d+)",
                java.util.regex.Pattern.CASE_INSENSITIVE
            );
            java.util.regex.Matcher raMatcher = raPattern.matcher(reportText);
            while (raMatcher.find()) {
                String citation = "RA " + raMatcher.group(1);
                if (!citations.contains(citation)) {
                    citations.add(citation);
                }
            }
            
            // Pattern 3: RPC Articles (e.g., "RPC Article 350", "Article 266-A")
            java.util.regex.Pattern rpcPattern = java.util.regex.Pattern.compile(
                "(?:RPC\\s+)?Article\\s+(\\d+[A-Z]?|\\d+-[A-Z])",
                java.util.regex.Pattern.CASE_INSENSITIVE
            );
            java.util.regex.Matcher rpcMatcher = rpcPattern.matcher(reportText);
            while (rpcMatcher.find()) {
                String citation = "RPC Article " + rpcMatcher.group(1);
                if (!citations.contains(citation)) {
                    citations.add(citation);
                }
            }
            
            // Pattern 4: Constitution Articles (e.g., "Article III, Section 1", "1987 Constitution Article 3")
            java.util.regex.Pattern constPattern = java.util.regex.Pattern.compile(
                "(?:1987\\s+)?Constitution.*?Article\\s+(\\d+)",
                java.util.regex.Pattern.CASE_INSENSITIVE
            );
            java.util.regex.Matcher constMatcher = constPattern.matcher(reportText);
            while (constMatcher.find()) {
                String citation = "1987 Constitution Article " + constMatcher.group(1);
                if (!citations.contains(citation)) {
                    citations.add(citation);
                }
            }
            
            // Pattern 5: Civil Code Articles (e.g., "Civil Code Article 1156", "Article 1156 of the Civil Code")
            java.util.regex.Pattern civilCodePattern = java.util.regex.Pattern.compile(
                "(?:Civil Code|New Civil Code).*?Article\\s+(\\d+)",
                java.util.regex.Pattern.CASE_INSENSITIVE
            );
            java.util.regex.Matcher civilCodeMatcher = civilCodePattern.matcher(reportText);
            while (civilCodeMatcher.find()) {
                String citation = "Civil Code Article " + civilCodeMatcher.group(1);
                if (!citations.contains(citation)) {
                    citations.add(citation);
                }
            }
            
            logger.info("CPA: Extracted {} citations from report: {}", citations.size(), citations);
            
        } catch (Exception e) {
            logger.warn("Error extracting citations from report: {}", e.getMessage());
        }
        
        return citations;
    }
    
    /**
     * Extract legal concepts from the report text to use as KB query.
     * This focuses on what's actually mentioned in the report, not just the legal issues section.
     */
    private String extractLegalConceptsFromReport(String reportText) {
        if (reportText == null || reportText.trim().isEmpty()) {
            return null;
        }
        
        StringBuilder concepts = new StringBuilder();
        
        // Extract from Case Summary
        java.util.regex.Pattern summaryPattern = java.util.regex.Pattern.compile(
            "Case Summary:\\s*([\\s\\S]*?)(?=\\n\\n|Legal Issues|Plausibility Score|$)",
            java.util.regex.Pattern.CASE_INSENSITIVE
        );
        java.util.regex.Matcher summaryMatcher = summaryPattern.matcher(reportText);
        if (summaryMatcher.find()) {
            String summary = summaryMatcher.group(1).trim();
            summary = summary.replaceAll("\\*\\*", "").replaceAll("\\n+", " ").trim();
            if (!summary.isEmpty()) {
                concepts.append(summary).append(" ");
            }
        }
        
        // Extract from Legal Issues section
        java.util.regex.Pattern issuesPattern = java.util.regex.Pattern.compile(
            "Legal Issues(?: or Concerns)?:\\s*([\\s\\S]*?)(?=\\n\\n|Plausibility Score|Suggested Next Steps|$)",
            java.util.regex.Pattern.CASE_INSENSITIVE
        );
        java.util.regex.Matcher issuesMatcher = issuesPattern.matcher(reportText);
        if (issuesMatcher.find()) {
            String issues = issuesMatcher.group(1).trim();
            issues = issues.replaceAll("\\*\\*", "")
                          .replaceAll("^-\\s*", "")
                          .replaceAll("\\n-\\s*", ". ")
                          .replaceAll("\\n+", " ")
                          .trim();
            if (!issues.isEmpty()) {
                concepts.append(issues);
            }
        }
        
        String result = concepts.toString().trim();
        return result.isEmpty() ? null : result;
    }
    
    /**
     * Check if a KB source is relevant to what's mentioned in the report.
     * This ensures we only show sources that match the report content.
     */
    private boolean isSourceRelevantToReport(com.capstone.civilify.DTO.KnowledgeBaseEntry source, String reportText) {
        if (source == null || reportText == null || reportText.trim().isEmpty()) {
            return false;
        }
        
        String lowerReport = reportText.toLowerCase();
        String lowerTitle = source.getTitle() != null ? source.getTitle().toLowerCase() : "";
        String lowerCitation = source.getCanonicalCitation() != null ? source.getCanonicalCitation().toLowerCase() : "";
        String lowerSummary = source.getSummary() != null ? source.getSummary().toLowerCase() : "";
        
        // Extract key terms from the report
        List<String> reportTerms = new ArrayList<>();
        
        // Check for contract-related terms
        if (lowerReport.contains("contract") || lowerReport.contains("agreement") || 
            lowerReport.contains("verbal") || lowerReport.contains("breach")) {
            reportTerms.add("contract");
            reportTerms.add("agreement");
            reportTerms.add("breach");
        }
        
        // Check for consumer protection terms
        if (lowerReport.contains("consumer") || lowerReport.contains("protection") || 
            lowerReport.contains("wedding") || lowerReport.contains("organizer")) {
            reportTerms.add("consumer");
        }
        
        // Check if source title/citation/summary contains any of the report terms
        for (String term : reportTerms) {
            if (lowerTitle.contains(term) || lowerCitation.contains(term) || lowerSummary.contains(term)) {
                return true;
            }
        }
        
        // If no specific terms match, check if citation is mentioned in report
        if (source.getCanonicalCitation() != null) {
            String citation = source.getCanonicalCitation();
            if (lowerReport.contains(citation.toLowerCase())) {
                return true;
            }
        }
        
        // If source is about Rules of Court but report doesn't mention Rules of Court, exclude it
        if (lowerTitle.contains("rule") && lowerTitle.contains("court") && 
            !lowerReport.contains("rule") && !lowerReport.contains("court")) {
            return false;
        }
        
        // If source is about bail/forfeiture but report doesn't mention these, exclude it
        if ((lowerTitle.contains("bail") || lowerTitle.contains("forfeiture") || 
             lowerTitle.contains("bond")) && 
            !lowerReport.contains("bail") && !lowerReport.contains("forfeiture") && 
            !lowerReport.contains("bond")) {
            return false;
        }
        
        // If source is about summary judgment but report doesn't mention it, exclude it
        if (lowerTitle.contains("summary judgment") && !lowerReport.contains("summary judgment")) {
            return false;
        }
        
        // If source is about sanctions but report doesn't mention sanctions, exclude it
        if (lowerTitle.contains("sanction") && !lowerReport.contains("sanction")) {
            return false;
        }
        
        // Default: include if we can't determine relevance (to avoid being too restrictive)
        return true;
    }
    
    /**
     * Check if the user's question is about Civilify itself (meta/informational)
     * rather than an actual legal case that needs assessment.
     * These questions should get conversational responses, not structured reports.
     */
    private boolean isMetaOrInformationalQuestion(String message) {
        if (message == null || message.trim().isEmpty()) {
            return false;
        }
        
        String lowerMessage = message.toLowerCase().trim();
        
        // Patterns for meta questions about Civilify
        String[] metaPatterns = {
            "what are the modes",
            "what is gli",
            "what is cpa",
            "what are your capabilities",
            "what can you do",
            "how do i use",
            "how does this work",
            "explain the modes",
            "tell me about",
            "what is civilify",
            "how do you work",
            "what features",
            "can you help me with",
            "what mode should i use",
            "difference between modes",
            "when should i use",
            "which mode is better"
        };
        
        for (String pattern : metaPatterns) {
            if (lowerMessage.contains(pattern)) {
                return true;
            }
        }
        
        // Check for greeting-like questions
        if (lowerMessage.matches("^(hi|hello|hey|greetings).*") && lowerMessage.length() < 50) {
            return true;
        }
        
        // Check if it's purely asking about capabilities (no legal context)
        boolean hasLegalContext = lowerMessage.contains("case") || 
                                   lowerMessage.contains("law") || 
                                   lowerMessage.contains("legal") ||
                                   lowerMessage.contains("lawyer") ||
                                   lowerMessage.contains("court") ||
                                   lowerMessage.contains("sue") ||
                                   lowerMessage.contains("charged") ||
                                   lowerMessage.contains("contract") ||
                                   lowerMessage.contains("violated");
        
        boolean isCapabilityQuestion = lowerMessage.contains("what can") || 
                                        lowerMessage.contains("what do") ||
                                        lowerMessage.contains("how can");
        
        // If asking about capabilities without legal context, it's meta
        if (isCapabilityQuestion && !hasLegalContext) {
            return true;
        }
        
        return false;
    }
}