package com.capstone.civilify.controller;

import com.capstone.civilify.dto.KnowledgeBaseChatResponse;
import com.capstone.civilify.dto.KnowledgeBaseSearchResult;
import com.capstone.civilify.dto.KnowledgeBaseEntry;
import com.capstone.civilify.service.KnowledgeBaseService;
import com.capstone.civilify.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * Controller for knowledge base operations.
 * Provides RAG functionality and admin access to law-entry extension features.
 */
@RestController
@RequestMapping("/api/knowledge-base")
@CrossOrigin(origins = "*")
public class KnowledgeBaseController {
    
    private static final Logger logger = LoggerFactory.getLogger(KnowledgeBaseController.class);
    
    @Autowired
    private KnowledgeBaseService knowledgeBaseService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    /**
     * Chat with the knowledge base using RAG (Retrieval-Augmented Generation).
     * This endpoint provides the main chat functionality for Villy.
     */
    @PostMapping("/chat")
    public ResponseEntity<KnowledgeBaseChatResponse> chatWithKnowledgeBase(
            @RequestBody ChatRequest request,
            HttpServletRequest httpRequest) {
        try {
            String token = extractToken(httpRequest);
            if (token == null) {
                return ResponseEntity.status(401).body(
                    new KnowledgeBaseChatResponse(null, null, "Authentication required"));
            }
            
            String userId = jwtUtil.extractUserId(token);
            if (userId == null) {
                return ResponseEntity.status(401).body(
                    new KnowledgeBaseChatResponse(null, null, "Invalid token"));
            }
            
            logger.info("Knowledge base chat request from user: {}", userId);
            
            KnowledgeBaseChatResponse response = knowledgeBaseService.chatWithKnowledgeBase(
                request.getQuestion());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error in knowledge base chat", e);
            return ResponseEntity.status(500).body(
                new KnowledgeBaseChatResponse(null, null, "Internal server error"));
        }
    }
    
    /**
     * Search the knowledge base for relevant entries.
     * Used for semantic search and retrieval.
     */
    @PostMapping("/search")
    public ResponseEntity<KnowledgeBaseSearchResult> searchKnowledgeBase(
            @RequestBody SearchRequest request,
            HttpServletRequest httpRequest) {
        try {
            String token = extractToken(httpRequest);
            if (token == null) {
                return ResponseEntity.status(401).body(
                    new KnowledgeBaseSearchResult(request.getQuery(), "Authentication required"));
            }
            
            String userId = jwtUtil.extractUserId(token);
            if (userId == null) {
                return ResponseEntity.status(401).body(
                    new KnowledgeBaseSearchResult(request.getQuery(), "Invalid token"));
            }
            
            logger.info("Knowledge base search request from user: {}", userId);
            
            List<KnowledgeBaseEntry> entries = knowledgeBaseService.searchKnowledgeBase(
                request.getQuery(), request.getLimit());
            KnowledgeBaseSearchResult result = new KnowledgeBaseSearchResult(entries, request.getQuery());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("Error in knowledge base search", e);
            return ResponseEntity.status(500).body(
                new KnowledgeBaseSearchResult(request.getQuery(), "Internal server error"));
        }
    }
    
    /**
     * Get knowledge base entry by ID.
     * Used for retrieving specific entries.
     */
    @GetMapping("/entry/{entryId}")
    public ResponseEntity<KnowledgeBaseEntry> getKnowledgeBaseEntry(
            @PathVariable String entryId,
            HttpServletRequest httpRequest) {
        try {
            String token = extractToken(httpRequest);
            if (token == null) {
                return ResponseEntity.status(401).build();
            }
            
            String userId = jwtUtil.extractUserId(token);
            if (userId == null) {
                return ResponseEntity.status(401).build();
            }
            
            logger.info("Knowledge base entry request from user: {}", userId);
            
            KnowledgeBaseEntry entry = knowledgeBaseService.getKnowledgeBaseEntry(entryId);
            if (entry == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(entry);
            
        } catch (Exception e) {
            logger.error("Error retrieving knowledge base entry", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Knowledge base statistics for admin dashboard.
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> statistics(HttpServletRequest httpRequest) {
        try {
            String token = extractToken(httpRequest);
            if (token == null || jwtUtil.extractUserId(token) == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            // Minimal placeholder: count-only stats since external service owns full stats
            boolean kbUp = knowledgeBaseService.isHealthy();
            int sample = kbUp ? 1 : 0; // we don't have direct counts; keep placeholder fields stable for UI
            java.util.Map<String, Object> stats = new java.util.HashMap<>();
            stats.put("totalEntries", 0);
            stats.put("verifiedEntries", 0);
            stats.put("pendingEntries", 0);
            stats.put("recentActivity", sample);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    /**
     * Test RAG system (smoke test endpoint used by admin UI).
     */
    @PostMapping("/test")
    public ResponseEntity<?> testRag(@RequestBody SearchRequest request, HttpServletRequest httpRequest) {
        try {
            String token = extractToken(httpRequest);
            if (token == null || jwtUtil.extractUserId(token) == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            java.util.List<KnowledgeBaseEntry> entries = knowledgeBaseService.searchKnowledgeBase(
                request.getQuery() != null ? request.getQuery() : "Rule 114 Section 20",
                Math.max(1, request.getLimit())
            );
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("query", request.getQuery());
            result.put("results", entries);
            result.put("count", entries != null ? entries.size() : 0);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal server error");
        }
    }

    /**
     * Health check for knowledge base service.
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        try {
            boolean isHealthy = knowledgeBaseService.isHealthy();
            if (isHealthy) {
                return ResponseEntity.ok("Knowledge base service is healthy");
            } else {
                return ResponseEntity.status(503).body("Knowledge base service is unhealthy");
            }
        } catch (Exception e) {
            logger.error("Error in knowledge base health check", e);
            return ResponseEntity.status(503).body("Knowledge base service error");
        }
    }
    
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
    
    // Request DTOs
    public static class ChatRequest {
        private String question;
        private String mode = "GLI"; // Default to GLI mode
        
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public String getMode() { return mode; }
        public void setMode(String mode) { this.mode = mode; }
    }
    
    public static class SearchRequest {
        private String query;
        private int limit = 10;
        
        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
    }
}
