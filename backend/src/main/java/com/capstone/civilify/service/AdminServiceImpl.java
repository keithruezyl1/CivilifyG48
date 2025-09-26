package com.capstone.civilify.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.capstone.civilify.DTO.UserDTO;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.cloud.FirestoreClient;

/**
 * Implementation of the AdminService interface.
 */
@Service
public class AdminServiceImpl implements AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminServiceImpl.class);
    
    @Autowired
    private FirebaseAuthService firebaseAuthService;
    
    /**
     * {@inheritDoc}
     */
    @Override
    public List<UserDTO> getAllUsers() throws ExecutionException, InterruptedException {
        logger.info("Retrieving all users");
        
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection("users").get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<UserDTO> users = new ArrayList<>();
        
        for (QueryDocumentSnapshot document : documents) {
            String userId = document.getId();
            Map<String, Object> data = document.getData();
            
            // Extract user data
            String email = (String) data.get("email");
            String username = (String) data.get("username");
            String profilePictureUrl = (String) data.get("profile_picture_url");
            String role = (String) data.getOrDefault("role", "ROLE_USER"); // Default to ROLE_USER if not set
            
            // Create UserDTO object
            UserDTO userDTO = new UserDTO(userId, email, username, profilePictureUrl, role);
            users.add(userDTO);
        }
        
        logger.info("Retrieved {} users", users.size());
        return users;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public UserDTO updateUserRole(String userId, String role) throws ExecutionException, InterruptedException {
        logger.info("Updating role for user {}: {}", userId, role);
        
        // Validate role
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("Role cannot be null or blank");
        }
        
        // Verify role is valid (only ROLE_USER or ROLE_ADMIN are allowed)
        if (!"ROLE_USER".equals(role) && !"ROLE_ADMIN".equals(role)) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
        
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection("users").document(userId);
        
        // Check if user exists
        DocumentSnapshot snapshot = docRef.get().get();
        if (!snapshot.exists()) {
            throw new IllegalArgumentException("User with ID " + userId + " not found");
        }
        
        // Update role
        Map<String, Object> updates = new HashMap<>();
        updates.put("role", role);
        
        ApiFuture<WriteResult> updateFuture = docRef.update(updates);
        updateFuture.get(); // Wait for update to complete
        
        // Get updated user data
        DocumentSnapshot updatedSnapshot = docRef.get().get();
        Map<String, Object> data = updatedSnapshot.getData();
        
        if (data == null) {
            throw new IllegalArgumentException("User data not found after update");
        }
        
        // Extract user data
        String email = (String) data.get("email");
        String username = (String) data.get("username");
        String profilePictureUrl = (String) data.get("profile_picture_url");
        String updatedRole = (String) data.get("role");
        
        logger.info("Role updated successfully for user {}", userId);
        return new UserDTO(userId, email, username, profilePictureUrl, updatedRole);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean deleteUser(String userId) throws ExecutionException, InterruptedException {
        logger.info("Deleting user {}", userId);
        
        try {
            // Delete from Firestore first
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference docRef = db.collection("users").document(userId);
            
            // Check if user exists
            DocumentSnapshot snapshot = docRef.get().get();
            if (!snapshot.exists()) {
                logger.warn("User with ID {} not found", userId);
                return false;
            }
            
            // Delete user from Firebase Auth
            try {
                firebaseAuthService.deleteUser(userId);
            } catch (FirebaseAuthException e) {
                logger.error("Error deleting user from Firebase Auth: {}", e.getMessage());
                throw new RuntimeException("Failed to delete user from authentication system: " + e.getMessage(), e);
            }
            
            // Delete user from Firestore
            ApiFuture<WriteResult> future = docRef.delete();
            future.get(); // Wait for deletion to complete
            
            logger.info("User {} deleted successfully", userId);
            return true;
        } catch (Exception e) {
            logger.error("Error deleting user {}: {}", userId, e.getMessage());
            throw e;
        }
    }
    
    /**
     * {@inheritDoc}
     */
    @Override
    public UserDTO updateUserRoleByEmail(String email, String role) throws ExecutionException, InterruptedException {
        logger.info("Updating role for user with email {}: {}", email, role);
        
        // Validate role
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("Role cannot be null or blank");
        }
        
        // Verify role is valid (only ROLE_USER or ROLE_ADMIN are allowed)
        if (!"ROLE_USER".equals(role) && !"ROLE_ADMIN".equals(role)) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
        
        // Get Firestore instance
        Firestore db = FirestoreClient.getFirestore();
        
        // Find user by email
        ApiFuture<QuerySnapshot> query = db.collection("users")
                .whereEqualTo("email", email)
                .limit(1)
                .get();
        
        List<QueryDocumentSnapshot> documents = query.get().getDocuments();
        
        if (documents.isEmpty()) {
            throw new IllegalArgumentException("User with email " + email + " not found");
        }
        
        // Get the user document
        QueryDocumentSnapshot userDoc = documents.get(0);
        String userId = userDoc.getId();
        
        // Update the role using the existing method
        return updateUserRole(userId, role);
    }
}
