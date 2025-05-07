package com.capstone.civilify.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.CreateRequest;

public class FirebaseAuthService {

    // Method to create a new user using email and password
    public static String createUser(String email, String password) {
        try {
            // Create a new user with email and password
            CreateRequest request = new CreateRequest()
                .setEmail(email)
                .setPassword(password);

            UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);

            // Return the UID of the created user
            return userRecord.getUid();
        } catch (FirebaseAuthException e) {
            return null;
        }
    }
}