package com.capstone.civilify.service;

// Fix unused import
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

/**
 * Service class for interacting with Firestore.
 */
@Service
public class FirestoreService {

    private static final Logger logger = LoggerFactory.getLogger(FirestoreService.class);
    
    // Use Firestore from the Firebase Admin SDK
    private final Firestore db;
    private final boolean mockMode;
    
    // Constructor with Firebase dependency to ensure correct initialization order
    public FirestoreService(FirebaseApp firebaseApp) {
        Firestore tempDb = null;
        boolean tempMockMode = false; // Temporary variable
        
        try {
            tempDb = FirestoreClient.getFirestore(firebaseApp);
            logger.info("Successfully connected to Firestore");
            // Set mockMode to false
            tempMockMode = false;
            logger.info("Firestore Service running in REAL mode (mockMode=false)");
        } catch (Exception e) {
            logger.error("Failed to connect to Firestore: {}", e.getMessage());
            // Set mockMode to false even on connection error
            tempMockMode = false;
            logger.info("Firestore Service running in REAL mode (mockMode=false)");
            
            // Rethrow the exception to fail fast if we can't connect to Firestore
            throw new RuntimeException("Failed to connect to Firestore. Application cannot run without database connection.", e);
        }
        
        this.db = tempDb;
        this.mockMode = tempMockMode; // Assign to final field once
    }

    // Method to store profile information in Firestore
    @SuppressWarnings("CallToPrintStackTrace")
    public void addUserProfile(String uid, String email, String username, String profilePictureUrl) {
        addUserProfile(uid, email, username, profilePictureUrl, "ROLE_USER");
    }
    
    // Method to store profile information in Firestore with role
    @SuppressWarnings("CallToPrintStackTrace")
    public void addUserProfile(String uid, String email, String username, String profilePictureUrl, String role) {
        if (mockMode) {
            logger.info("Mock mode: Not storing user profile for uid {}", uid);
            return;
        }
        
        Map<String, Object> userProfile = new HashMap<>();
        userProfile.put("email", email);
        userProfile.put("username", username);
        userProfile.put("profile_picture_url", profilePictureUrl);
        userProfile.put("role", role);
    
        DocumentReference userRef = db.collection("users").document(uid);
        ApiFuture<WriteResult> future = userRef.set(userProfile);
    
        try {
            future.get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to store user profile", e);
        }
    }

        /**
     * Retrieves a user's data from Firestore by email
     * 
     * @param email The email address of the user
     * @return A Map containing the user's profile data
     * @throws ExecutionException If the Firestore operation fails
     * @throws InterruptedException If the operation is interrupted
     */
    public Map<String, Object> getUserByEmail(String email) throws ExecutionException, InterruptedException {
        if (mockMode) {
            logger.info("Mock mode: Returning mock user data for email {}", email);
            // Return mock user data
            Map<String, Object> mockUser = new HashMap<>();
            mockUser.put("email", email);
            mockUser.put("username", "Mock User");
            mockUser.put("profile_picture_url", "https://example.com/mock-profile.jpg");
            mockUser.put("uid", "mock-uid-" + email.hashCode());
            return mockUser;
        }
        
        try {
            // Query Firestore for users with matching email
            ApiFuture<QuerySnapshot> query = db.collection("users")
                    .whereEqualTo("email", email)
                    .limit(1)
                    .get();
            
            // Get documents from the query result
            List<QueryDocumentSnapshot> documents = query.get().getDocuments();
            
            if (!documents.isEmpty()) {
                // Return the first matching user's data
                return documents.get(0).getData();
            } else {
                // No user found with the given email
                logger.warn("No user found with email: {}", email);
                // Return empty map instead of throwing exception
                return new HashMap<>();
            }
        } catch (Exception e) {
            logger.error("Error getting user by email: {}", e.getMessage());
            // Return empty map instead of throwing exception
            return new HashMap<>();
        }
    }
    
