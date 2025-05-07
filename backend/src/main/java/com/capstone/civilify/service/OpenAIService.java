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
    
    @Value("${openai.api.key}")
    private String apiKey;
    
    @Value("${openai.model}")
    private String model;
    
    private final RestTemplate restTemplate;
    
    public OpenAIService() {
        this.restTemplate = new RestTemplate();
    }
    
    public String generateResponse(String userMessage, String systemPrompt) {
        try {
            logger.info("Generating OpenAI response for message: {}", userMessage);
            logger.info("Using API key: {}", apiKey.substring(0, 10) + "...");
            logger.info("Using model: {}", model);
            
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
            
            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);
            
            Map<String, Object> userMessageMap = new HashMap<>();
            userMessageMap.put("role", "user");
            userMessageMap.put("content", userMessage);
            
            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(systemMessage);
            messages.add(userMessageMap);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 500);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            logger.info("Making API request to: {}", apiUrl);
            logger.info("Request headers: {}", headers);
            logger.info("Request body: {}", requestBody);
            
            ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, requestEntity, Map.class);
            
            logger.info("Response status code: {}", response.getStatusCode());
            logger.info("Response headers: {}", response.getHeaders());
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                logger.info("Received successful response body: {}", responseBody);
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message.get("content");
                    logger.info("Generated content: {}", content);
                    return content;
                }
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
