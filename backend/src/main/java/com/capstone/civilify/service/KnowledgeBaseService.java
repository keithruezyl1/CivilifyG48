package com.capstone.civilify.service;

import com.capstone.civilify.DTO.KnowledgeBaseEntry;
import com.capstone.civilify.DTO.KnowledgeBaseChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import jakarta.annotation.PostConstruct;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.stream.Collectors;
import java.util.LinkedHashSet;

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
    
    @Value("${knowledge.base.retry.attempts:3}")
    private int knowledgeBaseRetryAttempts;
    
    @Value("${knowledge.base.retry.delay:1000}")
    private long knowledgeBaseRetryDelay;
    
    @Value("${knowledge.base.timeout:30000}")
    private int knowledgeBaseTimeout;
    
    @Value("${knowledge.base.cache.ttl.seconds:60}")
    private int knowledgeBaseCacheTtlSeconds;
    
    @Value("${knowledge.base.query.min.length:3}")
    private int knowledgeBaseMinQueryLength;
    
    @Value("${knowledge.base.sqg.enabled:true}")
    private boolean sqgEnabled;
    
    @Value("${knowledge.base.metadata.filtering.enabled:true}")
    private boolean metadataFilteringEnabled;
    
    @Value("${knowledge.base.confidence.threshold:0.15}")
    private double confidenceThreshold;
    
    @Value("${knowledge.base.simple.query.skip.sqg:true}")
    private boolean simpleQuerySkipSqg;
    
    @Value("${knowledge.base.metadata.min.topics:2}")
    private int metadataMinTopics;
    
    @Value("${knowledge.base.cross.encoder.blend:0.8}")
    private double crossEncoderBlend;
    
    @Value("${knowledge.base.cross.encoder.cache.max:2000}")
    private int crossEncoderCacheMax;
    
    @Value("${knowledge.base.cross.encoder.ttl.ms:1800000}")
    private long crossEncoderTtlMs;
    
    @Value("${knowledge.base.early.termination.threshold:0.80}")
    private double earlyTerminationThreshold;
    
    @Value("${knowledge.base.embed.cache.max:5000}")
    private int embedCacheMax;
    
    @Value("${knowledge.base.embed.ttl.ms:7200000}")
    private long embedTtlMs;
    
    @Value("${knowledge.base.response.cache.max:1000}")
    private int responseCacheMax;
    
    @Value("${knowledge.base.response.ttl.ms:1800000}")
    private long responseTtlMs;
    
    @Value("${knowledge.base.sqg.model:gpt-4o-mini}")
    private String sqgModel;
    
    @Value("${knowledge.base.sqg.cache.max:2000}")
    private int sqgCacheMax;
    
    @Value("${knowledge.base.sqg.ttl.ms:3600000}")
    private long sqgTtlMs;
    
    @Value("${knowledge.base.rerank.mode:cross-encoder}")
    private String rerankMode;
    
    @Value("${knowledge.base.rerank.model:gpt-4o-mini}")
    private String rerankModel;
    
    @Value("${knowledge.base.use.reranker:false}")
    private boolean useReranker;
    
    @Value("${knowledge.base.use.streaming:true}")
    private boolean useStreaming;
    
    @Value("${knowledge.base.performance.logging:true}")
    private boolean performanceLogging;
    
    private final RestTemplate restTemplate;
    private volatile String cachedServiceToken;
    private volatile long cachedServiceTokenExpiryMs = 0L;
    
    // Simple in-memory cache and in-flight de-duplication
    private static class CacheEntry<T> {
        final T value; final long expiryMs;
        CacheEntry(T value, long expiryMs) { this.value = value; this.expiryMs = expiryMs; }
        boolean isExpired() { return System.currentTimeMillis() > expiryMs; }
    }
    private final Map<String, CacheEntry<List<KnowledgeBaseEntry>>> resultCache = new ConcurrentHashMap<>();
    private final Map<String, Object> inFlightLocks = new ConcurrentHashMap<>();
    
    public KnowledgeBaseService() {
        this.restTemplate = new RestTemplate();
    }
    
    @PostConstruct
    private void configureRestTemplateTimeouts() {
        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(knowledgeBaseTimeout);
            factory.setReadTimeout(knowledgeBaseTimeout);
            this.restTemplate.setRequestFactory(factory);
        } catch (Exception e) {
            logger.warn("Failed to configure KB timeouts: {}", e.getMessage());
        }
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
        if (query == null || query.trim().length() < knowledgeBaseMinQueryLength) {
            return new ArrayList<>();
        }
        String normalizedQuery = sanitizeUserText(query).toLowerCase(Locale.ROOT).trim();
        int effectiveLimit = Math.min(Math.max(1, limit), Math.max(1, maxResults));
        String cacheKey = normalizedQuery + "::" + effectiveLimit;
        
        CacheEntry<List<KnowledgeBaseEntry>> cached = resultCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.value;
        }
        
        Object lock = inFlightLocks.computeIfAbsent(cacheKey, k -> new Object());
        synchronized (lock) {
            try {
                cached = resultCache.get(cacheKey);
                if (cached != null && !cached.isExpired()) {
                    return cached.value;
                }
                return executeSearchWithRetry(normalizedQuery, effectiveLimit, cacheKey);
            } finally {
                inFlightLocks.remove(cacheKey);
            }
        }
    }

    private List<KnowledgeBaseEntry> executeSearchWithRetry(String query, int limit, String cacheKey) {
        int attempts = Math.max(1, knowledgeBaseRetryAttempts);
        long baseDelay = Math.max(100, knowledgeBaseRetryDelay);
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                return doSearch(query, limit, cacheKey);
            } catch (HttpClientErrorException.TooManyRequests e429) {
                long delayMs = parseRetryAfterMs(e429.getResponseHeaders(), baseDelay, attempt);
                logger.warn("KB 429 Too Many Requests. Attempt {}/{}. Backing off for {} ms", attempt, attempts, delayMs);
                sleepQuietly(delayMs);
            } catch (org.springframework.web.client.ResourceAccessException e) {
                if (attempt < attempts) {
                    long delayMs = jitteredDelay(baseDelay, attempt);
                    logger.warn("KB connection issue. Attempt {}/{}. Backing off for {} ms", attempt, attempts, delayMs);
                    sleepQuietly(delayMs);
                } else {
                    logger.warn("Knowledge base service is not available (connection refused). Returning empty results.");
                }
            } catch (Exception e) {
                logger.error("Unexpected KB error on attempt {}/{}", attempt, attempts, e);
                break;
            }
        }
        return new ArrayList<>();
    }

    private List<KnowledgeBaseEntry> doSearch(String query, int limit, String cacheKey) {
        logger.info("Searching knowledge base for query: {}", query);
        String url = knowledgeBaseApiUrl + "/kb/search";
        Map<String, Object> requestBody = new HashMap<String, Object>();
        requestBody.put("query", query);
        requestBody.put("limit", limit);

        // Try auth variants: minted/jwt -> raw bearer -> x-api-key
        List<String> variants = Arrays.asList("minted", "raw", "x-api-key");
        for (String variant : variants) {
            try {
                ResponseEntity<Map<String, Object>> response = postWithVariant(url, requestBody, variant);
                if (response != null && response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
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
                                    // Log raw response structure for debugging sourceUrls
                                    if (logger.isDebugEnabled()) {
                                        logger.debug("KB search result keys: {}", casted.keySet());
                                        logger.debug("KB search result source_urls: {}", casted.get("source_urls"));
                                        logger.debug("KB search result sourceUrls: {}", casted.get("sourceUrls"));
                                    }
                                }
                            }
                        }
                        List<KnowledgeBaseEntry> entries = convertToKnowledgeBaseEntries(results);
                        // Log final entries to verify sourceUrls are set
                        for (KnowledgeBaseEntry entry : entries) {
                            if (entry.getSourceUrls() != null && !entry.getSourceUrls().isEmpty()) {
                                logger.info("Entry '{}' has {} sourceUrls: {}", entry.getTitle(), entry.getSourceUrls().size(), entry.getSourceUrls());
                            } else {
                                logger.debug("Entry '{}' has no sourceUrls", entry.getTitle());
                            }
                        }
                        resultCache.put(cacheKey, new CacheEntry<>(entries, System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(knowledgeBaseCacheTtlSeconds)));
                        return entries;
                    }
                }
            } catch (HttpClientErrorException.TooManyRequests e429) {
                // Do not try other variants on rate limit; bubble up so outer retry/backoff applies
                logger.warn("KB rate limited on variant '{}': {}", variant, e429.getMessage());
                throw e429;
            } catch (HttpClientErrorException.Forbidden e403) {
                logger.warn("KB auth variant '{}' failed with 403: {}", variant, e403.getResponseBodyAsString());
                // fallthrough to next variant
            } catch (Exception e) {
                logger.warn("KB variant '{}' failed: {}", variant, e.getMessage());
            }
        }
        return new ArrayList<>();
    }

    private ResponseEntity<Map<String, Object>> postWithVariant(String url, Map<String, Object> body, String variant) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.set("User-Agent", "Civilify/1.0 KB Client");

        try {
            if ("minted".equals(variant)) {
                HttpHeaders auth = buildAuthHeaders();
                headers.putAll(auth);
            } else if ("raw".equals(variant)) {
                if (knowledgeBaseApiKey != null && !knowledgeBaseApiKey.trim().isEmpty()) {
                    headers.set("Authorization", "Bearer " + knowledgeBaseApiKey.trim());
                }
            } else if ("x-api-key".equals(variant)) {
                if (knowledgeBaseApiKey != null && !knowledgeBaseApiKey.trim().isEmpty()) {
                    headers.set("x-api-key", knowledgeBaseApiKey.trim());
                }
            }
        } catch (Exception e) {
            // If minting fails due to weak key, continue without throwing
            logger.debug("Auth header build error for variant '{}': {}", variant, e.getMessage());
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        return restTemplate.exchange(url, HttpMethod.POST, request, new ParameterizedTypeReference<Map<String, Object>>() {});
    }

    private long parseRetryAfterMs(HttpHeaders headers, long baseDelay, int attempt) {
        if (headers != null) {
            List<String> retryAfter = headers.get("Retry-After");
            if (retryAfter != null && !retryAfter.isEmpty()) {
                try {
                    long seconds = Long.parseLong(retryAfter.get(0).trim());
                    return TimeUnit.SECONDS.toMillis(Math.max(1, seconds));
                } catch (NumberFormatException ignore) { }
            }
        }
        return jitteredDelay(baseDelay, attempt);
    }

    private long jitteredDelay(long baseDelay, int attempt) {
        long exp = (long) (baseDelay * Math.pow(2, attempt - 1));
        long jitter = (long) (Math.random() * baseDelay);
        return Math.min(TimeUnit.SECONDS.toMillis(10), exp + jitter);
    }

    private void sleepQuietly(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
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
        } catch (HttpClientErrorException.TooManyRequests e429) {
            logger.warn("KB 429 Too Many Requests while chatting with knowledge base. Render free tier may be waking the service.");
            logger.error("Client error when chatting with knowledge base: {}", e429.getMessage());
            return new KnowledgeBaseChatResponse("", new ArrayList<>(), "Client error: " + e429.getMessage());
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
            // The knowledgeBaseApiUrl already includes /api, so we just need /health
            // Remove trailing slash if present, then append /health
            String baseUrl = knowledgeBaseApiUrl.endsWith("/") 
                ? knowledgeBaseApiUrl.substring(0, knowledgeBaseApiUrl.length() - 1) 
                : knowledgeBaseApiUrl;
            String url = baseUrl + "/health";
            
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
                
                List<String> sourceUrls = extractSourceUrls(result);
                    entry.setSourceUrls(sourceUrls);
                if (!sourceUrls.isEmpty()) {
                    entry.setPrimaryUrl(sourceUrls.get(0));
                    logger.info("Using {} URLs from KB API for entry: {} - {}", 
                        sourceUrls.size(), entry.getTitle(), sourceUrls);
                } else if (!backfillEntryDetails(entry)) {
                    logger.debug("No KB-provided source URLs for entry: {} (available keys: {})",
                        entry.getTitle(), result.keySet());
                }
                
                // Log final state
                if (entry.getSourceUrls().isEmpty()) {
                    logger.debug("Entry '{}' has no sourceUrls after all attempts", entry.getTitle());
                } else {
                    logger.debug("Entry '{}' has {} sourceUrls: {}", entry.getTitle(), entry.getSourceUrls().size(), entry.getSourceUrls());
                }
                
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
            HttpHeaders headers = buildAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                knowledgeBaseApiUrl + "/kb/entries/" + entryId,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                // KB API returns { success: true, entry: {...} } - unwrap the entry field
                Object entryObj = body.get("entry");
                if (entryObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> entryMap = (Map<String, Object>) entryObj;
                    return mapToKnowledgeBaseEntry(entryMap);
                } else {
                    // Fallback: if response structure is different, try direct mapping
                    logger.debug("KB entry response missing 'entry' field, attempting direct mapping. Keys: {}", body.keySet());
                    return mapToKnowledgeBaseEntry(body);
                }
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
            
            String entryId = firstNonBlank(
                asString(result.get("entry_id")),
                asString(result.get("entryId")),
                asString(result.get("id"))
            );
            entry.setEntryId(entryId);
            if (entryId == null || entryId.isBlank()) {
                logger.warn("KB entry missing entry_id. Available keys: {}", result.keySet());
            }
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
            
            List<String> sourceUrls = extractSourceUrls(result);
                entry.setSourceUrls(sourceUrls);
            if (!sourceUrls.isEmpty()) {
                entry.setPrimaryUrl(sourceUrls.get(0));
                logger.info("Using {} URLs from KB API for entry: {} - {}", 
                    sourceUrls.size(), entry.getTitle(), sourceUrls);
            } else if (!backfillEntryDetails(entry)) {
                logger.debug("No KB-provided source URLs for entry: {} (available keys: {})",
                    entry.getTitle(), result.keySet());
            }
            
            return entry;
            
        } catch (Exception e) {
            logger.warn("Failed to convert knowledge base entry: {}", e.getMessage());
            return null;
        }
    }
    
    private List<String> extractSourceUrls(Map<String, Object> result) {
        LinkedHashSet<String> collector = new LinkedHashSet<>();
        
        addUrlIfValid(collector, result.get("primary_url"));
        addUrlIfValid(collector, result.get("primaryUrl"));
        
        addUrlsFromObject(collector, result.get("source_urls"));
        addUrlsFromObject(collector, result.get("sourceUrls"));
        addUrlsFromObject(collector, result.get("source_url"));
        addUrlsFromObject(collector, result.get("sourceUrl"));
        
        addUrlIfValid(collector, result.get("url"));
        
        Object urlsObj = result.get("urls");
        if (urlsObj instanceof List<?>) {
            for (Object item : (List<?>) urlsObj) {
                if (item instanceof Map<?, ?> map) {
                    addUrlIfValid(collector, map.get("url"));
                } else {
                    addUrlIfValid(collector, item);
                }
            }
        } else {
            addUrlIfValid(collector, urlsObj);
        }
        
        Object externalRelationsObj = result.get("external_relations");
        if (externalRelationsObj instanceof List<?>) {
            for (Object relation : (List<?>) externalRelationsObj) {
                if (relation instanceof Map<?, ?> map) {
                    addUrlIfValid(collector, map.get("url"));
                }
            }
        }
        
        return new ArrayList<>(collector);
    }
    
    /**
     * If a KB search result doesn't include URL metadata, fetch the full entry
     * to populate source URLs and summaries from the authoritative record.
     */
    private boolean backfillEntryDetails(KnowledgeBaseEntry entry) {
        if (entry == null || entry.getEntryId() == null || entry.getEntryId().trim().isEmpty()) {
            return false;
        }
        try {
            KnowledgeBaseEntry detailed = getKnowledgeBaseEntry(entry.getEntryId());
            if (detailed == null) {
                return false;
            }
            if ((entry.getSourceUrls() == null || entry.getSourceUrls().isEmpty())
                && detailed.getSourceUrls() != null && !detailed.getSourceUrls().isEmpty()) {
                entry.setSourceUrls(detailed.getSourceUrls());
                entry.setPrimaryUrl(detailed.getPrimaryUrl());
            }
            if ((entry.getSummary() == null || entry.getSummary().isBlank()) && detailed.getSummary() != null) {
                entry.setSummary(detailed.getSummary());
            }
            if ((entry.getText() == null || entry.getText().isBlank()) && detailed.getText() != null) {
                entry.setText(detailed.getText());
            }
            boolean hydrated = entry.getSourceUrls() != null && !entry.getSourceUrls().isEmpty();
            if (!hydrated) {
                logger.debug("KB entry {} still lacks source URLs after hydration", entry.getEntryId());
            }
            return hydrated;
        } catch (Exception e) {
            logger.warn("Failed to backfill KB entry {}: {}", entry.getEntryId(), e.getMessage());
            return false;
        }
    }

    /**
     * Public helper so higher layers (e.g., CPA controller) can hydrate entries on demand.
     */
    public boolean hydrateEntryDetails(com.capstone.civilify.DTO.KnowledgeBaseEntry entry) {
        return backfillEntryDetails(entry);
    }
    
    private void addUrlsFromObject(LinkedHashSet<String> collector, Object value) {
        if (value instanceof List<?>) {
            for (Object url : (List<?>) value) {
                addUrlIfValid(collector, url);
            }
        } else {
            addUrlIfValid(collector, value);
        }
    }
    
    private void addUrlIfValid(LinkedHashSet<String> collector, Object urlObj) {
        if (urlObj instanceof String) {
            String url = ((String) urlObj).trim();
            if (!url.isEmpty() && url.startsWith("http")) {
                collector.add(url);
            }
        }
    }

    private String asString(Object value) {
        return value instanceof String ? ((String) value).trim() : null;
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
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
    
    /**
     * Enhanced chat with knowledge base using KB-first approach
     * This method implements the Villy RAG pattern: KB-first, then AI enhancement
     */
    public KnowledgeBaseChatResponse chatWithKnowledgeBaseEnhanced(String question, String mode) {
        long startTime = System.currentTimeMillis();
        
        if (!knowledgeBaseEnabled) {
            logger.warn("Knowledge base is disabled");
            return new KnowledgeBaseChatResponse(null, null, "Knowledge base is currently disabled");
        }
        
        if (question == null || question.trim().length() < knowledgeBaseMinQueryLength) {
            logger.warn("Query too short: {}", question);
            return new KnowledgeBaseChatResponse(null, null, "Query too short for meaningful search");
        }
        try {
            if (performanceLogging) {
                logger.info("Enhanced KB chat request for mode: {}, question: {}", mode, question);
            }
            
            // Step 1: Get primary KB response using chat endpoint
            long chatStartTime = System.currentTimeMillis();
            KnowledgeBaseChatResponse kbResponse = chatWithKnowledgeBase(question);
            long chatDuration = System.currentTimeMillis() - chatStartTime;
            
            if (performanceLogging) {
                logger.info("KB chat completed in {}ms", chatDuration);
            }
            
            if (kbResponse.hasError()) {
                logger.warn("KB chat failed: {}", kbResponse.getError());
                return kbResponse;
            }
            
            // Step 2: For GLI mode, skip additional search to improve response speed
            // The chat endpoint already returns relevant sources, so we don't need a second search
            List<KnowledgeBaseEntry> allSources = new ArrayList<>();
            if (kbResponse.getSources() != null) {
                allSources.addAll(kbResponse.getSources());
            }
            
            // Only do additional search for CPA mode if needed
            if (!"A".equals(mode) && allSources.size() < 2) {
                long searchStartTime = System.currentTimeMillis();
                List<KnowledgeBaseEntry> additionalSources = searchKnowledgeBase(question, maxResults);
                long searchDuration = System.currentTimeMillis() - searchStartTime;
                
                if (performanceLogging) {
                    logger.info("KB search completed in {}ms, found {} sources", searchDuration, additionalSources.size());
                }
                
                if (additionalSources != null) {
                    allSources.addAll(additionalSources);
                }
            }
            
            // Remove duplicates based on entryId
            Map<String, KnowledgeBaseEntry> uniqueSources = new LinkedHashMap<>();
            for (KnowledgeBaseEntry entry : allSources) {
                if (entry.getEntryId() != null) {
                    uniqueSources.put(entry.getEntryId(), entry);
                }
            }
            
            List<KnowledgeBaseEntry> finalSources = new ArrayList<>(uniqueSources.values());
            
            long totalDuration = System.currentTimeMillis() - startTime;
            
            if (performanceLogging) {
                logger.info("Enhanced KB response completed in {}ms: answer length={}, sources count={}", 
                    totalDuration,
                    kbResponse.getAnswer() != null ? kbResponse.getAnswer().length() : 0, 
                    finalSources.size());
            }
            
            return new KnowledgeBaseChatResponse(kbResponse.getAnswer(), finalSources);
            
        } catch (Exception e) {
            long totalDuration = System.currentTimeMillis() - startTime;
            logger.error("Enhanced KB chat failed after {}ms", totalDuration, e);
            return new KnowledgeBaseChatResponse(null, null, "Enhanced knowledge base chat failed: " + e.getMessage());
        }
    }
    
    /**
     * Generate structured query for better legal search
     * This implements the SQG (Structured Query Generation) pattern from Villy RAG
     */
    public Map<String, Object> generateStructuredQuery(String userQuery) {
        if (!sqgEnabled) {
            return Map.of("normalized_question", userQuery, "keywords", List.of(userQuery.split("\\s+")));
        }
        
        // Skip SQG for simple queries if enabled
        if (simpleQuerySkipSqg && isSimpleQuery(userQuery)) {
            logger.debug("Skipping SQG for simple query: {}", userQuery);
            return Map.of(
                "normalized_question", userQuery,
                "keywords", extractKeywords(userQuery),
                "legal_topics", extractLegalTopics(userQuery),
                "statutes_referenced", extractStatuteReferences(userQuery)
            );
        }
        
        try {
            logger.info("Generating structured query for: {}", userQuery);
            
            // Call Villy's SQG endpoint if available
            String sqgUrl = knowledgeBaseApiUrl + "/api/sqg";
            Map<String, Object> requestBody = Map.of("question", userQuery);
            
            HttpHeaders headers = buildAuthHeaders();
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                sqgUrl, HttpMethod.POST, requestEntity, new ParameterizedTypeReference<Map<String, Object>>() {});
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> sqgResult = response.getBody();
                logger.info("SQG generated successfully: {}", sqgResult.keySet());
                return sqgResult;
            }
            
        } catch (Exception e) {
            logger.warn("SQG failed, using fallback: {}", e.getMessage());
        }
        
        // Fallback: Simple keyword extraction
        return Map.of(
            "normalized_question", userQuery,
            "keywords", extractKeywords(userQuery),
            "legal_topics", extractLegalTopics(userQuery),
            "statutes_referenced", extractStatuteReferences(userQuery)
        );
    }
    
    /**
     * Check if a query is simple enough to skip SQG processing
     */
    private boolean isSimpleQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return true;
        }
        
        String trimmed = query.trim().toLowerCase();
        
        // Simple queries: short length, basic question words, or direct statute references
        return trimmed.length() <= 20 || 
               trimmed.matches("^(what|how|when|where|why|who)\\s+.*") ||
               trimmed.matches(".*(rule|art|section|article)\\s+\\d+.*") ||
               trimmed.split("\\s+").length <= 5;
    }
    
    /**
     * Extract keywords from user query (fallback for SQG)
     */
    private List<String> extractKeywords(String query) {
        // Simple keyword extraction - remove common words and legal connectors
        String[] stopWords = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "what", "how", "when", "where", "why"};
        return Arrays.stream(query.toLowerCase().split("\\s+"))
            .filter(word -> word.length() > 2 && !Arrays.asList(stopWords).contains(word))
            .collect(Collectors.toList());
    }
    
    /**
     * Extract legal topics from user query (fallback for SQG)
     */
    private List<String> extractLegalTopics(String query) {
        List<String> topics = new ArrayList<>();
        String lowerQuery = query.toLowerCase();
        
        // Common Philippine legal topics
        if (lowerQuery.contains("criminal") || lowerQuery.contains("crime")) topics.add("criminal law");
        if (lowerQuery.contains("civil") || lowerQuery.contains("contract")) topics.add("civil law");
        if (lowerQuery.contains("family") || lowerQuery.contains("marriage")) topics.add("family law");
        if (lowerQuery.contains("labor") || lowerQuery.contains("employment")) topics.add("labor law");
        if (lowerQuery.contains("property") || lowerQuery.contains("real estate")) topics.add("property law");
        if (lowerQuery.contains("procedure") || lowerQuery.contains("court")) topics.add("procedural law");
        if (lowerQuery.contains("constitutional") || lowerQuery.contains("constitution")) topics.add("constitutional law");
        if (lowerQuery.contains("administrative")) topics.add("administrative law");
        
        return topics;
    }
    
    /**
     * Extract statute references from user query (fallback for SQG)
     */
    private List<String> extractStatuteReferences(String query) {
        List<String> statutes = new ArrayList<>();
        
        // Pattern for Rules of Court (Rule X Sec. Y)
        java.util.regex.Pattern rulePattern = java.util.regex.Pattern.compile("(?i)rule\\s+(\\d+)\\s*sec(?:tion)?\\s*(\\d+)");
        java.util.regex.Matcher ruleMatcher = rulePattern.matcher(query);
        while (ruleMatcher.find()) {
            statutes.add("Rule " + ruleMatcher.group(1) + " Sec. " + ruleMatcher.group(2));
        }
        
        // Pattern for RPC Articles (Art. X)
        java.util.regex.Pattern artPattern = java.util.regex.Pattern.compile("(?i)(?:art(?:icle)?|rpc)\\s*(\\d+)");
        java.util.regex.Matcher artMatcher = artPattern.matcher(query);
        while (artMatcher.find()) {
            statutes.add("RPC Art. " + artMatcher.group(1));
        }
        
        // Pattern for Republic Acts (RA X)
        java.util.regex.Pattern raPattern = java.util.regex.Pattern.compile("(?i)ra\\s+(\\d+)");
        java.util.regex.Matcher raMatcher = raPattern.matcher(query);
        while (raMatcher.find()) {
            statutes.add("RA " + raMatcher.group(1));
        }
        
        return statutes;
    }
    
}
