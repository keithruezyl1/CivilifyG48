package com.capstone.civilify.DTO;

/**
 * Data Transfer Object for search requests.
 * Used for knowledge base search operations.
 */
public class SearchRequest {
    
    private String query;
    private int limit;
    
    // Constructors
    public SearchRequest() {
        this.limit = 10; // Default limit
    }
    
    public SearchRequest(String query) {
        this.query = query;
        this.limit = 10; // Default limit
    }
    
    public SearchRequest(String query, int limit) {
        this.query = query;
        this.limit = limit;
    }
    
    // Getters and Setters
    public String getQuery() {
        return query;
    }
    
    public void setQuery(String query) {
        this.query = query;
    }
    
    public int getLimit() {
        return limit;
    }
    
    public void setLimit(int limit) {
        this.limit = limit;
    }
}

