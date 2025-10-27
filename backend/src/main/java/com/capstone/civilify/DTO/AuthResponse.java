package com.capstone.civilify.DTO;

import java.util.Date;

public class AuthResponse {
    private String token;
    private Object user;
    private Date expiresAt;
    private String refreshToken;
    private boolean isAuthenticated;
    
    public AuthResponse() {}
    
    public AuthResponse(String token) {
        this.token = token;
        this.isAuthenticated = token != null && !token.isEmpty();
    }
    
    public AuthResponse(String token, Object user) {
        this.token = token;
        this.user = user;
        this.isAuthenticated = token != null && !token.isEmpty();
    }
    
    public AuthResponse(String token, Object user, Date expiresAt, String refreshToken) {
        this.token = token;
        this.user = user;
        this.expiresAt = expiresAt;
        this.refreshToken = refreshToken;
        this.isAuthenticated = token != null && !token.isEmpty();
    }
    
    // Getters and setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
        this.isAuthenticated = token != null && !token.isEmpty();
    }
    
    public Object getUser() {
        return user;
    }
    
    public void setUser(Object user) {
        this.user = user;
    }
    
    public Date getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(Date expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public String getRefreshToken() {
        return refreshToken;
    }
    
    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
    
    public boolean isAuthenticated() {
        return isAuthenticated;
    }
    
    public void setAuthenticated(boolean isAuthenticated) {
        this.isAuthenticated = isAuthenticated;
    }
}