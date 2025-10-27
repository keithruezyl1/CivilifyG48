package com.capstone.civilify.service;

import com.capstone.civilify.dto.KnowledgeBaseEntry;
import com.capstone.civilify.dto.StructuredQuery;
import com.capstone.civilify.dto.EnhancedRAGResponse;
import com.capstone.civilify.dto.RAGMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Enhanced Knowledge Base Service implementing Villy's hybrid retrieval approach.
 * Combines vector search, lexical search, and fast-path matching with confidence gating.
 */
@Service
public class EnhancedKnowledgeBaseService {
    
    private static final Logger logger = LoggerFactory.getLogger(EnhancedKnowledgeBaseService.class);
    
    @Autowired
    private StructuredQueryGenerationService sqgService;
    
    @Value("${knowledge.base.api.url:https://law-entry-extension.onrender.com/api}")
    private String knowledgeBaseApiUrl;
    
    @Value("${knowledge.base.api.key}")
    private String knowledgeBaseApiKey;
    
    @Value("${knowledge.base.enabled:true}")
    private boolean knowledgeBaseEnabled;
    
    @Value("${knowledge.base.confidence.threshold:0.18}")
    private double confidenceThreshold;
    
    @Value("${knowledge.base.top.k:12}")
    private int topK;
    
    @Value("${knowledge.base.similarity.threshold:0.20}")
    private double similarityThreshold;
    
    @Value("${knowledge.base.cache.ttl.seconds:60}")
    private int cacheTtlSeconds;
    
    private final RestTemplate restTemplate;
    private final Map<String, CacheEntry<EnhancedRAGResponse>> responseCache;
    
    public EnhancedKnowledgeBaseService() {
        this.restTemplate = new RestTemplate();
        this.responseCache = new ConcurrentHashMap<>();
    }
    
    /**
     * Enhanced RAG chat with KB-first approach and confidence gating.
     * 
     * @param question User question
     * @param mode GLI (A) or CPA (B) mode
     * @return Enhanced RAG response with metadata
     */
    public EnhancedRAGResponse chatWithKnowledgeBase(String question, String mode) {
        if (!knowledgeBaseEnabled) {
            logger.debug("Knowledge base is disabled");
            return new EnhancedRAGResponse("", List.of(), 
                new RAGMetadata(0.0, false, false, false, "disabled", List.of()), 
                "Knowledge base is disabled");
        }
        
        if (question == null || question.trim().isEmpty()) {
            return new EnhancedRAGResponse("", List.of(), 
                new RAGMetadata(0.0, false, false, false, "empty", List.of()), 
                "Empty question");
        }
        
        // Check cache first
        String cacheKey = question.toLowerCase().trim() + "::" + mode;
        CacheEntry<EnhancedRAGResponse> cached = responseCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            logger.debug("KB cache hit for question: {}", question);
            return cached.value;
        }
        
