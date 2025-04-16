package com.capstone.civilify.service;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.capstone.civilify.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Logger;
import java.util.logging.Level;

@Service
public class UserService {

    private static final Logger logger = Logger.getLogger(UserService.class.getName());
    private DatabaseReference databaseReference;
    private boolean firebaseEnabled;
    
    // In-memory store for development/fallback when Firebase is unavailable
    private final Map<String, User> userStore = new HashMap<>();

    public UserService(@Value("${app.firebase.enabled:false}") boolean firebaseEnabled) {
        this.firebaseEnabled = firebaseEnabled;
        
        if (firebaseEnabled) {
            try {
                this.databaseReference = FirebaseDatabase.getInstance().getReference("users");
                logger.info("Firebase Database reference initialized successfully");
            } catch (Exception e) {
                logger.log(Level.WARNING, "Failed to initialize Firebase Database reference. Using in-memory store instead.", e);
                this.firebaseEnabled = false;
            }
        } else {
            logger.info("Firebase is disabled. Using in-memory store for user data.");
        }
    }

    public CompletableFuture<Void> saveUser(User user) {
        return CompletableFuture.runAsync(() -> {
            try {
                String normalizedEmail = normalizeEmail(user.getEmail());
                
                // Store in memory regardless of Firebase state for fallback
                userStore.put(normalizedEmail, user);
                
                if (firebaseEnabled && databaseReference != null) {
                    // If Firebase is available, also save there
                    databaseReference.child(normalizedEmail).setValueAsync(user);
                }
                
                logger.info("User saved successfully: " + user.getEmail());
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error saving user: " + user.getEmail(), e);
                throw new RuntimeException("Error saving user", e);
            }
        });
    }

    public CompletableFuture<User> getUserByEmail(String email) {
        CompletableFuture<User> future = new CompletableFuture<>();
        String normalizedEmail = normalizeEmail(email);
        
        // Always check the in-memory store first
        User inMemoryUser = userStore.get(normalizedEmail);
        
        if (!firebaseEnabled || databaseReference == null) {
            // If Firebase is disabled, just return from memory
            logger.info("Fetching user from in-memory store: " + email);
            future.complete(inMemoryUser);
            return future;
        }
        
        try {
            logger.info("Fetching user by email from Firebase: " + email);
            databaseReference.child(normalizedEmail)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot dataSnapshot) {
                        User user = dataSnapshot.getValue(User.class);
                        
                        if (user != null) {
                            // Update in-memory store with Firebase data
                            userStore.put(normalizedEmail, user);
                            future.complete(user);
                        } else {
                            // If not in Firebase but in memory, return from memory
                            future.complete(inMemoryUser);
                        }
                        
                        logger.info("User fetch completed for: " + email);
                    }

                    @Override
                    public void onCancelled(DatabaseError databaseError) {
                        logger.log(Level.WARNING, "Error fetching user from Firebase: " + email + 
                                ". Falling back to in-memory store.", databaseError.toException());
                        
                        // Fall back to in-memory data
                        future.complete(inMemoryUser);
                    }
                });
        } catch (Exception e) {
            logger.log(Level.WARNING, "Error setting up Firebase user fetch: " + email + 
                    ". Falling back to in-memory store.", e);
            
            // Fall back to in-memory data
            future.complete(inMemoryUser);
        }
        
        return future;
    }
    
    // Helper method to normalize email for storage
    private String normalizeEmail(String email) {
        return email.replace(".", ",");
    }
}