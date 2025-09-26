package com.capstone.civilify.service;

import com.capstone.civilify.DTO.KnowledgeBaseEntry;
import com.capstone.civilify.DTO.KnowledgeBaseChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.util.*;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Service for interacting with the knowledge base system.
 * This service handles RAG (Retrieval-Augmented Generation) functionality
 * by querying the law-entry extension's knowledge base.
 */
@Service
public class KnowledgeBaseService {
    
    private static final Logger logger = LoggerFactory.getLogger(KnowledgeBaseService.class);
    
    @Value("${knowledge.base.api.url:http://localhost:4000}")
    private String knowledgeBaseApiUrl;
    
    @Value("${knowledge.base.api.key:}")
    private String knowledgeBaseApiKey;
    
    @Value("${knowledge.base.enabled:true}")
    private boolean knowledgeBaseEnabled;
    
    @Value("${knowledge.base.similarity.threshold:0.2}")
    private double similarityThreshold;
    
    @Value("${knowledge.base.max.results:5}")
    private int maxResults;
    
    private final RestTemplate restTemplate;
    private volatile String cachedServiceToken;
    private volatile long cachedServiceTokenExpiryMs = 0L;
    
    public KnowledgeBaseService() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Build Authorization headers.
     * - If knowledgeBaseApiKey looks like a complete JWT (three dot-separated parts), use it directly.
     * - Else, treat it as a signing secret and mint a short-lived service token (HS256) to avoid
     *   pasting static tokens in configs. This also prevents accidental whitespace/newline issues.
     */
    private HttpHeaders buildAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String key = knowledgeBaseApiKey != null ? knowledgeBaseApiKey.trim() : "";
        if (key.isEmpty()) {
            return headers;
        }

        String token;
        if (key.split("\\.").length == 3) {
            // Looks like a JWT already
            token = key;
        } else {
            // Looks like a raw shared secret; mint a short-lived JWT and cache it for 5 minutes
            long now = System.currentTimeMillis();
            if (cachedServiceToken == null || now > cachedServiceTokenExpiryMs) {
                Date issuedAt = new Date(now);
                Date expiry = new Date(now + 5 * 60 * 1000L); // 5 minutes
                byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
                cachedServiceToken = Jwts.builder()
                        .setSubject("civilify-service")
                        .claim("role", "service")
                        .setIssuedAt(issuedAt)
                        .setExpiration(expiry)
                        .signWith(Keys.hmacShaKeyFor(keyBytes), SignatureAlgorithm.HS256)
                        .compact();
                cachedServiceTokenExpiryMs = expiry.getTime() - 10_000L; // refresh slightly before expiry
            }
            token = cachedServiceToken;
        }

