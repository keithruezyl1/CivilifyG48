package com.capstone.civilify.service;

import com.capstone.civilify.dto.StructuredQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Structured Query Generation service for enhanced query preprocessing.
 * Implements caching and fallback mechanisms following SOLID principles.
 */
@Service
public class StructuredQueryGenerationService {
    
    private static final Logger logger = LoggerFactory.getLogger(StructuredQueryGenerationService.class);
    
    @Value("${openai.api.key}")
    private String openaiApiKey;
    
    @Value("${openai.sqg.model:gpt-4o-mini}")
    private String sqgModel;
    
    @Value("${openai.sqg.ttl.ms:600000}")
    private long sqgCacheTtlMs;
    
    @Value("${openai.sqg.enabled:true}")
    private boolean sqgEnabled;
    
    private final RestTemplate restTemplate;
    private final Map<String, CacheEntry<StructuredQuery>> sqgCache;
    
    public StructuredQueryGenerationService() {
        this.restTemplate = new RestTemplate();
        this.sqgCache = new ConcurrentHashMap<>();
    }
    
    /**
     * Generate structured query from user input with caching.
     * 
     * @param userQuestion The raw user question
     * @return StructuredQuery with normalized components
     */
    public StructuredQuery generateStructuredQuery(String userQuestion) {
        if (!sqgEnabled || userQuestion == null || userQuestion.trim().isEmpty()) {
            return createFallbackQuery(userQuestion);
        }
        
        String normalizedQuestion = userQuestion.toLowerCase().trim();
        String cacheKey = normalizedQuestion;
        
        // Check cache first
        CacheEntry<StructuredQuery> cached = sqgCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            logger.debug("SQG cache hit for query: {}", normalizedQuestion);
            return cached.value;
        }
        
