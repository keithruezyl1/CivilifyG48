package com.capstone.civilify.service;

import com.capstone.civilify.model.ChatConversation;
import com.capstone.civilify.model.ChatMessage;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);
    private static final String CONVERSATIONS_COLLECTION = "conversations";

    // Create a new conversation
    public ChatConversation createConversation(String userId, String userEmail, String title) 
                                              throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Create a new conversation document
        DocumentReference docRef = db.collection(CONVERSATIONS_COLLECTION).document();
        String conversationId = docRef.getId();
        
        Date now = new Date();
        ChatConversation conversation = new ChatConversation(
            conversationId,
            userId,
            userEmail,
            title,
            now,
            now,
            "pending" // Initial status
        );
        
        // Save to Firestore
        ApiFuture<WriteResult> result = docRef.set(conversation);
        result.get(); // Wait for operation to complete
        
        logger.info("Created new conversation with ID: {}", conversationId);
        return conversation;
    }
    
    // Get all conversations for a user
    public List<ChatConversation> getUserConversations(String userEmail) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Query conversations by user email
        Query query = db.collection(CONVERSATIONS_COLLECTION)
                        .whereEqualTo("userEmail", userEmail)
                        .orderBy("updatedAt", Query.Direction.DESCENDING);
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        return documents.stream()
                .map(doc -> doc.toObject(ChatConversation.class))
                .collect(Collectors.toList());
    }
    
    // Get a specific conversation by ID
    public ChatConversation getConversation(String conversationId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        DocumentReference docRef = db.collection(CONVERSATIONS_COLLECTION).document(conversationId);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        
        if (document.exists()) {
            return document.toObject(ChatConversation.class);
        } else {
            return null;
        }
    }
    
    // Update conversation details
    public ChatConversation updateConversation(ChatConversation conversation) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Update the updatedAt timestamp
        conversation.setUpdatedAt(new Date());
        
        DocumentReference docRef = db.collection(CONVERSATIONS_COLLECTION).document(conversation.getId());
        ApiFuture<WriteResult> result = docRef.set(conversation);
        result.get(); // Wait for operation to complete
        
        logger.info("Updated conversation with ID: {}", conversation.getId());
        return conversation;
    }
    
    // Add a message to a conversation
    public ChatMessage addMessage(String conversationId, String userId, String userEmail, 
                                 String content, boolean isUserMessage) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Create a new message document as a subcollection of the conversation
        DocumentReference docRef = db.collection(CONVERSATIONS_COLLECTION)
                                     .document(conversationId)
                                     .collection("messages")
                                     .document();
        String messageId = docRef.getId();
        
        Date now = new Date();
        ChatMessage message = new ChatMessage(
            messageId,
            userId,
            userEmail,
            content,
            isUserMessage,
            now,
            conversationId
        );
        message.setMessageType("TEXT");
        
        // Save to Firestore
        ApiFuture<WriteResult> result = docRef.set(message);
        result.get(); // Wait for operation to complete
        
        // Update the conversation's updatedAt timestamp
        DocumentReference convRef = db.collection(CONVERSATIONS_COLLECTION).document(conversationId);
        ApiFuture<DocumentSnapshot> convFuture = convRef.get();
        DocumentSnapshot convDoc = convFuture.get();
        
        if (convDoc.exists()) {
            Map<String, Object> updates = new HashMap<>();
            updates.put("updatedAt", now);
            
            // If this is the first message, use it to set the title
            if (isUserMessage) {
                ChatConversation conversation = convDoc.toObject(ChatConversation.class);
                if (conversation != null && (conversation.getTitle() == null || conversation.getTitle().isEmpty())) {
                    // Use the first 50 characters of the first message as the title
                    String title = content.length() > 50 ? content.substring(0, 50) + "..." : content;
                    updates.put("title", title);
                }
            }
            
            convRef.update(updates);
        }
        
        logger.info("Added message with ID: {} to conversation: {}", messageId, conversationId);
        return message;
    }

    // Add a structured FACTS message to a conversation (idempotent by provenance messageId at call site)
    public ChatMessage addFactsMessage(String conversationId, java.util.Map<String, Object> factsMap, Double confidence)
            throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();

        DocumentReference docRef = db.collection(CONVERSATIONS_COLLECTION)
                                     .document(conversationId)
                                     .collection("messages")
                                     .document();
        String messageId = docRef.getId();

        Date now = new Date();
        ChatMessage message = new ChatMessage(
            messageId,
            null,
            "villy@civilify.com",
            null,
            false,
            now,
            conversationId
        );
        message.setMessageType("FACTS");
        message.setExtractedFacts(factsMap);
        message.setConfidence(confidence);

        ApiFuture<WriteResult> result = docRef.set(message);
        result.get();

        DocumentReference convRef = db.collection(CONVERSATIONS_COLLECTION).document(conversationId);
        convRef.update("updatedAt", now);

        logger.info("Added FACTS message {} to conversation {}", messageId, conversationId);
        return message;
    }

    public void updateCompletenessScore(String conversationId, Double score) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference convRef = db.collection(CONVERSATIONS_COLLECTION).document(conversationId);
        Map<String, Object> updates = new HashMap<>();
        updates.put("completenessScore", score);
        updates.put("updatedAt", new Date());
        convRef.update(updates).get();
        logger.info("Updated completenessScore for conversation {} to {}", conversationId, score);
    }

    public ChatMessage addReportMessage(String conversationId, String content) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();

        DocumentReference docRef = db.collection(CONVERSATIONS_COLLECTION)
                                     .document(conversationId)
                                     .collection("messages")
                                     .document();
        String messageId = docRef.getId();

        Date now = new Date();
        ChatMessage message = new ChatMessage(
            messageId,
            null,
            "villy@civilify.com",
            content,
            false,
            now,
            conversationId
        );
        message.setMessageType("REPORT");

        ApiFuture<WriteResult> result = docRef.set(message);
        result.get();

        DocumentReference convRef = db.collection(CONVERSATIONS_COLLECTION).document(conversationId);
        Map<String, Object> updates = new HashMap<>();
        updates.put("updatedAt", now);
        updates.put("reportStatus", "SENT");
        convRef.update(updates).get();

        logger.info("Added REPORT message {} to conversation {}", messageId, conversationId);
        return message;
    }

    public void updateReportStatus(String conversationId, String status) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference convRef = db.collection(CONVERSATIONS_COLLECTION).document(conversationId);
        Map<String, Object> updates = new HashMap<>();
        updates.put("reportStatus", status);
        updates.put("updatedAt", new Date());
        convRef.update(updates).get();
        logger.info("Updated reportStatus for conversation {} to {}", conversationId, status);
    }
    
    // Get all messages for a conversation
    public List<ChatMessage> getConversationMessages(String conversationId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Query messages from the subcollection of the conversation
        Query query = db.collection(CONVERSATIONS_COLLECTION)
                        .document(conversationId)
                        .collection("messages")
                        .orderBy("timestamp", Query.Direction.ASCENDING);
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        return documents.stream()
                .map(doc -> doc.toObject(ChatMessage.class))
                .collect(Collectors.toList());
    }
    
    // Assign an admin to a conversation
    public ChatConversation assignAdmin(String conversationId, String adminId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        DocumentReference docRef = db.collection(CONVERSATIONS_COLLECTION).document(conversationId);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        
        if (document.exists()) {
            ChatConversation conversation = document.toObject(ChatConversation.class);
            if (conversation != null) {
                conversation.setStatus("in-progress");
                conversation.setUpdatedAt(new Date());
                
                ApiFuture<WriteResult> result = docRef.set(conversation);
                result.get(); // Wait for operation to complete
                
                logger.info("Assigned admin {} to conversation {}", adminId, conversationId);
                return conversation;
            }
        }
        
        return null;
    }
    
    // Update conversation status
    public ChatConversation updateStatus(String conversationId, String status) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        DocumentReference docRef = db.collection(CONVERSATIONS_COLLECTION).document(conversationId);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        
        if (document.exists()) {
            ChatConversation conversation = document.toObject(ChatConversation.class);
            if (conversation != null) {
                conversation.setStatus(status);
                conversation.setUpdatedAt(new Date());
                
                ApiFuture<WriteResult> result = docRef.set(conversation);
                result.get(); // Wait for operation to complete
                
                logger.info("Updated status of conversation {} to {}", conversationId, status);
                return conversation;
            }
        }
        
        return null;
    }
    
    
    // Get conversations by location
    public List<ChatConversation> getConversationsByLocation(String location) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Query conversations by location
        Query query = db.collection(CONVERSATIONS_COLLECTION)
                        .whereEqualTo("location", location)
                        .orderBy("updatedAt", Query.Direction.DESCENDING);
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        return documents.stream()
                .map(doc -> doc.toObject(ChatConversation.class))
                .collect(Collectors.toList());
    }
    
    // Get conversations by category
    public List<ChatConversation> getConversationsByCategory(String category) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Query conversations by category
        Query query = db.collection(CONVERSATIONS_COLLECTION)
                        .whereEqualTo("category", category)
                        .orderBy("updatedAt", Query.Direction.DESCENDING);
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        return documents.stream()
                .map(doc -> doc.toObject(ChatConversation.class))
                .collect(Collectors.toList());
    }
    
    // Get conversations by status
    public List<ChatConversation> getConversationsByStatus(String status) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Query conversations by status
        Query query = db.collection(CONVERSATIONS_COLLECTION)
                        .whereEqualTo("status", status)
                        .orderBy("updatedAt", Query.Direction.DESCENDING);
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        return documents.stream()
                .map(doc -> doc.toObject(ChatConversation.class))
                .collect(Collectors.toList());
    }
    
    // Delete a conversation and all its messages
    public boolean deleteConversation(String conversationId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // First check if the conversation exists
        DocumentReference convRef = db.collection(CONVERSATIONS_COLLECTION).document(conversationId);
        ApiFuture<DocumentSnapshot> convFuture = convRef.get();
        DocumentSnapshot convDoc = convFuture.get();
        
        if (!convDoc.exists()) {
            logger.warn("Conversation not found for deletion: {}", conversationId);
            return false;
        }
        
        // Delete all messages in the conversation
        CollectionReference messagesRef = convRef.collection("messages");
        ApiFuture<QuerySnapshot> messagesFuture = messagesRef.get();
        List<QueryDocumentSnapshot> messages = messagesFuture.get().getDocuments();
        
        // Batch delete for better performance
        WriteBatch batch = db.batch();
        
        for (QueryDocumentSnapshot message : messages) {
            batch.delete(message.getReference());
        }
        
        // Delete the conversation document itself
        batch.delete(convRef);
        
        // Commit the batch
        ApiFuture<List<WriteResult>> result = batch.commit();
        result.get(); // Wait for operation to complete
        
        logger.info("Deleted conversation {} with {} messages", conversationId, messages.size());
        return true;
    }
    
    // Check if a user has any conversations
    public boolean userHasConversations(String userEmail) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Query conversations by user email with a limit of 1 (just to check existence)
        Query query = db.collection(CONVERSATIONS_COLLECTION)
                        .whereEqualTo("userEmail", userEmail)
                        .limit(1);
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        // Return true if at least one conversation exists
        return !documents.isEmpty();
    }
    
    // Delete all previous conversations for a user by email
    public int deleteAllUserConversations(String userEmail) throws ExecutionException, InterruptedException {
        return deleteAllUserConversationsExcept(userEmail, null);
    }

    // Delete all previous conversations for a user by email, except one
    public int deleteAllUserConversationsExcept(String userEmail, String excludeConversationId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        // Query all conversations for the user
        Query query = db.collection(CONVERSATIONS_COLLECTION)
                       .whereEqualTo("userEmail", userEmail);
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        int deletedCount = 0;
        for (QueryDocumentSnapshot document : documents) {
            String conversationId = document.getId();
            if (excludeConversationId != null && conversationId.equals(excludeConversationId)) {
                continue; // skip the current conversation
            }
            if (deleteConversation(conversationId)) {
                deletedCount++;
            }
        }
        logger.info("Deleted {} conversations for user: {} (excluding {})", deletedCount, userEmail, excludeConversationId);
        return deletedCount;
    }
}
