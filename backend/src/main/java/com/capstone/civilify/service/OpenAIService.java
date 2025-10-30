package com.capstone.civilify.service;

import com.capstone.civilify.DTO.KnowledgeBaseEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAIService {
    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);
    
    @Autowired
    private KnowledgeBaseService knowledgeBaseService;
    
    // Default OpenAI settings (fallback)
    @Value("${openai.api.key}")
    private String defaultApiKey;
    
    @Value("${openai.model}")
    private String defaultModel;
    
    // General Legal Information mode (A) settings
    @Value("${openai.gli.api.key}")
    private String gliApiKey;
    
    @Value("${openai.gli.model}")
    private String gliModel;
    
    @Value("${openai.gli.temperature:0.3}")
    private double gliTemperature;
    
    @Value("${openai.gli.top-p:1.0}")
    private double gliTopP;
    
    @Value("${openai.gli.frequency-penalty:0.0}")
    private double gliFrequencyPenalty;
    
    @Value("${openai.gli.presence-penalty:0.0}")
    private double gliPresencePenalty;
    
    @Value("${openai.gli.max-tokens:600}")
    private int gliMaxTokens;
    
    @Value("${openai.gli.stream:true}")
    private boolean gliStream;
    
    // Case Plausibility Assessment mode (B) settings
    @Value("${openai.cpa.api.key}")
    private String cpaApiKey;
    
    @Value("${openai.cpa.model}")
    private String cpaModel;
    
    @Value("${openai.cpa.temperature:0.2}")
    private double cpaTemperature;
    
    @Value("${openai.cpa.top-p:1.0}")
    private double cpaTopP;
    
    @Value("${openai.cpa.frequency-penalty:0.0}")
    private double cpaFrequencyPenalty;
    
    @Value("${openai.cpa.presence-penalty:0.0}")
    private double cpaPresencePenalty;
    
    @Value("${openai.cpa.max-tokens:2000}")
    private int cpaMaxTokens;
    
    @Value("${openai.cpa.stream:false}")
    private boolean cpaStream;
    
    // Optional org/project headers (useful for sk-proj-* keys and org-scoped usage)
    @Value("${openai.organization:}")
    private String openAiOrganization;
    
    @Value("${openai.project:}")
    private String openAiProject;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper jsonMapper = new ObjectMapper();
    
    // How many KB sources to request (clamped by KnowledgeBaseService.maxResults)
    @Value("${knowledge.base.sources.limit:${knowledge.base.max.results:5}}")
    private int knowledgeBaseSourcesLimit;
    @Value("${knowledge.base.cache.ttl.seconds:300}")
    private int kbCacheTtlSeconds;

    private static class KbCacheEntry {
        List<KnowledgeBaseEntry> data;
        long expiresAtMs;
        KbCacheEntry(List<KnowledgeBaseEntry> data, long ttlMs) {
            this.data = data;
            this.expiresAtMs = System.currentTimeMillis() + ttlMs;
        }
        boolean isExpired() { return System.currentTimeMillis() > expiresAtMs; }
    }
    private final Map<String, KbCacheEntry> kbCache = new java.util.concurrent.ConcurrentHashMap<>();
    
    public OpenAIService() {
        // Configure timeouts (no extra dependency for pooling)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // Keep connects snappy, but allow more time for OpenAI completions
        factory.setConnectTimeout(6000);
        factory.setReadTimeout(20000);
        this.restTemplate = new RestTemplate(factory);
    }
    
    public String generateResponse(String userMessage, String systemPrompt, List<Map<String, String>> conversationHistory) {
        return generateResponse(userMessage, systemPrompt, conversationHistory, null);
    }
    
    public String generateResponse(String userMessage, String systemPrompt, List<Map<String, String>> conversationHistory, String mode) {
        try {
            // Determine which API key, model, and parameters to use based on the mode
            String apiKey;
            String model;
            double temperature;
            double topP;
            double frequencyPenalty;
            double presencePenalty;
            int maxTokens;
            boolean stream;
            
            if (mode != null) {
                if (mode.equals("A")) { // General Legal Information mode
                    apiKey = gliApiKey;
                    model = gliModel;
                    temperature = gliTemperature;
                    topP = gliTopP;
                    frequencyPenalty = gliFrequencyPenalty;
                    presencePenalty = gliPresencePenalty;
                    maxTokens = gliMaxTokens;
                    // Force non-streaming responses to avoid SSE content type
                    stream = false;
                    logger.info("Using GLI mode with model: {}, temperature: {}, max tokens: {}", model, temperature, maxTokens);
                } else if (mode.equals("B")) { // Case Plausibility Assessment mode
                    apiKey = cpaApiKey;
                    model = cpaModel;
                    temperature = cpaTemperature;
                    topP = cpaTopP;
                    frequencyPenalty = cpaFrequencyPenalty;
                    presencePenalty = cpaPresencePenalty;
                    maxTokens = cpaMaxTokens;
                    // Force non-streaming responses to avoid SSE content type
                    stream = false;
                    logger.info("Using CPA mode with model: {}, temperature: {}, max tokens: {}", model, temperature, maxTokens);
                } else {
                    // Fallback to default for unknown modes
                    apiKey = defaultApiKey;
                    model = defaultModel;
                    temperature = 0.7; // Default OpenAI temperature
                    topP = 1.0;
                    frequencyPenalty = 0.0;
                    presencePenalty = 0.0;
                    maxTokens = 1000;
                    stream = false;
                    logger.info("Using default mode with model: {}", model);
                }
            } else {
                // No mode specified, use default
                apiKey = defaultApiKey;
                model = defaultModel;
                temperature = 0.7; // Default OpenAI temperature
                topP = 1.0;
                frequencyPenalty = 0.0;
                presencePenalty = 0.0;
                maxTokens = 1000;
                stream = false;
                logger.info("No mode specified, using default model: {}", model);
            }
            
            logger.info("Generating OpenAI response for message: {}", userMessage);
            logger.info("Using API key: {}", apiKey.substring(0, 10) + "...");
            logger.info("Conversation history size: {}", conversationHistory != null ? conversationHistory.size() : 0);
            
            // Use the correct API endpoint based on the key format
            String apiUrl = "https://api.openai.com/v1/chat/completions";
            
            // If using a project-specific key (sk-proj-), you might need to use a different endpoint
            if (apiKey.startsWith("sk-proj-")) {
                apiUrl = "https://api.openai.com/v1/chat/completions";
                logger.info("Using project-specific API endpoint");
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            // Handle different API key formats
            String authHeader = "Bearer " + apiKey;
            headers.set("Authorization", authHeader);
            
            // Optional scoping headers
            if (openAiOrganization != null && !openAiOrganization.isBlank()) {
                headers.set("OpenAI-Organization", openAiOrganization.trim());
            }
            if (openAiProject != null && !openAiProject.isBlank()) {
                headers.set("OpenAI-Project", openAiProject.trim());
            }
            
            // Prepare messages for the API call
            List<Map<String, Object>> messages = new ArrayList<>();
            
            // Add system message first
            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);
            messages.add(systemMessage);
            
            // Add conversation history if available
            if (conversationHistory != null && !conversationHistory.isEmpty()) {
                for (Map<String, String> message : conversationHistory) {
                    Map<String, Object> historyMessage = new HashMap<>();
                    historyMessage.put("role", message.get("isUserMessage").equals("true") ? "user" : "assistant");
                    historyMessage.put("content", message.get("content"));
                    messages.add(historyMessage);
                }
                logger.info("Added {} messages from conversation history", conversationHistory.size());
            }
            
            // Add the current user message only if it is not already the last history message
            boolean lastIsSameUserMessage = false;
            if (conversationHistory != null && !conversationHistory.isEmpty()) {
                Map<String, String> last = conversationHistory.get(conversationHistory.size() - 1);
                if (last != null && "true".equals(last.get("isUserMessage"))) {
                    String lastContent = last.get("content");
                    if (lastContent != null && lastContent.trim().equals(userMessage != null ? userMessage.trim() : null)) {
                        lastIsSameUserMessage = true;
                    }
                }
            }

            if (!lastIsSameUserMessage) {
                Map<String, Object> userMessageMap = new HashMap<>();
                userMessageMap.put("role", "user");
                userMessageMap.put("content", userMessage);
                messages.add(userMessageMap);
            } else {
                logger.info("Skipping duplicate current user message in request payload");
            }
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);  // Using the model selected based on mode
            requestBody.put("messages", messages);
            // Some newer models (e.g., GPT-4o family, GPT-5) pin sampling to defaults.
            // Avoid sending sampling params to prevent 400 "unsupported_value" errors.
            boolean fixedSampling = isFixedSamplingModel(model);
            if (!fixedSampling) {
                requestBody.put("temperature", temperature);
                requestBody.put("top_p", topP);
                requestBody.put("frequency_penalty", frequencyPenalty);
                requestBody.put("presence_penalty", presencePenalty);
            }
            // Some org/project gateways for GPT-4o family require 'max_completion_tokens'
            requestBody.put("max_completion_tokens", maxTokens);
            requestBody.put("stream", stream);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            logger.info("Making API request to: {}", apiUrl);
            // Mask Authorization header in logs
            HttpHeaders masked = new HttpHeaders();
            masked.putAll(headers);
            if (masked.containsKey("Authorization")) {
                masked.set("Authorization", "Bearer ****");
            }
            logger.info("Request headers: {}", masked);
            // Avoid logging full request body for performance
            
            try {
                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                        apiUrl,
                        HttpMethod.POST,
                        requestEntity,
                        new ParameterizedTypeReference<Map<String, Object>>() {}
                );
                
                logger.info("Response status code: {}", response.getStatusCode());
                logger.info("Response headers: {}", response.getHeaders());
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> responseBody = response.getBody();
                    logger.info("Received successful response body keys: {}", responseBody.keySet());
                    
                    Object choicesObj = responseBody.get("choices");
                    if (choicesObj instanceof List) {
                        List<?> choices = (List<?>) choicesObj;
                        if (choices != null && !choices.isEmpty()) {
                            Object firstChoice = choices.get(0);
                            if (firstChoice instanceof Map) {
                                Map<?, ?> choiceMap = (Map<?, ?>) firstChoice;
                                Object messageObj = choiceMap.get("message");
                                
                                if (messageObj instanceof Map) {
                                    Map<?, ?> messageMap = (Map<?, ?>) messageObj;
                                    Object contentObj = messageMap.get("content");
                                    
                                    if (contentObj instanceof String) {
                                        String content = (String) contentObj;
                                        logger.info("Generated content: {}", content);
                                        return content;
                                    }
                                }
                            }
                        }
                    }
                    
                    logger.warn("Could not extract content from response structure: {}", responseBody);
                }
            } catch (Exception e) {
                logger.error("Error during API call: {}", e.getMessage());
                // Fallback: handle servers that (incorrectly) return text/event-stream
                if (e.getMessage() != null && e.getMessage().toLowerCase().contains("text/event-stream")) {
                    try {
                        String sseContent = trySseFallback(apiUrl, headers, requestBody);
                        if (sseContent != null) {
                            logger.info("Parsed SSE fallback content: {}", sseContent);
                            return sseContent;
                        }
                    } catch (Exception suppressed) {
                        logger.warn("SSE fallback parsing failed: {}", suppressed.getMessage());
                    }
                }
                throw e; // Rethrow to be caught by the outer try-catch block
            }
            
            return "I'm sorry, I couldn't generate a response at this time.";
        } catch (Exception e) {
            logger.error("Error generating OpenAI response: {}", e.getMessage(), e);
            return "I'm sorry, an error occurred while processing your request: " + e.getMessage();
        }
    }
    
    // This method is no longer used by the controller for generation-first flow,
    // but kept for potential future features.
    public String chatWithKnowledgeBase(String userMessage, String mode) {
        String systemPrompt = mode != null && mode.equals("B") ? getCpaSystemPrompt() : getGliSystemPrompt();
        return generateResponse(userMessage, systemPrompt, new ArrayList<>(), mode);
    }

    // Attempt to parse a text/event-stream (SSE) response by reading the 'data:' lines
    private String trySseFallback(String apiUrl, HttpHeaders headers, Map<String, Object> requestBody) throws Exception {
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(
            apiUrl,
            HttpMethod.POST,
            requestEntity,
            String.class
        );
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            String body = response.getBody();
            StringBuilder assembled = new StringBuilder();
            for (String line : body.split("\n")) {
                String trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                String payload = trimmed.substring(5).trim();
                if ("[DONE]".equals(payload)) break;
                if (payload.isEmpty()) continue;
                try {
                    Map<?, ?> evt = jsonMapper.readValue(payload, Map.class);
                    Object choicesObj = evt.get("choices");
                    if (choicesObj instanceof List<?> choices && !choices.isEmpty()) {
                        Object first = choices.get(0);
                        if (first instanceof Map<?, ?> cm) {
                            // Try delta.content (streaming chunks)
                            Object delta = cm.get("delta");
                            if (delta instanceof Map<?, ?> dm) {
                                Object dc = dm.get("content");
                                if (dc instanceof String s) assembled.append(s);
                            }
                            // Fallback to message.content if present
                            Object msg = cm.get("message");
                            if (msg instanceof Map<?, ?> mm) {
                                Object content = mm.get("content");
                                if (content instanceof String s) assembled.append(s);
                            }
                        }
                    }
                } catch (Exception ignore) { /* skip malformed event */ }
            }
            if (assembled.length() > 0) return assembled.toString();
        }
        return null;
    }
    private String getGliSystemPrompt() {
        return """
            You are Villy, Civilify's AI-powered legal assistant specializing in Philippine law. Your role is to provide accurate, 
            comprehensive legal information based on the provided knowledge base context.
            
            INTEGRATION RULES:
            1. ALWAYS prioritize and strictly adhere to the knowledge base content provided in the context
            2. Quote relevant legal provisions, rules, and statutes with proper citations
            3. If the knowledge base contains relevant information, base your response primarily on that content
            4. When citing legal sources, use the exact citations provided (e.g., "Rule 114 Sec. 1", "RPC Art. 308")
            5. If multiple relevant sources are provided, synthesize them coherently
            6. Always mention when information comes from specific legal documents
            
            RESPONSE GUIDELINES:
            - Provide clear, actionable legal information
            - Include relevant legal citations and references
            - Explain legal concepts in accessible language
            - Highlight important deadlines, requirements, or procedures
            - If the query involves procedural steps, provide them in logical order
            
            If the knowledge base context doesn't contain relevant information for the query, 
            acknowledge this limitation and provide general guidance while recommending consultation with a legal professional.
            """;
    }

    private String getCpaSystemPrompt() {
        return """
            You are Villy, Civilify's AI-powered legal assistant specializing in case plausibility assessment for Philippine law. 
            Your role is to analyze legal scenarios and provide structured assessments based on relevant legal provisions.
            
            INTEGRATION RULES:
            1. ALWAYS prioritize and strictly adhere to the knowledge base content provided in the context
            2. Use specific legal provisions, elements, and requirements from the knowledge base for your analysis
            3. Quote relevant statutes, rules, and legal principles with proper citations
            4. Base your plausibility assessment on the legal standards found in the knowledge base
            
            ASSESSMENT FRAMEWORK:
            1. Legal Basis Analysis: Identify applicable laws, rules, or legal principles from the knowledge base
            2. Element-by-Element Review: Analyze each required element based on provided legal provisions
            3. Evidence Evaluation: Assess the strength and relevance of available evidence
            4. Procedural Considerations: Review any procedural requirements or deadlines
            5. Plausibility Score: Provide a percentage score (0-100%) with clear justification
            
            RESPONSE FORMAT:
            - Start with a brief case summary
            - Provide detailed legal analysis using knowledge base content
            - Include specific legal citations and provisions
            - End with: "Plausibility Score: X% - [Label] [Brief justification]"
            - Suggest next steps or additional considerations
            
            If the knowledge base context doesn't contain relevant legal provisions for the case, 
            acknowledge this limitation and recommend consultation with a legal professional for proper assessment.
            """;
    }

    private boolean isFixedSamplingModel(String model) {
        if (model == null) return false;
        String m = model.toLowerCase();
        return m.contains("gpt-4o") || m.contains("gpt-5");
    }
    
    /**
     * Get knowledge base sources for a given query.
     * Used for displaying source references in the chat interface.
     */
    public List<KnowledgeBaseEntry> getKnowledgeBaseSources(String query) {
        try {
            String key = (query == null ? "" : query.trim().toLowerCase()) + "|limit=" + knowledgeBaseSourcesLimit;
            KbCacheEntry cached = kbCache.get(key);
            if (cached != null && !cached.isExpired()) {
                logger.info("KB cache hit for key='{}'", key);
                return cached.data;
            }
            List<KnowledgeBaseEntry> result = knowledgeBaseService.searchKnowledgeBase(query, knowledgeBaseSourcesLimit);
            kbCache.put(key, new KbCacheEntry(result, kbCacheTtlSeconds * 1000L));
            return result;
        } catch (Exception e) {
            logger.error("Error retrieving knowledge base sources", e);
            return new ArrayList<>();
        }
    }

    /**
     * Variant that allows a caller-provided limit. Falls back to configured limit when invalid.
     */
    public List<KnowledgeBaseEntry> getKnowledgeBaseSources(String query, int limitOverride) {
        int effectiveLimit = (limitOverride > 0 && limitOverride <= 10) ? limitOverride : knowledgeBaseSourcesLimit;
        try {
            String key = (query == null ? "" : query.trim().toLowerCase()) + "|limit=" + effectiveLimit;
            KbCacheEntry cached = kbCache.get(key);
            if (cached != null && !cached.isExpired()) {
                logger.info("KB cache hit for key='{}'", key);
                return cached.data;
            }
            List<KnowledgeBaseEntry> result = knowledgeBaseService.searchKnowledgeBase(query, effectiveLimit);
            kbCache.put(key, new KbCacheEntry(result, kbCacheTtlSeconds * 1000L));
            return result;
        } catch (Exception e) {
            logger.error("Error retrieving knowledge base sources (limit override)", e);
            return new ArrayList<>();
        }
    }

    // CPA structured facts/report helpers removed per product decision
    
    // Method for development/testing when API key is not available
    public String generateMockResponse(String userMessage) {
        // Simulate a delay
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        if (userMessage.toLowerCase().contains("hello") || userMessage.toLowerCase().contains("hi")) {
            return "Hello! I'm Villy, your virtual assistant. How can I help you today?";
        } else if (userMessage.toLowerCase().contains("help")) {
            return "I'm here to help you with your questions and concerns. What would you like assistance with?";
        } else if (userMessage.toLowerCase().contains("report")) {
            return "To submit a report, please provide details about what happened and any other relevant information. This will help us address your concern.";
        } else if (userMessage.toLowerCase().contains("status")) {
            return "You can check the status of your reports in the conversation history. Your reports will be updated as they are processed.";
        } else if (userMessage.toLowerCase().contains("admin")) {
            return "Admins will be notified of your report and will contact you through this chat interface once they start working on it.";
        } else {
            return "Thank you for your message. I've recorded your report. Is there anything else you'd like to add?";
        }
    }
    
    /**
     * Get the KnowledgeBaseService instance for enhanced integration
     */
    public KnowledgeBaseService getKnowledgeBaseService() {
        return knowledgeBaseService;
    }
}
