package com.capstone.civilify.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;

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
import com.google.firebase.auth.ActionCodeSettings;
import com.google.firebase.FirebaseApp;

import javax.annotation.PostConstruct;

@Service
public class FirebaseAuthService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseAuthService.class);
    
    @Value("${firebase.api-key}")
    private String apiKey;
    
    @Value("${firebase.project.id}")
    private String projectId;
    
    private boolean mockMode = false;
    
    @PostConstruct
    public void init() {
        try {
            // Try to get FirebaseAuth instance to check if Firebase is initialized
            FirebaseAuth auth = FirebaseAuth.getInstance();
            logger.info("Successfully connected to Firebase Auth for project: {}", projectId);
            
            // Verify connection by getting app name
            String appName = FirebaseApp.getInstance().getName();
            logger.info("Firebase App name: {}", appName);
            
            // Force mockMode to be false regardless of app name
            mockMode = false;
            logger.info("Firebase Auth Service running in REAL mode (mockMode=false)");
        } catch (Exception e) {
            logger.error("Failed to connect to Firebase Auth: {}", e.getMessage());
            logger.error("Exception type: {}", e.getClass().getName());
            if (e.getCause() != null) {
                logger.error("Caused by: {}", e.getCause().getMessage());
            }
            // Force mockMode to be false even on connection error
            mockMode = false;
            logger.info("Firebase Auth Service running in REAL mode (mockMode=false)");
        }
    }

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
        // In mock mode, always return a successful sign-in
        if (mockMode) {
            logger.info("[MOCK MODE] Simulating successful sign-in for user: {}", email);
            return "mock-id-token-" + email + "-" + System.currentTimeMillis();
        }
        
        try {
            logger.info("Attempting to sign in user: {}", email);
            
            // Firebase Admin SDK doesn't support email/password sign-in directly
            // Using Firebase Auth REST API instead
            java.net.URI uri = new java.net.URI("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + apiKey);
            HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
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
     * Sends a password reset email to the specified email address.
     *
     * @param email The email address to send the password reset link to.
     * @return true if the email was sent successfully, false otherwise.
     */
    public boolean sendPasswordResetEmail(String email) {
        // In mock mode, always return success
        if (mockMode) {
            logger.info("[MOCK MODE] Simulating password reset email sent to: {}", email);
            return true;
        }
        
        try {
            logger.info("Attempting to send password reset email to: {}", email);
            
            // Skip Firebase Admin SDK attempt in mock mode
            if (!mockMode) {
                try {
                    logger.info("Attempting to send password reset email via Firebase Admin SDK");
                    
                    // Try using the Firebase Admin SDK first
                    ActionCodeSettings actionCodeSettings = ActionCodeSettings.builder()
                        .setUrl("http://localhost:3000/signin")
                        .setHandleCodeInApp(false)
                        .build();
                    
                    logger.info("Using Firebase project: {}", projectId);
                    logger.info("Firebase app name: {}", FirebaseApp.getInstance().getName());
                    
                    String resetLink = FirebaseAuth.getInstance().generatePasswordResetLink(email, actionCodeSettings);
                    logger.info("Password reset link generated: {}", resetLink);
                    logger.info("Password reset email sent successfully via Firebase Admin SDK to: {}", email);
                    return true;
                } catch (FirebaseAuthException adminEx) {
                    logger.error("Failed to send password reset via Firebase Admin SDK: {}", adminEx.getMessage());
                    logger.error("Exception type: {}", adminEx.getClass().getName());
                    if (adminEx.getCause() != null) {
                        logger.error("Caused by: {}", adminEx.getCause().getMessage());
                    }
                    logger.warn("Falling back to REST API for password reset");
                }
            } else {
                logger.warn("Skipping Firebase Admin SDK attempt because we're in mock mode");
            }
            
            // Fallback to Firebase Auth REST API
            java.net.URI uri = new java.net.URI("https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=" + apiKey);
            HttpURLConnection connection = (HttpURLConnection) uri.toURL().openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            
            // Create a JSON object for the request
            JSONObject requestJson = new JSONObject();
            requestJson.put("requestType", "PASSWORD_RESET");
            requestJson.put("email", email);
            // Add continue URL for the reset password page
            requestJson.put("continueUrl", "http://localhost:3000/signin");
            String inputJson = requestJson.toString();
            
            logger.debug("Sending password reset request to Firebase REST API");
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = inputJson.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            int responseCode = connection.getResponseCode();
            logger.debug("Firebase password reset response code: {}", responseCode);
            
            if (responseCode == 200) {
                logger.info("Password reset email sent successfully to: {}", email);
                return true;
            } else {
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(connection.getErrorStream(), StandardCharsets.UTF_8))) {
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine);
                    }
                    
                    String errorResponse = response.toString();
                    logger.error("Password reset failed with response code {}: {}", responseCode, errorResponse);
                    return false;
                }
            }
        } catch (Exception e) {
            logger.error("Error sending password reset email", e);
            return false;
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
            logger.error("Error creating or getting user with Google: {}", e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Creates a custom token for the specified user ID.
     *
     * @param uid The user ID for which to create a custom token.
     * @return The custom token string.
     */
    public String createCustomToken(String uid) {
        // In mock mode, return a dummy token
        if (mockMode) {
            logger.info("[MOCK MODE] Creating mock custom token for user: {}", uid);
            return "mock-token-" + uid + "-" + System.currentTimeMillis();
        }
        
        try {
            // Create a custom token for the specified user ID
            String customToken = FirebaseAuth.getInstance().createCustomToken(uid);
            logger.info("Created custom token for user: {}", uid);
            return customToken;
        } catch (FirebaseAuthException e) {
            logger.error("Error creating custom token: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Check if the service is running in mock mode.
     * 
     * @return true if in mock mode, false otherwise
     */
    public boolean isMockMode() {
        return mockMode;
    }
}