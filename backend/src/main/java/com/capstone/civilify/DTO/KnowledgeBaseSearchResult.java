package com.capstone.civilify.dto;

import java.util.List;

/**
 * Data Transfer Object for knowledge base search results.
 * Contains the search results and metadata.
 */
public class KnowledgeBaseSearchResult {
    
    private List<KnowledgeBaseEntry> entries;
    private int totalResults;
    private String query;
    private boolean success;
    private String error;
    
    // Constructors
    public KnowledgeBaseSearchResult() {}
    
    public KnowledgeBaseSearchResult(List<KnowledgeBaseEntry> entries, String query) {
        this.entries = entries;
        this.totalResults = entries != null ? entries.size() : 0;
        this.query = query;
        this.success = true;
    }
    
    public KnowledgeBaseSearchResult(String query, String error) {
        this.query = query;
        this.error = error;
        this.success = false;
        this.entries = null;
        this.totalResults = 0;
    }
    
    // Getters and Setters
    public List<KnowledgeBaseEntry> getEntries() {
        return entries;
    }
    
    public void setEntries(List<KnowledgeBaseEntry> entries) {
        this.entries = entries;
        this.totalResults = entries != null ? entries.size() : 0;
    }
    
    public int getTotalResults() {
        return totalResults;
    }
    
    public void setTotalResults(int totalResults) {
        this.totalResults = totalResults;
    }
    
    public String getQuery() {
        return query;
    }
    
    public void setQuery(String query) {
        this.query = query;
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
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
    
    public boolean hasResults() {
        return entries != null && !entries.isEmpty();
    }
    
    @Override
    public String toString() {
        return "KnowledgeBaseSearchResult{" +
                "totalResults=" + totalResults +
                ", query='" + query + '\'' +
                ", success=" + success +
                ", error='" + error + '\'' +
                '}';
    }
}

