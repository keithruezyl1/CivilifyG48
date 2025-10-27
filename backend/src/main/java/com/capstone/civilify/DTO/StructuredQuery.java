package com.capstone.civilify.dto;

import java.util.List;

/**
 * Structured Query Generation result for enhanced query preprocessing.
 * Based on Villy's SQG implementation for Philippine law context.
 */
public record StructuredQuery(
    String normalizedQuestion,      // Cleaned, legally-precise restatement
    List<String> keywords,          // Extracted terms for matching
    List<String> legalTopics,       // ["criminal law", "bail", "procedural law"]
    List<String> statutesReferenced, // ["Rule 114 Sec. 1", "RPC Art. 308"]
    String jurisdiction,            // "Philippines"
    String temporalScope,           // "weekend", "business hours", etc.
    List<String> relatedTerms,     // Synonyms and related concepts
    String urgency,                 // "low", "medium", "high"
    List<String> queryExpansions    // LLM-generated expansion terms
) {
    
    /**
     * Compact canonical constructor with validation
     */
    public StructuredQuery {
        if (normalizedQuestion == null) normalizedQuestion = "";
        if (keywords == null) keywords = List.of();
        if (legalTopics == null) legalTopics = List.of();
        if (statutesReferenced == null) statutesReferenced = List.of();
        if (jurisdiction == null) jurisdiction = "Philippines";
        if (temporalScope == null) temporalScope = "";
        if (relatedTerms == null) relatedTerms = List.of();
        if (urgency == null) urgency = "low";
        if (queryExpansions == null) queryExpansions = List.of();
    }
    
    public boolean hasStatuteReferences() {
        return statutesReferenced != null && !statutesReferenced.isEmpty();
    }
    
    public boolean isHighUrgency() {
        return "high".equalsIgnoreCase(urgency);
    }
    
    public boolean isProceduralQuery() {
        return legalTopics.stream()
            .anyMatch(topic -> topic.toLowerCase().contains("procedural") || 
                             topic.toLowerCase().contains("process"));
    }
    
    public boolean isCriminalLawQuery() {
        return legalTopics.stream()
            .anyMatch(topic -> topic.toLowerCase().contains("criminal"));
    }
}
