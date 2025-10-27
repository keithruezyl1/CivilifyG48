package com.capstone.civilify.dto;

import java.util.List;

/**
 * Enhanced RAG response DTO with comprehensive metadata from Villy KB integration.
 * Follows SOLID principles with clear separation of concerns.
 */
public record EnhancedRAGResponse(
    String answer,
    List<KnowledgeBaseEntry> sources,
    RAGMetadata metadata,
    String error
) {
    
    /**
     * Compact canonical constructor with validation
     */
    public EnhancedRAGResponse {
        if (answer == null) answer = "";
        if (sources == null) sources = List.of();
        if (metadata == null) metadata = new RAGMetadata(0.0, false, false, false, "", List.of());
        if (error == null) error = "";
    }
    
    public boolean hasError() {
        return error != null && !error.trim().isEmpty();
    }
    
    public boolean hasSources() {
        return sources != null && !sources.isEmpty();
    }
    
    public boolean isHighConfidence() {
        return metadata != null && metadata.confidence() >= 0.7;
    }
    
    public boolean isKBFirst() {
        return metadata != null && metadata.kbFirst();
    }
}