    /**
     * Retrieves a user's profile from Firestore by UID
     * 
     * @param uid The unique identifier of the user
     * @return A Map containing the user's profile data
     */
    public Map<String, Object> getUserProfile(String uid) {
        if (mockMode) {
            logger.info("Mock mode: Returning mock user data for uid {}", uid);
            // Return mock user data
            Map<String, Object> mockUser = new HashMap<>();
            mockUser.put("email", "user@example.com");
            mockUser.put("username", "Mock User");
            mockUser.put("profile_picture_url", "https://randomuser.me/api/portraits/men/32.jpg");
            mockUser.put("uid", uid);
            return mockUser;
        }
        
        try {
            // Get the user document directly by UID
            DocumentReference docRef = db.collection("users").document(uid);
            ApiFuture<com.google.cloud.firestore.DocumentSnapshot> future = docRef.get();
            com.google.cloud.firestore.DocumentSnapshot document = future.get();
            
            if (document.exists()) {
                Map<String, Object> userData = document.getData();
                if (userData != null) {
                    // Add the UID to the data
                    userData.put("uid", uid);
                    return userData;
                } else {
                    logger.warn("Document exists but data is null for UID: {}", uid);
                    return new HashMap<>();
                }
            } else {
                logger.warn("No user found with UID: {}", uid);
                return new HashMap<>();
            }
        } catch (Exception e) {
            logger.error("Error fetching user profile for UID {}: {}", uid, e.getMessage());
            return new HashMap<>();
        }
    }
    
    /**
     * Updates a user's profile in Firestore based on email
     * 
     * @param email The email address of the user to update
     * @param profileData Map containing the profile data to update
     * @return A Map containing the updated user profile data
     * @throws ExecutionException If the Firestore operation fails
     * @throws InterruptedException If the operation is interrupted
     */
    public Map<String, Object> updateUserProfile(String email, Map<String, Object> profileData) throws ExecutionException, InterruptedException {
        if (mockMode) {
            logger.info("Mock mode: Not updating user profile for email {}", email);
            
            // Return mock updated user data
            Map<String, Object> mockUser = new HashMap<>();
            mockUser.put("email", email);
            mockUser.putAll(profileData); // Add the profile data to mock response
            mockUser.put("uid", "mock-uid-" + email.hashCode());
            return mockUser;
        }
        
        try {
            // First, find the user document by email
            ApiFuture<QuerySnapshot> query = db.collection("users")
                    .whereEqualTo("email", email)
                    .limit(1)
                    .get();
            
            List<QueryDocumentSnapshot> documents = query.get().getDocuments();
            
            if (documents.isEmpty()) {
                logger.warn("No user found with email: {}", email);
                throw new RuntimeException("User not found");
            }
            
            // Get the first matching document
            QueryDocumentSnapshot document = documents.get(0);
            String uid = document.getId();
            
            // Update the user document
            DocumentReference userRef = db.collection("users").document(uid);
            
            // Remove sensitive information from profileData to prevent security issues
            profileData.remove("email");
            // Ensure password is never stored in Firestore
            profileData.remove("password");
            
            // Update the document
            ApiFuture<WriteResult> writeResult = userRef.update(profileData);
            writeResult.get(); // Wait for the update to complete
            
            // Fetch the updated document
            ApiFuture<com.google.cloud.firestore.DocumentSnapshot> updatedDocFuture = userRef.get();
            com.google.cloud.firestore.DocumentSnapshot updatedDoc = updatedDocFuture.get();
            
            if (updatedDoc.exists()) {
                Map<String, Object> updatedData = updatedDoc.getData();
                if (updatedData != null) {
                    // Add the UID to the data
                    updatedData.put("uid", uid);
                    return updatedData;
                }
            }
            
            throw new RuntimeException("Failed to retrieve updated user profile");
        } catch (Exception e) {
            logger.error("Error updating user profile for email {}: {}", email, e.getMessage());
            throw e;
        }
    }
}