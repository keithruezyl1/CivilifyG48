package com.capstone.civilify.entity;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "cloudinary")
public class CloudinaryProperties {
    
    private String cloudName;
    private String apiKey;
    private String apiSecret;
    private String uploadPreset;
    
    // Getters and setters
    public String getCloudName() {
        return cloudName;
    }
    
    public void setCloudName(String cloudName) {
        this.cloudName = cloudName;
    }
    
    public String getApiKey() {
        return apiKey;
    }
    
    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }
    
    public String getApiSecret() {
        return apiSecret;
    }
    
    public void setApiSecret(String apiSecret) {
        this.apiSecret = apiSecret;
    }
    
    public String getUploadPreset() {
        return uploadPreset;
    }
    
    public void setUploadPreset(String uploadPreset) {
        this.uploadPreset = uploadPreset;
    }
}