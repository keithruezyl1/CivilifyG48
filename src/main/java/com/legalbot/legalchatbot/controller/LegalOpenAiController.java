package com.legalbot.legalchatbot.controller;

import com.legalbot.legalchatbot.PromptBuilder;
import com.legalbot.legalchatbot.entity.KnowledgeBaseEntry;
import com.legalbot.legalchatbot.service.KnowledgeBaseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestBody;


import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.MediaType;






@RestController
@RequestMapping("/api/legal-bot")
@CrossOrigin(origins = "*")
public class LegalOpenAiController {

    private final OkHttpClient client = new OkHttpClient();
    private final String OPENAI_API_KEY = "";  // Replace with your actual key!
    private final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private KnowledgeBaseService knowledgeBaseService;  // Inject your service

    @PostMapping("/ask")
    public ResponseEntity<Map<String, Object>> getLegalAdvice(@RequestBody Map<String, String> body) {
        String question = body.get("question");

        // First: Check existing Knowledge Base
        Optional<KnowledgeBaseEntry> existing = knowledgeBaseService.findSimilarQuestion(question);
        if (existing.isPresent()) {
            return ResponseEntity.ok(Map.of(
                    "answer", existing.get().getAnswer(),
                    "source", "knowledge_base",
                    "id", existing.get().getId()
            ));
        }

        // If no similar entry, use OpenAI (like your original setup)
        String prompt = PromptBuilder.buildPrompt(question);
        Map<String, Object> userMessage = Map.of(
                "role", "user",
                "content", prompt
        );
        Map<String, Object> requestBody = Map.of(
                "model", "gpt-3.5-turbo",
                "messages", List.of(userMessage),
                "temperature", 0.2
        );

        MediaType mediaType = MediaType.parse("application/json");

        okhttp3.RequestBody requestBodyObj = okhttp3.RequestBody.create(
                mediaType,
                objectToJson(requestBody)
        );

        Request request = new Request.Builder()
                .url(OPENAI_API_URL)
                .addHeader("Authorization", "Bearer " + OPENAI_API_KEY)
                .addHeader("Content-Type", "application/json")
                .post(requestBodyObj)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful() && response.body() != null) {
                String responseBody = response.body().string();
                Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
                Map<String, Object> messageContent = (Map<String, Object>) choices.get(0).get("message");
                String answer = messageContent.get("content").toString();

                return ResponseEntity.ok(
                    new java.util.HashMap<>() {{
                        put("answer", answer);
                        put("source", "openai");
                        put("id", null);  // ✅ HashMap allows null values!
                    }}  // Not saved yet, no ID
                );
            } else {
                return ResponseEntity.status(500).body(Map.of("answer", "❌ Error from OpenAI: " + response.code()));
            }
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("answer", "❌ Error: " + e.getMessage()));
        }
    }

    private String objectToJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert object to JSON", e);
        }
    }
}
