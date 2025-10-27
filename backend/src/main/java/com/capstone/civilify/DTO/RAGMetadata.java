package com.capstone.civilify.dto;

import java.util.List;

/**
 * RAG metadata containing confidence scores and retrieval information.
 * Immutable record following DDD principles.
 */
public record RAGMetadata(
    double confidence,           // Overall confidence score (0.0-1.0)
    boolean kbFirst,            // Whether KB was used as primary source
    boolean usedSQG,            // Whether Structured Query Generation was used
    boolean usedReranking,      // Whether cross-encoder reranking was applied
    String retrievalMethod,     // "vector", "lexical", "fast-path", "hybrid"
    List<String> legalTopics    // Detected legal topics from SQG
) {
    
    /**
     * Compact canonical constructor with validation
     */
    public RAGMetadata {
        if (confidence < 0.0) confidence = 0.0;
        if (confidence > 1.0) confidence = 1.0;
        if (retrievalMethod == null) retrievalMethod = "unknown";
        if (legalTopics == null) legalTopics = List.of();
    }
    
    public boolean isHighConfidence() {
        return confidence >= 0.7;
    }
    
    public boolean isMediumConfidence() {
        return confidence >= 0.4 && confidence < 0.7;
    }
    
    public boolean isLowConfidence() {
        return confidence < 0.4;
    }
}
