package com.capstone.civilify.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;


@Service
public class FirestoreService {

    // Use Firestore from the Firebase Admin SDK
    private final Firestore db;
    
    // Constructor with Firebase dependency to ensure correct initialization order
    public FirestoreService(FirebaseApp firebaseApp) {
        this.db = FirestoreClient.getFirestore();
    }

    // Method to store profile information in Firestore
    @SuppressWarnings("CallToPrintStackTrace")
    public void addUserProfile(String uid, String email, String username, String profilePictureUrl) {
        Map<String, Object> userProfile = new HashMap<>();
        userProfile.put("email", email);
        userProfile.put("username", username);
        userProfile.put("profile_picture_url", profilePictureUrl);
    
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
            throw new IllegalArgumentException("No user found with email: " + email);
        }
    }
}