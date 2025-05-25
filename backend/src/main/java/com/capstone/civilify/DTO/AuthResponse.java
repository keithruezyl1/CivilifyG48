package com.capstone.civilify.dto;

public class AuthResponse {
    private String token;
    private Object user;
    
    public AuthResponse() {}
    
    public AuthResponse(String token) {
        this.token = token;
    }
    
    public AuthResponse(String token, Object user) {
        this.token = token;
        this.user = user;
    }
    
    // Getters and setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public Object getUser() {
        return user;
    }
    
    public void setUser(Object user) {
        this.user = user;
    }
}