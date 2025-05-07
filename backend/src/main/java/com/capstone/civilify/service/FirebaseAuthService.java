package com.capstone.civilify.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.CreateRequest;

@Service
public class FirebaseAuthService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseAuthService.class);
    
    @Value("${firebase.api-key}")
    private String apiKey;

    /**
     * Creates a new user in Firebase Authentication.
     *
     * @param email    The user's email address.
     * @param password The user's password.
     * @return The UID of the newly created user.
     */
    public String createUser(String email, String password) {
        try {
            // Build the user creation request
            UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                    .setEmail(email)
                    .setPassword(password);

            // Create the user in Firebase Authentication
            UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);

            // Log and return the UID of the created user
            logger.info("Successfully created new user: {}", userRecord.getUid());
            return userRecord.getUid();
        } catch (FirebaseAuthException e) {
            logger.error("Error creating user in Firebase Authentication", e);
            throw new RuntimeException("Failed to create user: " + e.getMessage(), e);
        }
    }
    
    /**
     * Authenticates a user with email and password.
     * 
     * @param email    The user's email address.
     * @param password The user's password.
     * @return Authentication token if successful.
     */
    public String signInWithEmailAndPassword(String email, String password) {
        try {
            logger.info("Attempting to sign in user: {}", email);
            
            // Firebase Admin SDK doesn't support email/password sign-in directly
            // Using Firebase Auth REST API instead
            URL url = new URL("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + apiKey);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            
            // Create a JSON object to avoid string formatting issues with special characters
            JSONObject requestJson = new JSONObject();
            requestJson.put("email", email);
            requestJson.put("password", password);
            requestJson.put("returnSecureToken", true);
            String inputJson = requestJson.toString();
            
            logger.debug("Sending authentication request to Firebase");
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = inputJson.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            int responseCode = conn.getResponseCode();
            logger.debug("Firebase authentication response code: {}", responseCode);
            
            if (responseCode == 200) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine);
                    }
                    
                    // Use JSONObject to properly parse the response
                    String jsonResponseStr = response.toString();
                    logger.debug("Received successful response from Firebase");
                    
                    JSONObject jsonResponse = new JSONObject(jsonResponseStr);
                    String idToken = jsonResponse.getString("idToken");
                    
                    logger.info("User successfully authenticated: {}", email);
                    return idToken;
                }
            } else {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine);
                    }
                    
                    String errorResponse = response.toString();
                    logger.error("Authentication failed with response code {}: {}", responseCode, errorResponse);
                    
                    // Try to parse the error message from the JSON response
                    try {
                        JSONObject errorJson = new JSONObject(errorResponse);
                        if (errorJson.has("error") && errorJson.getJSONObject("error").has("message")) {
                            String errorMessage = errorJson.getJSONObject("error").getString("message");
                            throw new RuntimeException("Authentication failed: " + errorMessage);
                        }
                    } catch (Exception e) {
                        // If we can't parse the error, just use the raw response
                        logger.warn("Could not parse error response: {}", e.getMessage());
                    }
                    
                    throw new RuntimeException("Authentication failed with status code: " + responseCode);
                }
            }
        } catch (IOException e) {
            logger.error("Network error during authentication", e);
            throw new RuntimeException("Authentication failed due to network error: " + e.getMessage(), e);
        } catch (RuntimeException e) {
            logger.error("Error during authentication", e);
            throw new RuntimeException("Authentication failed: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error during authentication", e);
            throw new RuntimeException("An unexpected error occurred during authentication: " + e.getMessage(), e);
        }
    }
    
    /**
     * Verifies a Google ID token and returns the user information.
     *
     * @param idToken The Google ID token to verify.
     * @return Map containing user information from the token, or null if invalid.
     */
    public Map<String, Object> verifyGoogleIdToken(String idToken) {
        try {
            // Create a verifier for the Google ID token
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList("433624047904-ea5ipm4k3ogi6fumrpjdu9c59hq1119l.apps.googleusercontent.com"))
                    .build();

            // Verify the token
            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                logger.error("Invalid Google ID token");
                return null;
            }

            // Get the payload from the token
            Payload payload = googleIdToken.getPayload();
            String userId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            logger.info("Google ID token verified for user: {}", email);

            // Create a map with the user information
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("userId", userId);
            userInfo.put("email", email);
            userInfo.put("name", name);
            userInfo.put("picture", pictureUrl);

            return userInfo;
        } catch (Exception e) {
            logger.error("Error verifying Google ID token", e);
            return null;
        }
    }

    /**
     * Creates or gets a Firebase user from Google authentication data.
     *
     * @param email      The user's email address.
     * @param name       The user's name.
     * @param pictureUrl The user's profile picture URL.
     * @return The UID of the user.
     */
    public String createOrGetUserWithGoogle(String email, String name, String pictureUrl) {
        try {
            // Try to get the user by email first
            try {
                UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(email);
                logger.info("Found existing user for Google auth: {}", email);
                return userRecord.getUid();
            } catch (FirebaseAuthException e) {
                // User doesn't exist, create a new one
                logger.info("Creating new user for Google auth: {}", email);
                
                // Build the user creation request
                CreateRequest request = new CreateRequest()
                        .setEmail(email)
                        .setDisplayName(name)
                        .setPhotoUrl(pictureUrl)
                        .setEmailVerified(true);

                // Create the user in Firebase Authentication
                UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
                logger.info("Successfully created new user from Google auth: {}", userRecord.getUid());
                return userRecord.getUid();
            }
        } catch (FirebaseAuthException e) {
            logger.error("Error creating/getting user with Google auth", e);
            throw new RuntimeException("Failed to create/get user: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a custom token for a user.
     *
     * @param email The user's email address.
     * @return A custom token for the user.
     */
    public String createCustomToken(String email) {
        try {
            // Get the user by email
            UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(email);
            
            // Create a custom token for the user
            String customToken = FirebaseAuth.getInstance().createCustomToken(userRecord.getUid());
            logger.info("Created custom token for user: {}", email);
            return customToken;
        } catch (FirebaseAuthException e) {
            logger.error("Error creating custom token", e);
            throw new RuntimeException("Failed to create custom token: " + e.getMessage(), e);
        }
    }
}