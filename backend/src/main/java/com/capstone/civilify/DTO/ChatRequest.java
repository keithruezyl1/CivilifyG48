package com.capstone.civilify.DTO;

/**
 * Data Transfer Object for chat requests.
 * Used for knowledge base chat interactions.
 */
public class ChatRequest {
    
    private String question;
    private String conversationId;
    private String userId;
    
    // Constructors
    public ChatRequest() {}
    
    public ChatRequest(String question) {
        this.question = question;
    }
    
    public ChatRequest(String question, String conversationId, String userId) {
        this.question = question;
        this.conversationId = conversationId;
        this.userId = userId;
    }
    
    // Getters and Setters
    public String getQuestion() {
        return question;
    }
    
    public void setQuestion(String question) {
        this.question = question;
    }
    
    public String getConversationId() {
        return conversationId;
    }
    
    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
}

