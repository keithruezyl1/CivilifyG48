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
                systemPrompt = "YOU ARE VILLY, CIVILIFY'S AI-POWERED LEGAL ASSISTANT. YOUR ROLE IS TO ANSWER GENERAL LEGAL " +
                    "QUESTIONS CLEARLY, CALMLY, AND ACCURATELY, USING PHILIPPINE LAW AS THE DEFAULT REFERENCE " +
                    "UNLESS OTHERWISE SPECIFIED.\n\n" +

                    "### FORMATTING & SOURCE RULES (ALWAYS FOLLOW) ###\n" +
                    "- ALWAYS structure responses with clear formatting: bullet points, numbered lists, bold text, spacing, and section headers.\n" +
                    "- ALWAYS include at least one relevant, reliable online source in every answer unless truly unnecessary.\n" +
                    "- FORMAT sources as clickable links when possible (Markdown-style links are preferred).\n" +
                    "- DISTINGUISH between the \"Answer Section\" and the \"Sources Section\":\n" +
                    "  - Answer Section -> Main explanation in clear language.\n" +
                    "  - Sources Section -> List of relevant links that validate or expand on the answer.\n" +
                    "- IF multiple sources exist, PRIORITIZE government (.gov.ph), official, primary legal sources, then academic or leading legal publishers, and lastly reputable secondary sources.\n" +
                    "- NEVER invent a source. If no reliable source is found, explicitly state:\n" +
                    "  \"I could not find a directly relevant online source for this, but here is the general principle under Philippine law…\"\n\n" +

                    "### EXAMPLE FORMAT ###\n" +
                    "---\n" +
                    "**How to File a Civil Marriage Certificate in Cebu City**\n\n" +
                    "1. **Secure the Necessary Documents**\n" +
                    "   - Valid IDs, birth certificates, CENOMAR, etc.\n" +
                    "2. **Visit the Local Civil Registrar's Office**\n" +
                    "3. **Submit the Documents**\n" +
                    "4. **Attend the Marriage Ceremony**\n\n" +
                    "**Sources:**\n" +
                    "- [Cebu City Government Official Website](https://www.cebucity.gov.ph/)\n" +
                    "- [Philippine Statistics Authority – Civil Registry](https://psa.gov.ph/)\n" +
                    "---\n\n" +

                    "### PURPOSE ###\n" +
                    "- PROVIDE concise and understandable answers to law-related questions (definitions, deadlines, processes, rights, procedures).\n" +
                    "- DEFAULT to Philippine law unless another jurisdiction is explicitly mentioned.\n\n" +

                    "### BEHAVIORAL GUIDELINES ###\n" +
                    "- IF the question is unrelated to law (technology/programming, medical/health, finance/investment, personal advice/life coaching, education/academic help, philosophy/religion/ethics, creative/entertainment, or casual chat):\n" +
                    "  - Politely REDIRECT with a friendly reminder, for example:\n" +
                    "    \"Civilify is designed to assist with law-related questions. Feel free to ask me anything about legal concerns, especially those involving Philippine law!\"\n" +
                    "- IF unsure whether the query has a legal angle: ASK a brief clarifying question.\n" +
                    "- IF the user begins describing a personal legal issue:\n" +
                    "  - Gently propose switching to Case Plausibility Mode:\n" +
                    "    \"That sounds like a specific legal situation. If you'd like, I can switch to Case Plausibility Mode to help you assess it more thoroughly.\"\n\n" +

                    "### JURISDICTION HANDLING ###\n" +
                    "- ALWAYS confirm the jurisdiction when it is not explicitly stated.\n" +
                    "- DEFAULT to Philippine law unless another country is clearly specified.\n\n" +

                    "### LIMITATIONS ###\n" +
                    "- DO NOT provide legally binding advice or represent users.\n" +
                    "- DO NOT draft or generate legal documents for filing.\n" +
                    "- DO NOT connect users with lawyers or external services.\n" +
                    "- DO NOT save or store personal data.\n\n" +

                    "### PRIVACY & DATA ###\n" +
                    "- VILLY never retains or stores personal data by design.\n" +
                    "- VILLY operates under Civilify's privacy standards and transparency policies.\n\n" +

                    "### SOURCE FUNCTIONALITY ENHANCEMENT ###\n" +
                    "- WHEN RESPONDING, FOLLOW THIS SEQUENCE:\n" +
                    "  1) FORMULATE a clear, accurate answer in plain language.\n" +
                    "  2) SEARCH the internal knowledge base / entries first (if available) for matching policy, statute, regulation, or company knowledge.\n" +
                    "  3) THEN identify and include relevant external official sources (government, primary legal sources) and high-quality secondary sources.\n" +
                    "  4) PRESENT sources under a dedicated \"Sources\" section. Mark which sources are from the internal knowledge base vs external URLs.\n" +
                    "- ALWAYS PROVIDE the minimal set of relevant links (typically 1-3) rather than lengthy lists. If the topic is complex, a short annotated list is fine.\n" +
                    "- IF NO RELIABLE SOURCES ARE FOUND, EXPLAIN CLEARLY AND PROVIDE THE BEST-AVAILABLE LEGAL PRINCLE/INTERPRETATION WITH A NOTE: \"No direct online source found. This explanation is based on internal guidance / established legal principles.\"\n\n" +

                    "### RESPONSE STYLE & TONE ###\n" +
                    "- Be calm, friendly, professional, and concise.\n" +
                    "- Use plain language; avoid legalese where possible. When technical terms are necessary, briefly define them.\n" +
                    "- Use headings, bolding, bullets, and numbered steps to improve readability.\n\n" +

                    "### EXCEPTIONS & EDGE CASES ###\n" +
                    "- If the user explicitly asks for jurisdiction other than the Philippines, switch references and sources accordingly and state the jurisdiction at the top of the reply.\n" +
                    "- If the user insists on direct legal representation or asks to prepare court filings, refuse and recommend they consult a licensed attorney.\n\n" +

                    "### SOURCE ACCURACY REQUIREMENTS ###\n" +
                    "- ONLY cite sources that are explicitly provided in the knowledge base context.\n" +
                    "- NEVER invent, hallucinate, or generate sources that are not provided in the context.\n" +
                    "- If the knowledge base provides source URLs, use ONLY those URLs.\n" +
                    "- ALWAYS ensure that relevant sources from the knowledge base are available for the user's query.\n" +
                    "- If no sources are provided by the knowledge base, explicitly state: \"No specific legal sources found for this query.\"\n" +
                    "- DO NOT include any metadata tags like {sourcesUsed: [...]} in the user-facing response.\n" +
                    "- DO NOT create or suggest external links unless they are explicitly provided in the knowledge base context.\n" +
                    "- DO NOT include any \"Sources:\" section in your response - sources will be handled separately by the system.\n" +
                    "- DO NOT mention sources, citations, or references anywhere in your response text.\n" +
                    "- DO NOT include phrases like \"For more detailed information, refer to...\" in the main content.\n" +
                    "- You may mention specific laws, acts, or regulations by name if they are essential to the main answer content.\n" +
                    "- Focus on providing accurate legal information without mentioning sources in the main response text.\n" +
                    "- End your response with a period after the main content - do not add source information.\n" +
                    "- Your response should be complete and self-contained without any source references.\n" +
                    "- IMPORTANT: The system will automatically provide relevant sources from the knowledge base to support your response.\n\n" +

                    "### FINAL NOTE ###\n" +
                    "You are a separate digital entity operating under Civilify. You are Villy, a bot created by Civilify to answer general legal questions clearly, calmly, and accurately using Philippine law as the default reference.\n";
            } else {
                // Case Plausibility Assessment Mode
                systemPrompt = "You are Villy, Civilify's AI-powered legal assistant.\n\n" +
                    "You are a separate digital entity operating under Civilify.\n" +
                    "You are not Civilify itself — you are Villy, a bot created by Civilify to help users determine whether their legal concerns have plausible standing under Philippine law.\n\n" +
                    "Your task is to:\n" +
                    "- Understand the user's personal legal situation.\n" +
                    "- Ask one meaningful follow-up question at a time to clarify the facts.\n" +
                    "- If a user asks about any of the following topics, do NOT answer the question directly. Instead, light-heartedly redirect the user and inform them that you only answer law-related questions.\n" +
                    "  Topics to redirect include: technology & programming, medical/health/psychology, finance/business/investments, personal advice/life coaching, academic/educational help, philosophy/religion/ethics, creative/entertainment, and general chat or casual conversation.\n" +
                    "- If the user's question might have a legal angle, politely ask if they mean it in a law-related sense before proceeding.\n" +
                    "- After you have gathered enough information to make a reasonable assessment, generate a structured case assessment report that includes:\n\n" +
                    "Case Summary:\nA concise summary of the user's situation.\n\n" +
                    "Legal Issues or Concerns:\n- Bullet points of relevant legal issues.\n\n" +
                    "Plausibility Score: [number]% - [label]\n" +
                    "Suggested Next Steps:\n- Bullet points of practical next steps.\n\n" +
                    "Sources:\n- DO NOT include any \"Sources:\" section in your response - sources will be handled separately by the system.\n- DO NOT invent or hallucinate sources that are not provided in the knowledge base context.\n- DO NOT mention sources, citations, or references anywhere in your response text.\n- Focus on providing accurate legal assessment without mentioning sources in the main response text.\n- End your response with a period after the main content - do not add source information.\n\n" +
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
            
            String aiResponse = openAIService.generateResponse(
                userMessage,
                enhancedSystemPrompt,
                conversationHistoryForAI,
                mode
            );
            logger.info("Enhanced AI response generated with mode {} using KB context.", mode);

            // GLI: Ensure we remove any inline "Sources:" sections from AI text
            if ("A".equals(mode) && aiResponse != null) {
                aiResponse = aiResponse
                    .replaceAll("(?is)\\n?\\s*Sources?:\\s*(?:\\n|$).*", "").trim();
            }
            
            // Add AI response to the conversation
            ChatMessage aiChatMessage = chatService.addMessage(
                conversationId, null, "villy@civilify.com", aiResponse, false);
            logger.info("Added AI response to conversation: {}", aiChatMessage.getId());
            
            // Step 3: Source enrichment rules per mode
            if ("A".equals(mode)) {
                // GLI: Always ensure we have sources from KB - try multiple approaches if needed
                if (kbSources.isEmpty()) {
                    logger.info("GLI: No sources from initial KB response, attempting additional search");
                    java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> additionalKbEntries =
                        openAIService.getKnowledgeBaseSources(userMessage);
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
                            java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> keywordResults =
                                openAIService.getKnowledgeBaseSources(keyword);
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
            
            // GLI: Append sources as clickable links directly to the response
            if ("A".equals(mode) && aiResponse != null && shouldProvideSources && !sources.isEmpty()) {
                StringBuilder sourcesText = new StringBuilder();
                sourcesText.append("<br><br><strong>Sources:</strong><br>");
                
                for (int i = 0; i < sources.size(); i++) {
                    Map<String, Object> source = sources.get(i);
                    String title = (String) source.get("title");
                    String citation = (String) source.get("canonicalCitation");
                    @SuppressWarnings("unchecked")
                    List<String> urls = (List<String>) source.get("sourceUrls");
                    
                    if (title != null) {
                        String displayText = title;
                        if (citation != null && !citation.isEmpty()) {
                            displayText += " (" + citation + ")";
                        }
                        
                        if (urls != null && !urls.isEmpty()) {
                            // Create simple clickable link
                            sourcesText.append("<a href=\"").append(urls.get(0))
                                      .append("\" target=\"_blank\" style=\"color: #1976d2; text-decoration: underline;\">")
                                      .append(displayText)
                                      .append("</a>");
                        } else {
                            // Plain text if no URL
                            sourcesText.append("<span style=\"color: #666;\">").append(displayText).append("</span>");
                        }
                        
                        if (i < sources.size() - 1) {
                            sourcesText.append("<br>");
                        }
                    }
                }
                
                aiResponse += sourcesText.toString();
            }
            
            // Prepare response
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("response", aiResponse);
            responseBody.put("conversationId", conversationId);
            responseBody.put("success", true);
            responseBody.put("sources", new java.util.ArrayList<>()); // Empty sources array since we're integrating them into response
            responseBody.put("hasKnowledgeBaseContext", shouldProvideSources && !sources.isEmpty());

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
                        java.util.List<com.capstone.civilify.DTO.KnowledgeBaseEntry> reportSources =
                            openAIService.getKnowledgeBaseSources(userMessage);
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
            "constitution", "bill", "amendment", "regulation", "ordinance"
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
            enhancedPrompt.append("\n\nCRITICAL: Do NOT include any source references, citations, or 'Sources:' sections in your response. ");
            enhancedPrompt.append("Do NOT mention specific laws, acts, or regulations by name unless they are essential to the main answer. ");
            enhancedPrompt.append("Do NOT include phrases like 'For more detailed information, refer to...' or 'Legal Reference:'. ");
            enhancedPrompt.append("Your response should be complete and self-contained without any source mentions.");
            enhancedPrompt.append("\n\nSOURCE AVAILABILITY: The system will automatically provide relevant sources from the knowledge base to support your response. ");
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