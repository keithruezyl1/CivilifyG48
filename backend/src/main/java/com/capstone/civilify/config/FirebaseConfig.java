package com.capstone.civilify.config;

import java.io.IOException;
import java.io.InputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ClassPathResource;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

@Configuration
public class FirebaseConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);
    
    @Value("${firebase.database.url}")
    private String databaseUrl;
    
    @Value("${firebase.project.id}")
    private String projectId;
    
    @Value("${firebase.service-account}")
    private String serviceAccountPath;
    
    @Value("${firebase.api-key}")
    private String apiKey;
    
    // Make API key available for other components
    @Bean
    public String firebaseApiKey() {
        return apiKey;
    }
    
    @Bean
    @Primary
    public FirebaseApp firebaseApp() throws IOException {
        try {
            // Remove 'classpath:' prefix if present
            String resourcePath = serviceAccountPath.replace("classpath:", "");
            InputStream serviceAccount = new ClassPathResource(resourcePath).getInputStream();
            
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setDatabaseUrl(databaseUrl)
                .setProjectId(projectId)
                .build();

            // Check if Firebase is already initialized
            if (FirebaseApp.getApps().isEmpty()) {
                logger.info("Initializing Firebase application with project ID: {}", projectId);
                return FirebaseApp.initializeApp(options);
            } else {
                logger.info("Firebase application already initialized");
                return FirebaseApp.getInstance();
            }
            
        } catch (IOException e) {
            logger.error("Failed to initialize Firebase: {}", e.getMessage());
            throw new IllegalStateException("Failed to initialize Firebase - check your service account file", e);
        }
    }
}