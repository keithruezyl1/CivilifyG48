package com.capstone.civilify.controller;

import com.capstone.civilify.model.ChatConversation;
import com.capstone.civilify.model.ChatMessage;
import com.capstone.civilify.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private ChatService chatService;

    // Create a new conversation
    @PostMapping("/conversations")
    public ResponseEntity<?> createConversation(@RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String userEmail = request.get("userEmail");
            String title = request.get("title");

            if (userEmail == null || userEmail.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("User email is required"));
            }

            ChatConversation conversation = chatService.createConversation(
                userId, userEmail, title
            );

            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            logger.error("Error creating conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error creating conversation: " + e.getMessage()));
        }
    }

    // Get all conversations for a user
    @GetMapping("/conversations/user/{email}")
    public ResponseEntity<?> getUserConversations(@PathVariable String email) {
        try {
            List<ChatConversation> conversations = chatService.getUserConversations(email);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            logger.error("Error getting user conversations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error getting user conversations: " + e.getMessage()));
        }
    }

    // Get a specific conversation
    @GetMapping("/conversations/{id}")
    public ResponseEntity<?> getConversation(@PathVariable String id) {
        try {
            ChatConversation conversation = chatService.getConversation(id);
            if (conversation == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            logger.error("Error getting conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error getting conversation: " + e.getMessage()));
        }
    }

    // Update conversation details
    @PutMapping("/conversations/{id}")
    public ResponseEntity<?> updateConversation(@PathVariable String id, @RequestBody ChatConversation conversation) {
        try {
            if (!id.equals(conversation.getId())) {
                return ResponseEntity.badRequest().body(createErrorResponse("ID in path must match ID in body"));
            }

            ChatConversation updated = chatService.updateConversation(conversation);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Error updating conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error updating conversation: " + e.getMessage()));
        }
    }

    // Add a message to a conversation
    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<?> addMessage(@PathVariable String id, @RequestBody Map<String, Object> request) {
        try {
            String userId = (String) request.get("userId");
            String userEmail = (String) request.get("userEmail");
            String content = (String) request.get("content");
            Boolean isUserMessage = (Boolean) request.get("isUserMessage");

            if (content == null || content.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Message content is required"));
            }

            if (isUserMessage == null) {
                isUserMessage = true; // Default to user message if not specified
            }

            ChatMessage message = chatService.addMessage(
                id, userId, userEmail, content, isUserMessage
            );

            return ResponseEntity.ok(message);
        } catch (Exception e) {
            logger.error("Error adding message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error adding message: " + e.getMessage()));
        }
    }

    // Get all messages for a conversation
    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<?> getConversationMessages(@PathVariable String id) {
        try {
            List<ChatMessage> messages = chatService.getConversationMessages(id);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            logger.error("Error getting conversation messages", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error getting conversation messages: " + e.getMessage()));
        }
    }

    // Assign an admin to a conversation
    @PutMapping("/conversations/{id}/assign")
    public ResponseEntity<?> assignAdmin(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String adminId = request.get("adminId");
            if (adminId == null || adminId.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Admin ID is required"));
            }

            ChatConversation conversation = chatService.assignAdmin(id, adminId);
            if (conversation == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            logger.error("Error assigning admin", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error assigning admin: " + e.getMessage()));
        }
    }

    // Update conversation status
    @PutMapping("/conversations/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            if (status == null || status.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Status is required"));
            }

            ChatConversation conversation = chatService.updateStatus(id, status);
            if (conversation == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            logger.error("Error updating status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error updating status: " + e.getMessage()));
        }
    }

    // Get all conversations for an admin
    @GetMapping("/conversations/admin/{id}")
    public ResponseEntity<?> getAdminConversations(@PathVariable String id) {
        try {
            List<ChatConversation> conversations = chatService.getAdminConversations(id);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            logger.error("Error getting admin conversations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error getting admin conversations: " + e.getMessage()));
        }
    }

    // Get conversations by status
    @GetMapping("/conversations/status/{status}")
    public ResponseEntity<?> getConversationsByStatus(@PathVariable String status) {
        try {
            List<ChatConversation> conversations = chatService.getConversationsByStatus(status);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            logger.error("Error getting conversations by status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error getting conversations by status: " + e.getMessage()));
        }
    }

    // Helper method to create error response
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("error", message);
        return response;
    }
}