        try {
            // Step 1: Generate structured query
            StructuredQuery sqg = sqgService.generateStructuredQuery(question);
            logger.info("SQG generated for question: {}", question);
            
            // Step 2: Perform hybrid retrieval
            List<KnowledgeBaseEntry> retrievedEntries = performHybridRetrieval(question, sqg);
            logger.info("Retrieved {} entries from KB", retrievedEntries.size());
            
            // Step 3: Calculate confidence and apply gating
            double confidence = calculateConfidence(retrievedEntries, sqg);
            String retrievalMethod = determineRetrievalMethod(retrievedEntries);
            
            // Step 4: Apply confidence gating
            if (confidence < getDynamicThreshold(sqg, mode)) {
                logger.info("Low confidence ({}) for question: {}, using fallback", confidence, question);
                return createLowConfidenceResponse(question, retrievedEntries, confidence, retrievalMethod, sqg);
            }
            
            // Step 5: Generate KB-first response
            String kbAnswer = generateKBFirstResponse(question, retrievedEntries, mode);
            
            // Step 6: Create enhanced response
            EnhancedRAGResponse response = new EnhancedRAGResponse(
                kbAnswer,
                retrievedEntries,
                new RAGMetadata(
                    confidence,
                    true, // KB-first
                    true, // Used SQG
                    false, // No reranking yet
                    retrievalMethod,
                    sqg.legalTopics()
                ),
                null
            );
            
            // Cache the response
            responseCache.put(cacheKey, new CacheEntry<>(response, 
                System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(cacheTtlSeconds)));
            
            return response;
            
        } catch (Exception e) {
            logger.error("Error in enhanced KB chat", e);
            return new EnhancedRAGResponse("", List.of(), 
                new RAGMetadata(0.0, false, false, false, "error", List.of()), 
                "KB service error: " + e.getMessage());
        }
    }
    
    /**
     * Perform hybrid retrieval combining vector, lexical, and fast-path matching.
     */
    private List<KnowledgeBaseEntry> performHybridRetrieval(String question, StructuredQuery sqg) {
        List<KnowledgeBaseEntry> allResults = new ArrayList<>();
        
        try {
            // 1. Vector search (primary)
            List<KnowledgeBaseEntry> vectorResults = performVectorSearch(question, sqg);
            allResults.addAll(vectorResults);
            logger.debug("Vector search returned {} results", vectorResults.size());
            
            // 2. Lexical search (fallback)
            if (vectorResults.isEmpty() || getMaxSimilarity(vectorResults) < similarityThreshold) {
                List<KnowledgeBaseEntry> lexicalResults = performLexicalSearch(question, sqg);
                allResults.addAll(lexicalResults);
                logger.debug("Lexical search returned {} results", lexicalResults.size());
            }
            
            // 3. Fast-path matching (exact citations)
            if (sqg.hasStatuteReferences()) {
                List<KnowledgeBaseEntry> fastPathResults = performFastPathMatching(sqg);
                allResults.addAll(fastPathResults);
                logger.debug("Fast-path matching returned {} results", fastPathResults.size());
            }
            
            // 4. Deduplicate and score
            return deduplicateAndScore(allResults, sqg);
            
        } catch (Exception e) {
            logger.error("Error in hybrid retrieval", e);
            return List.of();
        }
    }
    
    /**
     * Perform vector similarity search.
     */
    private List<KnowledgeBaseEntry> performVectorSearch(String question, StructuredQuery sqg) {
        try {
            String url = knowledgeBaseApiUrl + "/kb/search";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("query", question);
            requestBody.put("limit", topK);
            requestBody.put("method", "vector");
            
            // Add SQG metadata for filtering
            if (!sqg.legalTopics().isEmpty()) {
                requestBody.put("legal_topics", sqg.legalTopics());
            }
            
            HttpHeaders headers = buildAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> responseBody = response.getBody();
                return parseSearchResults(responseBody);
            }
            
        } catch (Exception e) {
            logger.warn("Vector search failed", e);
        }
        
        return List.of();
    }
    
    /**
     * Perform lexical/trigram search.
     */
    private List<KnowledgeBaseEntry> performLexicalSearch(String question, StructuredQuery sqg) {
        try {
            String url = knowledgeBaseApiUrl + "/kb/search";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("query", question);
            requestBody.put("limit", topK);
            requestBody.put("method", "lexical");
            
            HttpHeaders headers = buildAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> responseBody = response.getBody();
                return parseSearchResults(responseBody);
            }
            
        } catch (Exception e) {
            logger.warn("Lexical search failed", e);
        }
        
        return List.of();
    }
    
    /**
     * Perform fast-path matching for exact citations.
     */
    private List<KnowledgeBaseEntry> performFastPathMatching(StructuredQuery sqg) {
        try {
            String url = knowledgeBaseApiUrl + "/kb/search";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("statutes_referenced", sqg.statutesReferenced());
            requestBody.put("limit", 8);
            requestBody.put("method", "fast-path");
            
            HttpHeaders headers = buildAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> responseBody = response.getBody();
                return parseSearchResults(responseBody);
            }
            
        } catch (Exception e) {
            logger.warn("Fast-path matching failed", e);
        }
        
        return List.of();
    }
    
    /**
     * Calculate confidence score based on retrieval results.
     */
    private double calculateConfidence(List<KnowledgeBaseEntry> entries, StructuredQuery sqg) {
        if (entries.isEmpty()) return 0.0;
        
        double maxSimilarity = getMaxSimilarity(entries);
        double avgSimilarity = getAvgSimilarity(entries);
        
        // Base confidence from similarity
        double confidence = Math.max(maxSimilarity * 0.9, avgSimilarity * 0.8);
        
        // Boost for exact citation matches
        if (sqg.hasStatuteReferences()) {
            boolean hasExactMatch = entries.stream()
                .anyMatch(entry -> sqg.statutesReferenced().stream()
                    .anyMatch(statute -> entry.getCanonicalCitation() != null && 
                        entry.getCanonicalCitation().toLowerCase().contains(statute.toLowerCase())));
            if (hasExactMatch) {
                confidence += 0.2;
            }
        }
        
        // Boost for legal topic alignment
        if (!sqg.legalTopics().isEmpty()) {
            boolean hasTopicMatch = entries.stream()
                .anyMatch(entry -> entry.getTags() != null && 
                    sqg.legalTopics().stream()
                        .anyMatch(topic -> entry.getTags().stream()
                            .anyMatch(tag -> tag.toLowerCase().contains(topic.toLowerCase()))));
            if (hasTopicMatch) {
                confidence += 0.1;
            }
        }
        
        return Math.min(1.0, confidence);
    }
    
    /**
     * Get dynamic confidence threshold based on query characteristics.
     */
    private double getDynamicThreshold(StructuredQuery sqg, String mode) {
        double baseThreshold = confidenceThreshold;
        
        // Lower threshold for citation queries
        if (sqg.hasStatuteReferences()) {
            baseThreshold = Math.max(0.12, baseThreshold * 0.7);
        }
        
        // Lower threshold for urgent queries
        if (sqg.isHighUrgency()) {
            baseThreshold = Math.max(0.14, baseThreshold * 0.8);
        }
        
        // Lower threshold for procedural queries
        if (sqg.isProceduralQuery()) {
            baseThreshold = Math.max(0.08, baseThreshold * 0.5);
        }
        
        // Lower threshold for CPA mode (more specific)
        if ("B".equals(mode)) {
            baseThreshold = Math.max(0.10, baseThreshold * 0.8);
        }
        
        return baseThreshold;
    }
    
    /**
     * Generate KB-first response using retrieved context.
     */
    private String generateKBFirstResponse(String question, List<KnowledgeBaseEntry> entries, String mode) {
        try {
            String url = knowledgeBaseApiUrl + "/chat";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("question", question);
            requestBody.put("context_entries", entries);
            requestBody.put("mode", mode);
            requestBody.put("kb_first", true);
            
            HttpHeaders headers = buildAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> responseBody = response.getBody();
                return (String) responseBody.getOrDefault("answer", "");
            }
            
        } catch (Exception e) {
            logger.warn("KB-first response generation failed", e);
        }
        
        return "";
    }
    
    /**
     * Create low confidence response with fallback information.
     */
    private EnhancedRAGResponse createLowConfidenceResponse(String question, 
            List<KnowledgeBaseEntry> entries, double confidence, String retrievalMethod, StructuredQuery sqg) {
        
        String fallbackAnswer = String.format(
            "I found some related information but I'm not confident enough to provide a complete answer. " +
            "Confidence: %.1f%%. Please consult a licensed lawyer for specific legal advice.",
            confidence * 100
        );
        
        return new EnhancedRAGResponse(
            fallbackAnswer,
            entries,
            new RAGMetadata(
                confidence,
                false, // Not KB-first due to low confidence
                true,  // Used SQG
                false, // No reranking
                retrievalMethod,
                sqg.legalTopics()
            ),
            "Low confidence response"
        );
    }
    
    /**
     * Helper methods for similarity calculations and parsing.
     */
    private double getMaxSimilarity(List<KnowledgeBaseEntry> entries) {
        return entries.stream()
            .mapToDouble(entry -> entry.getSimilarity() != null ? entry.getSimilarity() : 0.0)
            .max()
            .orElse(0.0);
    }
    
    private double getAvgSimilarity(List<KnowledgeBaseEntry> entries) {
        return entries.stream()
            .mapToDouble(entry -> entry.getSimilarity() != null ? entry.getSimilarity() : 0.0)
            .average()
            .orElse(0.0);
    }
    
    private String determineRetrievalMethod(List<KnowledgeBaseEntry> entries) {
        if (entries.isEmpty()) return "none";
        
        double maxSim = getMaxSimilarity(entries);
        if (maxSim > 0.7) return "vector";
        if (maxSim > 0.3) return "hybrid";
        return "lexical";
    }
    
    private List<KnowledgeBaseEntry> deduplicateAndScore(List<KnowledgeBaseEntry> entries, StructuredQuery sqg) {
        // Remove duplicates by entry_id
        Map<String, KnowledgeBaseEntry> uniqueEntries = new LinkedHashMap<>();
        for (KnowledgeBaseEntry entry : entries) {
            String entryId = entry.getEntryId();
            if (entryId != null && !uniqueEntries.containsKey(entryId)) {
                uniqueEntries.put(entryId, entry);
            }
        }
        
        // Sort by similarity score
        return uniqueEntries.values().stream()
            .sorted((a, b) -> {
                double simA = a.getSimilarity() != null ? a.getSimilarity() : 0.0;
                double simB = b.getSimilarity() != null ? b.getSimilarity() : 0.0;
                return Double.compare(simB, simA);
            })
            .limit(topK)
            .toList();
    }
    
    private List<KnowledgeBaseEntry> parseSearchResults(Map<String, Object> responseBody) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = (List<Map<String, Object>>) responseBody.get("results");
            if (results == null) return List.of();
            
            List<KnowledgeBaseEntry> entries = new ArrayList<>();
            for (Map<String, Object> result : results) {
                KnowledgeBaseEntry entry = new KnowledgeBaseEntry();
                entry.setEntryId((String) result.get("entry_id"));
                entry.setType((String) result.get("type"));
                entry.setTitle((String) result.get("title"));
                entry.setCanonicalCitation((String) result.get("canonical_citation"));
                entry.setSummary((String) result.get("summary"));
                entry.setText((String) result.get("text"));
                
                // Handle similarity score
                Object similarityObj = result.get("similarity");
                if (similarityObj instanceof Number) {
                    entry.setSimilarity(((Number) similarityObj).doubleValue());
                }
                
                entries.add(entry);
            }
            
            return entries;
            
        } catch (Exception e) {
            logger.error("Failed to parse search results", e);
            return List.of();
        }
    }
    
    private HttpHeaders buildAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        if (knowledgeBaseApiKey != null && !knowledgeBaseApiKey.trim().isEmpty()) {
            headers.set("Authorization", "Bearer " + knowledgeBaseApiKey.trim());
        }
        return headers;
    }
    
    /**
     * Cache entry for enhanced responses.
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
