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
    public FirebaseApp firebaseApp() {
        try {
            // Remove 'classpath:' prefix if present
            String resourcePath = serviceAccountPath.replace("classpath:", "");
            
            logger.info("Attempting to load Firebase service account from: {}", resourcePath);
            
            InputStream serviceAccount = null;
            
            // First, try to load from filesystem (for Docker deployments)
            java.io.File file = new java.io.File(resourcePath);
            if (file.exists() && file.isFile()) {
                logger.info("Loading Firebase service account from filesystem: {}", resourcePath);
                serviceAccount = new java.io.FileInputStream(file);
            } else {
                // Fallback to classpath resource
                ClassPathResource resource = new ClassPathResource(resourcePath);
                if (resource.exists()) {
                    logger.info("Loading Firebase service account from classpath: {}", resourcePath);
                    serviceAccount = resource.getInputStream();
                } else {
                    logger.error("Service account file not found in filesystem or classpath: {}", resourcePath);
                    throw new IOException("Service account file not found: " + resourcePath);
                }
            }
            
            logger.info("Service account file found successfully");
            
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
            
        } catch (Exception e) {
            // Log the error and throw an exception - no more mock mode
            logger.error("Failed to initialize Firebase: {}", e.getMessage());
            logger.error("Exception type: {}", e.getClass().getName());
            if (e.getCause() != null) {
                logger.error("Caused by: {}", e.getCause().getMessage());
            }
            
            // Throw exception to fail application startup
            throw new RuntimeException("Failed to initialize Firebase. Application cannot start without proper Firebase configuration.", e);
        }
    }
}