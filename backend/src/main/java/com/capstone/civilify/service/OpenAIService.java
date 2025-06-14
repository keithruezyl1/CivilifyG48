package com.capstone.civilify.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAIService {
    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);
    
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
    
    private final RestTemplate restTemplate;
    
    public OpenAIService() {
        this.restTemplate = new RestTemplate();
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
                    stream = gliStream;
                    logger.info("Using GLI mode with model: {}, temperature: {}, max tokens: {}", model, temperature, maxTokens);
                } else if (mode.equals("B")) { // Case Plausibility Assessment mode
                    apiKey = cpaApiKey;
                    model = cpaModel;
                    temperature = cpaTemperature;
                    topP = cpaTopP;
                    frequencyPenalty = cpaFrequencyPenalty;
                    presencePenalty = cpaPresencePenalty;
                    maxTokens = cpaMaxTokens;
                    stream = cpaStream;
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
            
            // Handle different API key formats
            String authHeader = "Bearer " + apiKey;
            headers.set("Authorization", authHeader);
            
            // Add OpenAI-Organization header if needed
            // headers.set("OpenAI-Organization", "your-organization-id");
            
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
            
            // Add the current user message
            Map<String, Object> userMessageMap = new HashMap<>();
            userMessageMap.put("role", "user");
            userMessageMap.put("content", userMessage);
            messages.add(userMessageMap);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);  // Using the model selected based on mode
            requestBody.put("messages", messages);
            requestBody.put("temperature", temperature);
            requestBody.put("top_p", topP);
            requestBody.put("frequency_penalty", frequencyPenalty);
            requestBody.put("presence_penalty", presencePenalty);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("stream", stream);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            logger.info("Making API request to: {}", apiUrl);
            logger.info("Request headers: {}", headers);
            logger.info("Request body: {}", requestBody);
            
            try {
                ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, requestEntity, Map.class);
                
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
                throw e; // Rethrow to be caught by the outer try-catch block
            }
            
            return "I'm sorry, I couldn't generate a response at this time.";
        } catch (Exception e) {
            logger.error("Error generating OpenAI response: {}", e.getMessage(), e);
            return "I'm sorry, an error occurred while processing your request: " + e.getMessage();
        }
    }
    
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
}
