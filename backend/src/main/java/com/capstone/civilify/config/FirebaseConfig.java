/*
package com.capstone.civilify.config;

import com.google.auth.oauth2.GoogleCredentials;
//import com.google.firebase.FirebaseApp;
//import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import jakarta.annotation.PostConstruct;
import java.io.IOException;

@Configuration
public class FirebaseConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);
    
    @Value("${app.firebase.database-url:https://civilify-default-rtdb.firebaseio.com}")
    private String databaseUrl;
    
    @Value("${app.firebase.configuration-file:firebase-service-account.json}")
    private String configPath;
    
    @Value("${app.firebase.enabled:false}")
    private boolean firebaseEnabled;

    @PostConstruct
    public void initialize() {
        if (!firebaseEnabled) {
            logger.info("Firebase integration is disabled.");
            return;
        }

        try {
            Resource resource = new ClassPathResource(configPath);
            
            if (!resource.exists()) {
                logger.warn("Firebase configuration file not found: {}. Firebase integration will be disabled.", configPath);
                return;
            }
            
            GoogleCredentials credentials = GoogleCredentials.fromStream(resource.getInputStream());
            
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .setDatabaseUrl(databaseUrl)
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                logger.info("Firebase has been successfully initialized");
            }
        } catch (IOException e) {
            logger.error("Firebase initialization failed: {}", e.getMessage());
        }
    }
}
*/