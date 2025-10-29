package com.capstone.civilify.model;

import java.util.Date;

public class ChatMessage {
    private String id;
    private String userId;
    private String userEmail;
    private String content;
    private boolean isUserMessage;
    private Date timestamp;
    private String conversationId;
    private String messageType; // TEXT | FACTS | REPORT
    private java.util.Map<String, Object> extractedFacts;
    private Double confidence;

    // Default constructor for Firestore
    public ChatMessage() {}

    // Constructor with all fields
    public ChatMessage(String id, String userId, String userEmail, String content, boolean isUserMessage, Date timestamp, String conversationId) {
        this.id = id;
        this.userId = userId;
        this.userEmail = userEmail;
        this.content = content;
        this.isUserMessage = isUserMessage;
        this.timestamp = timestamp;
        this.conversationId = conversationId;
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public boolean isUserMessage() {
        return isUserMessage;
    }

    public void setUserMessage(boolean userMessage) {
        isUserMessage = userMessage;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getMessageType() {
        return messageType;
    }

    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }

    public java.util.Map<String, Object> getExtractedFacts() {
        return extractedFacts;
    }

    public void setExtractedFacts(java.util.Map<String, Object> extractedFacts) {
        this.extractedFacts = extractedFacts;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
}