        try {
            long startTime = System.currentTimeMillis();
            
            // Call OpenAI for SQG
            StructuredQuery result = callOpenAIForSQG(userQuestion);
            
            long latency = System.currentTimeMillis() - startTime;
            logger.info("SQG generated in {}ms for query: {}", latency, normalizedQuestion);
            
            // Cache the result
            sqgCache.put(cacheKey, new CacheEntry<>(result, 
                System.currentTimeMillis() + sqgCacheTtlMs));
            
            return result;
            
        } catch (Exception e) {
            logger.warn("SQG failed for query: {}, using fallback", normalizedQuestion, e);
            return createFallbackQuery(userQuestion);
        }
    }
    
    /**
     * Call OpenAI API for structured query generation.
     */
    private StructuredQuery callOpenAIForSQG(String question) {
        String prompt = buildSQGPrompt(question);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + openaiApiKey);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", sqgModel);
        requestBody.put("messages", List.of(
            Map.of("role", "system", "content", getSQGSystemPrompt()),
            Map.of("role", "user", "content", prompt)
        ));
        requestBody.put("temperature", 0.1);
        requestBody.put("max_tokens", 800);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "https://api.openai.com/v1/chat/completions", 
            request, 
            Map.class
        );
        
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> responseBody = response.getBody();
            return parseSQGResponse(responseBody);
        }
        
        throw new RuntimeException("SQG API call failed");
    }
    
    /**
     * Build SQG prompt for Philippine law context.
     */
    private String buildSQGPrompt(String question) {
        return String.format("""
            Analyze this legal question in the context of Philippine law and extract structured information:
            
            Question: "%s"
            
            Please provide a JSON response with the following structure:
            {
              "normalized_question": "Cleaned, legally-precise restatement",
              "keywords": ["Extracted terms for matching"],
              "legal_topics": ["criminal law", "bail", "procedural law"],
              "statutes_referenced": ["Rule 114 Sec. 1", "RPC Art. 308"],
              "jurisdiction": "Philippines",
              "temporal_scope": "weekend",
              "related_terms": ["synonyms", "related concepts"],
              "urgency": "low|medium|high",
              "query_expansions": ["LLM-generated expansion terms"]
            }
            
            Guidelines:
            - Recognize common Philippine legal patterns (RA, RPC, Rules of Court)
            - Extract statute references in standard format
            - Identify legal topics relevant to Philippine law
            - Determine urgency based on context (arrest, court dates, etc.)
            - Generate related terms for better matching
            """, question);
    }
    
    /**
     * System prompt for SQG focused on Philippine law.
     */
    private String getSQGSystemPrompt() {
        return """
            You are a legal query analyzer specialized in Philippine law. Your task is to:
            1. Normalize legal questions into precise, searchable terms
            2. Extract relevant legal topics and statute references
            3. Identify jurisdiction and temporal context
            4. Generate expansion terms for better retrieval
            
            Focus on Philippine legal terminology and common patterns like:
            - Rules of Court (Rule 114, Rule 115, etc.)
            - Revised Penal Code (RPC Art. 308, etc.)
            - Republic Acts (RA 9262, etc.)
            - Legal procedures (bail, arraignment, trial, etc.)
            
            Always respond with valid JSON only.
            """;
    }
    
    /**
     * Parse OpenAI response into StructuredQuery object.
     */
    @SuppressWarnings("unchecked")
    private StructuredQuery parseSQGResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new RuntimeException("No choices in response");
            }
            
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) message.get("content");
            
            // Parse JSON content
            Map<String, Object> sqgData = new com.fasterxml.jackson.databind.ObjectMapper()
                .readValue(content, Map.class);
            
            return new StructuredQuery(
                (String) sqgData.getOrDefault("normalized_question", ""),
                (List<String>) sqgData.getOrDefault("keywords", List.of()),
                (List<String>) sqgData.getOrDefault("legal_topics", List.of()),
                (List<String>) sqgData.getOrDefault("statutes_referenced", List.of()),
                (String) sqgData.getOrDefault("jurisdiction", "Philippines"),
                (String) sqgData.getOrDefault("temporal_scope", ""),
                (List<String>) sqgData.getOrDefault("related_terms", List.of()),
                (String) sqgData.getOrDefault("urgency", "low"),
                (List<String>) sqgData.getOrDefault("query_expansions", List.of())
            );
            
        } catch (Exception e) {
            logger.error("Failed to parse SQG response", e);
            throw new RuntimeException("SQG response parsing failed", e);
        }
    }
    
    /**
     * Create fallback structured query when SQG fails.
     */
    private StructuredQuery createFallbackQuery(String question) {
        if (question == null) question = "";
        
        // Simple keyword extraction
        List<String> keywords = extractSimpleKeywords(question);
        
        // Basic legal topic detection
        List<String> legalTopics = detectBasicLegalTopics(question);
        
        // Basic statute detection
        List<String> statutes = detectBasicStatutes(question);
        
        return new StructuredQuery(
            question.trim(),
            keywords,
            legalTopics,
            statutes,
            "Philippines",
            "",
            keywords, // Use keywords as related terms
            "low",
            List.of()
        );
    }
    
    /**
     * Simple keyword extraction as fallback.
     */
    private List<String> extractSimpleKeywords(String question) {
        if (question == null) return List.of();
        
        return Arrays.stream(question.toLowerCase().split("\\s+"))
            .filter(word -> word.length() > 2)
            .filter(word -> !Arrays.asList("the", "and", "or", "but", "for", "with", "what", "how", "when", "where", "why")
                .contains(word))
            .distinct()
            .toList();
    }
    
    /**
     * Basic legal topic detection as fallback.
     */
    private List<String> detectBasicLegalTopics(String question) {
        if (question == null) return List.of();
        
        String lower = question.toLowerCase();
        List<String> topics = new ArrayList<>();
        
        if (lower.contains("criminal") || lower.contains("crime")) topics.add("criminal law");
        if (lower.contains("civil") || lower.contains("contract")) topics.add("civil law");
        if (lower.contains("family") || lower.contains("marriage")) topics.add("family law");
        if (lower.contains("labor") || lower.contains("employment")) topics.add("labor law");
        if (lower.contains("court") || lower.contains("procedure")) topics.add("procedural law");
        if (lower.contains("bail") || lower.contains("arrest")) topics.add("criminal procedure");
        
        return topics;
    }
    
    /**
     * Basic statute detection as fallback.
     */
    private List<String> detectBasicStatutes(String question) {
        if (question == null) return List.of();
        
        List<String> statutes = new ArrayList<>();
        
        // Detect Rules of Court
        if (question.matches(".*(?i)rule\\s+\\d+.*")) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?i)rule\\s+(\\d+)", 
                java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher matcher = pattern.matcher(question);
            while (matcher.find()) {
                statutes.add("Rule " + matcher.group(1));
            }
        }
        
        // Detect RPC Articles
        if (question.matches(".*(?i)art(?:icle)?\\s+\\d+.*")) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?i)art(?:icle)?\\s+(\\d+)", 
                java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher matcher = pattern.matcher(question);
            while (matcher.find()) {
                statutes.add("RPC Art. " + matcher.group(1));
            }
        }
        
        return statutes;
    }
    
    /**
     * Cache entry for SQG results.
     */
    private static class CacheEntry<T> {
        final T value;
        final long expiryMs;
        
        CacheEntry(T value, long expiryMs) {
            this.value = value;
            this.expiryMs = expiryMs;
        }
        
        boolean isExpired() {
            return System.currentTimeMillis() > expiryMs;
        }
    }
}
