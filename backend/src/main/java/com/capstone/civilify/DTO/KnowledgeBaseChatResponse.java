package com.capstone.civilify.DTO;

import java.util.List;

/**
 * Data Transfer Object for knowledge base chat responses.
 * Contains the AI-generated answer and source references.
 */
public class KnowledgeBaseChatResponse {
    
    private String answer;
    private List<KnowledgeBaseEntry> sources;
    private String error;
    
    // Constructors
    public KnowledgeBaseChatResponse() {}
    
    public KnowledgeBaseChatResponse(String answer, List<KnowledgeBaseEntry> sources) {
        this.answer = answer;
        this.sources = sources;
    }
    
    public KnowledgeBaseChatResponse(String answer, List<KnowledgeBaseEntry> sources, String error) {
        this.answer = answer;
        this.sources = sources;
        this.error = error;
    }
    
    // Getters and Setters
    public String getAnswer() {
        return answer;
    }
    
    public void setAnswer(String answer) {
        this.answer = answer;
    }
    
    public List<KnowledgeBaseEntry> getSources() {
        return sources;
    }
    
    public void setSources(List<KnowledgeBaseEntry> sources) {
        this.sources = sources;
    }
    
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
    
    public boolean hasError() {
        return error != null && !error.trim().isEmpty();
    }
    
    public boolean hasSources() {
        return sources != null && !sources.isEmpty();
    }
    
    @Override
    public String toString() {
        return "KnowledgeBaseChatResponse{" +
                "answer='" + answer + '\'' +
                ", sourcesCount=" + (sources != null ? sources.size() : 0) +
                ", error='" + error + '\'' +
                '}';
    }
}

