package com.legalbot.legalchatbot.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/legal-bot")
@CrossOrigin(origins = "*")
public class LegalGeminiController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String GEMINI_API_KEY = "AIzaSyDIYQK3WWrxfW1mDgWErLdb7lggBqog6xE";

    @PostMapping
    public ResponseEntity<Map<String, String>> getLegalAdvice(@RequestBody Map<String, String> body) {
        String question = body.get("question");

        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;

        // Refined prompt to ensure the AI provides a direct legal answer
        String prompt = """
            You are an AI trained in Philippine law, based on information from the Official Gazette, Supreme Court rulings, and lawphil.net. Always include legal basis (if known) and keep your answer simple and understandable to regular Filipinos. 
            If necessary, explain the steps the person should take in the situation.
            Answer the question clearly and concisely. Add this disclaimer at the end: 
            "This is not legal advice. Please consult a licensed attorney."
            
            Question: %s
        """.formatted(question);

        Map<String, Object> contents = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", prompt))
            ))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(contents, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");

                    String answer = parts.get(0).get("text").toString();
                    return ResponseEntity.ok(Map.of("answer", answer));
                } else {
                    return ResponseEntity.status(500).body(Map.of("answer", "❌ Error: No candidates found in response"));
                }
            } else {
                return ResponseEntity.status(response.getStatusCode()).body(Map.of("answer", "❌ Error: " + response.getStatusCode()));
            }
        } catch (Exception e) {
            // Log the error for debugging purposes
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("answer", "❌ Error: " + e.getMessage()));
        }
    }
}
