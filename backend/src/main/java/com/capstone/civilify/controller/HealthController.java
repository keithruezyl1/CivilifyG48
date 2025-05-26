package com.capstone.civilify.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for health check endpoints.
 * Used for monitoring system health and connectivity testing.
 */
@RestController
public class HealthController {

    /**
     * Simple health check endpoint that returns a 200 OK response.
     * This is useful for connectivity testing between frontend and backend.
     *
     * @return A response entity with a success message
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Service is healthy and running");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }

    /**
     * CORS test endpoint specifically for debugging CORS issues.
     * Returns headers that can help diagnose CORS configuration problems.
     *
     * @return A response entity with CORS debugging information
     */
    @GetMapping("/api/cors-test")
    public ResponseEntity<?> corsTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("cors", "If you can see this message, CORS is configured correctly");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
}
