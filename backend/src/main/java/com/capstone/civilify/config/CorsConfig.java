package com.capstone.civilify.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Allow all endpoints
                .allowedOrigins(
                    "http://localhost:3000", 
                    "http://127.0.0.1:3000",
                    "http://localhost:5173", 
                    "http://127.0.0.1:5173",
                    "http://localhost:8080", 
                    "http://127.0.0.1:8080",
                    "https://civilify-a9de6.firebaseio.com",
                    "https://civilify-a9de6.firebaseapp.com",
                    "https://civilify-a9de6.web.app"
                ) // All possible origins
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Allowed HTTP methods
                .allowedHeaders("*") // Allow all headers
                .allowCredentials(true); // Allow cookies and credentials
    }
}