        headers.set("Authorization", "Bearer " + token);
        return headers;
    }

    /**
     * Search the knowledge base for relevant entries based on a query.
     * 
     * @param query The search query
     * @param limit Maximum number of results to return
     * @return List of knowledge base entries
     */
    public List<KnowledgeBaseEntry> searchKnowledgeBase(String query, int limit) {
        if (!knowledgeBaseEnabled) {
            logger.debug("Knowledge base is disabled, returning empty results");
            return new ArrayList<>();
        }
        
        try {
            logger.info("Searching knowledge base for query: {}", query);
            
            String url = knowledgeBaseApiUrl + "/kb/search";
            
            HttpHeaders headers = buildAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<String, Object>();
            requestBody.put("query", sanitizeUserText(query));
            requestBody.put("limit", Math.min(limit, maxResults));
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, request, new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                if (Boolean.TRUE.equals(responseBody.get("success"))) {
                    Object resultsObj = responseBody.get("results");
                    List<Map<String, Object>> results = new ArrayList<>();
                    if (resultsObj instanceof List<?>) {
                        for (Object item : (List<?>) resultsObj) {
                            if (item instanceof Map<?, ?>) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> casted = (Map<String, Object>) item;
                                results.add(casted);
                            }
                        }
                    }
                    return convertToKnowledgeBaseEntries(results);
                } else {
                    logger.warn("Knowledge base search failed: {}", responseBody.get("error"));
                }
            }
            
        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.warn("Knowledge base service is not available (connection refused). This is expected if the Villy service is not running. Falling back to empty results.");
        } catch (HttpClientErrorException e) {
            logger.error("Client error when searching knowledge base: {}", e.getMessage());
        } catch (HttpServerErrorException e) {
            logger.error("Server error when searching knowledge base: {}", e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error when searching knowledge base", e);
        }
        
        return new ArrayList<>();
    }
    
    /**
     * Chat with the knowledge base using RAG (Retrieval-Augmented Generation).
     * 
     * @param question The user's question
     * @return Knowledge base chat response with answer and sources
     */
    public KnowledgeBaseChatResponse chatWithKnowledgeBase(String question) {
        if (!knowledgeBaseEnabled) {
            logger.debug("Knowledge base is disabled, returning empty response");
            return new KnowledgeBaseChatResponse("", new ArrayList<>(), "Knowledge base is disabled");
        }
        
        try {
            logger.info("Chatting with knowledge base for question: {}", question);
            
            String url = knowledgeBaseApiUrl + "/chat";
            
            HttpHeaders headers = buildAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<String, Object>();
            requestBody.put("question", sanitizeUserText(question));
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, request, new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                
                String answer = (String) responseBody.get("answer");
                Object sourcesObj = responseBody.get("sources");
                List<Map<String, Object>> sources = new ArrayList<>();
                if (sourcesObj instanceof List<?>) {
                    for (Object item : (List<?>) sourcesObj) {
                        if (item instanceof Map<?, ?>) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> casted = (Map<String, Object>) item;
                            sources.add(casted);
                        }
                    }
                }
                
                return new KnowledgeBaseChatResponse(
                    answer != null ? answer : "",
                    convertToKnowledgeBaseEntries(sources),
                    null
                );
            }
            
        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.warn("Knowledge base service is not available (connection refused). This is expected if the Villy service is not running. Falling back to empty response.");
            return new KnowledgeBaseChatResponse("", new ArrayList<>(), "Knowledge base service is not available");
        } catch (HttpClientErrorException e) {
            logger.error("Client error when chatting with knowledge base: {}", e.getMessage());
            return new KnowledgeBaseChatResponse("", new ArrayList<>(), "Client error: " + e.getMessage());
        } catch (HttpServerErrorException e) {
            logger.error("Server error when chatting with knowledge base: {}", e.getMessage());
            return new KnowledgeBaseChatResponse("", new ArrayList<>(), "Server error: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error when chatting with knowledge base", e);
            return new KnowledgeBaseChatResponse("", new ArrayList<>(), "Unexpected error: " + e.getMessage());
        }
        
        return new KnowledgeBaseChatResponse("", new ArrayList<>(), "Failed to get response from knowledge base");
    }
    
    /**
     * Check if the knowledge base has relevant information for a given query.
     * 
     * @param query The search query
     * @return true if relevant information is found, false otherwise
     */
    public boolean hasRelevantInformation(String query) {
        List<KnowledgeBaseEntry> results = searchKnowledgeBase(query, 1);
        
        if (results.isEmpty()) {
            return false;
        }
        
        // Check if the top result has sufficient similarity
        KnowledgeBaseEntry topResult = results.get(0);
        return topResult.getSimilarity() >= similarityThreshold;
    }
    
    /**
     * Get knowledge base health status.
     * 
     * @return true if knowledge base is accessible, false otherwise
     */
    public boolean isKnowledgeBaseHealthy() {
        if (!knowledgeBaseEnabled) {
            return false;
        }
        
        try {
            String url = knowledgeBaseApiUrl + "/health";
            
            HttpHeaders headers = buildAuthHeaders();
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, request, String.class);
            
            return response.getStatusCode().is2xxSuccessful();
            
        } catch (Exception e) {
            logger.warn("Knowledge base health check failed: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Convert raw API response to KnowledgeBaseEntry objects.
     */
    private List<KnowledgeBaseEntry> convertToKnowledgeBaseEntries(List<Map<String, Object>> rawResults) {
        List<KnowledgeBaseEntry> entries = new ArrayList<>();
        
        if (rawResults == null) {
            return entries;
        }
        
        for (Map<String, Object> result : rawResults) {
            try {
                KnowledgeBaseEntry entry = new KnowledgeBaseEntry();
                
                entry.setEntryId((String) result.get("entry_id"));
                entry.setType((String) result.get("type"));
                entry.setTitle((String) result.get("title"));
                entry.setCanonicalCitation((String) result.get("canonical_citation"));
                entry.setSummary((String) result.get("summary"));
                entry.setText((String) result.get("text"));
                
                // Handle tags array
                Object tagsObj = result.get("tags");
            if (tagsObj instanceof List<?>) {
                List<String> tags = new ArrayList<>();
                for (Object t : (List<?>) tagsObj) {
                    if (t instanceof String) tags.add((String) t);
                }
                entry.setTags(tags);
            }
                
                // Handle similarity score
                Object similarityObj = result.get("similarity");
                if (similarityObj instanceof Number) {
                    entry.setSimilarity(((Number) similarityObj).doubleValue());
                }
                
                // Handle additional fields
                entry.setRuleNo((String) result.get("rule_no"));
                entry.setSectionNo((String) result.get("section_no"));
                entry.setRightsScope((String) result.get("rights_scope"));
                
                entries.add(entry);
                
            } catch (Exception e) {
                logger.warn("Failed to convert knowledge base result: {}", e.getMessage());
            }
        }
        
        return entries;
    }
    
    /**
     * Get a specific knowledge base entry by ID.
     * @param entryId Entry ID
     * @return Knowledge base entry or null if not found
     */
    public KnowledgeBaseEntry getKnowledgeBaseEntry(String entryId) {
        if (!knowledgeBaseEnabled) {
            logger.debug("Knowledge base is disabled");
            return null;
        }
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (knowledgeBaseApiKey != null && !knowledgeBaseApiKey.isEmpty()) {
                headers.set("Authorization", "Bearer " + knowledgeBaseApiKey);
            }
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                knowledgeBaseApiUrl + "/kb/entries/" + entryId,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return mapToKnowledgeBaseEntry(response.getBody());
            }
            
        } catch (Exception e) {
            logger.error("Error retrieving knowledge base entry: " + entryId, e);
        }
        
        return null;
    }
    
    /**
     * Convert a single map response to KnowledgeBaseEntry.
     */
    private KnowledgeBaseEntry mapToKnowledgeBaseEntry(Map<String, Object> result) {
        try {
            KnowledgeBaseEntry entry = new KnowledgeBaseEntry();
            
            entry.setEntryId((String) result.get("entry_id"));
            entry.setType((String) result.get("type"));
            entry.setTitle((String) result.get("title"));
            entry.setCanonicalCitation((String) result.get("canonical_citation"));
            entry.setSummary((String) result.get("summary"));
            entry.setText((String) result.get("text"));
            
            // Handle tags array
            Object tagsObj = result.get("tags");
            if (tagsObj instanceof List<?>) {
                List<String> tags = new ArrayList<>();
                for (Object t : (List<?>) tagsObj) {
                    if (t instanceof String) tags.add((String) t);
                }
                entry.setTags(tags);
            }
            
            // Handle similarity score
            Object similarityObj = result.get("similarity");
            if (similarityObj instanceof Number) {
                entry.setSimilarity(((Number) similarityObj).doubleValue());
            }
            
            // Handle additional fields
            entry.setRuleNo((String) result.get("rule_no"));
            entry.setSectionNo((String) result.get("section_no"));
            entry.setRightsScope((String) result.get("rights_scope"));
            
            return entry;
            
        } catch (Exception e) {
            logger.warn("Failed to convert knowledge base entry: {}", e.getMessage());
            return null;
        }
    }
    
    private String sanitizeUserText(String text) {
        if (text == null) return "";
        // Strip any local meta/system steering added by UI before sending to KB
        String cleaned = text.replaceAll("(?is)The user\\'s input fits the current mode.*?reply\\.", "").trim();
        // collapse excessive whitespace
        cleaned = cleaned.replaceAll("\n+", "\n").replaceAll("\\s{2,}", " ").trim();
        return cleaned.isEmpty() ? text : cleaned;
    }

    /**
     * Check if the knowledge base service is healthy.
     * @return true if healthy, false otherwise
     */
    public boolean isHealthy() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                knowledgeBaseApiUrl + "/health", String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (org.springframework.web.client.ResourceAccessException e) {
            logger.warn("Knowledge base service is not available (connection refused). This is expected if the Villy service is not running.");
            return false;
        } catch (Exception e) {
            logger.error("Knowledge base health check failed", e);
            return false;
        }
    }
}
