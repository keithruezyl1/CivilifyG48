package com.capstone.civilify.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import com.capstone.civilify.DTO.AuthResponse;
import com.capstone.civilify.DTO.ErrorResponse;
import com.capstone.civilify.DTO.LoginRequest;
import com.capstone.civilify.service.FirebaseAuthService;
import com.capstone.civilify.service.FirestoreService;
import com.capstone.civilify.util.JwtUtil;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    private final FirebaseAuthService firebaseAuthService;
    private final FirestoreService firestoreService;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthController(FirebaseAuthService firebaseAuthService, FirestoreService firestoreService, JwtUtil jwtUtil) {
        this.firebaseAuthService = firebaseAuthService;
        this.firestoreService = firestoreService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        logger.info("Login attempt for email: {}", loginRequest.getEmail());
        
        if (loginRequest.getEmail() == null || loginRequest.getPassword() == null) {
            logger.error("Login failed: Email or password is null");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Email and password are required"));
        }
        
        try {
            // Authenticate with Firebase
            logger.info("Authenticating with Firebase...");
            logger.debug("Password length: {}", loginRequest.getPassword().length());
            
            // Authenticate with Firebase and log the token (shortened for security)
            String firebaseToken;
            try {
                firebaseToken = firebaseAuthService.signInWithEmailAndPassword(
                    loginRequest.getEmail(), 
                    loginRequest.getPassword()
                );
            } catch (RuntimeException authEx) {
                logger.error("Authentication failed: {}", authEx.getMessage());
                
                // Check for common authentication errors
                String errorMessage = authEx.getMessage();
                if (errorMessage.contains("INVALID_PASSWORD")) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication failed: Incorrect password"));
                } else if (errorMessage.contains("EMAIL_NOT_FOUND")) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication failed: Email not found"));
                } else if (errorMessage.contains("USER_DISABLED")) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication failed: Account has been disabled"));
                } else if (errorMessage.contains("TOO_MANY_ATTEMPTS_TRY_LATER")) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication failed: Too many attempts. Please try again later"));
                } else {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Authentication failed: " + errorMessage));
                }
            }
            
            // Log that we received a token (but don't log the actual token for security)
            if (firebaseToken != null && !firebaseToken.isEmpty()) {
                logger.info("Firebase authentication successful, token received (length: {})", firebaseToken.length());
            } else {
                logger.warn("Firebase authentication returned null or empty token");
            }
            
            // Get user details from Firestore
            logger.info("Fetching user details from Firestore...");
            Map<String, Object> userDetails = firestoreService.getUserByEmail(loginRequest.getEmail());
            
            if (userDetails == null || userDetails.isEmpty()) {
                logger.warn("No user details found in Firestore for email: {}", loginRequest.getEmail());
                userDetails = new HashMap<>();
                userDetails.put("email", loginRequest.getEmail());
            } else {
                logger.info("User details retrieved successfully: {}", userDetails.keySet());
            }
            
            // Generate JWT token
            logger.info("Generating JWT token...");
            String jwtToken = jwtUtil.generateToken(loginRequest.getEmail());
            
            // Get token expiration date
            Date expiresAt = jwtUtil.getTokenExpirationDate();
            
            // Remove password from user details for security
            if (userDetails.containsKey("password")) {
                userDetails.remove("password");
                logger.info("Password removed from user details for security");
            }
            
            // Create response with JWT token, user details, and expiration date
            logger.info("Login successful for user: {}", loginRequest.getEmail());
            return ResponseEntity.ok(new AuthResponse(jwtToken, userDetails, expiresAt, null));
        } catch (Exception e) {
            logger.error("Authentication failed: {}", e.getMessage(), e);
            // Create a safe error message that doesn't expose internal details
            String userFacingMessage = "Authentication failed. Please try again later.";
            
            // For specific known exceptions, provide more helpful messages
            if (e.getMessage() != null) {
                if (e.getMessage().contains("network") || e.getMessage().contains("connection")) {
                    userFacingMessage = "Unable to connect to authentication service. Please try again later.";
                }
            }
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", userFacingMessage));
        }
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        logger.info("Processing forgot password request for email: {}", email);
        
        try {
            // First check if the email exists in our database
            logger.info("Checking if email exists in database: {}", email);
            Map<String, Object> userDetails = firestoreService.getUserByEmail(email);
            
            // Check if the user exists - email should be present in the returned data
            if (userDetails == null || userDetails.isEmpty() || !userDetails.containsKey("email")) {
                logger.warn("Email not found in database: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", "Email address not found in our system"));
            }
            
            // Email exists, proceed with password reset
            logger.info("Email found in database, proceeding with password reset: {}", email);
            
            // Get the Firebase API key from application.properties
            String apiKey = "AIzaSyD2ZLktr7HvwqWizK_e6f4KF3A_2jB6leg";
            
            // Create the URL for Firebase password reset API
            String url = "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=" + apiKey;
            
            // Create the request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("requestType", "PASSWORD_RESET");
            requestBody.put("email", email);
            requestBody.put("continueUrl", "http://localhost:3000/signin");
            
            // Create the HTTP headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create the HTTP entity
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // Make the request to Firebase
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<?> response = restTemplate.postForEntity(url, entity, Map.class);
            
            logger.info("Firebase password reset response: {}", response.getBody());
            
            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Password reset email sent successfully to: {}", email);
                return ResponseEntity.ok(Map.of("success", true, "message", "Password reset email sent successfully"));
            } else {
                logger.error("Failed to send password reset email to: {}", email);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("success", false, "message", "Failed to send password reset email"));
            }
        } catch (Exception e) {
            logger.error("Error processing forgot password request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "An error occurred while processing your request"));
        }
    }
    
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Test endpoint is working");
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/google")
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody Map<String, String> request) {
        try {
            // Get the Google ID token from the request
            String idToken = request.get("token");
            if (idToken == null) {
                return ResponseEntity.badRequest().body(new ErrorResponse("No token provided"));
            }
            
            // Verify the Google ID token
            Map<String, Object> tokenData = firebaseAuthService.verifyGoogleIdToken(idToken);
            if (tokenData == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid Google token"));
            }
            
            // Extract user information from the token
            String email = (String) tokenData.get("email");
            String name = (String) tokenData.get("name");
            String pictureUrl = (String) tokenData.get("picture");
            
            // Create or get the user in Firebase
            String uid = firebaseAuthService.createOrGetUserWithGoogle(email, name, pictureUrl);
            
            // Create a custom token for the user (Firebase token)
            firebaseAuthService.createCustomToken(uid);
            
            // Generate JWT token for our application
            String jwtToken = jwtUtil.generateToken(email);
            
            // Get token expiration date
            Date expiresAt = jwtUtil.getTokenExpirationDate();
            
            // Get or create user profile in Firestore
            Map<String, Object> userProfile = firestoreService.getUserByEmail(email);
            if (userProfile == null || userProfile.isEmpty()) {
                // Create a new user profile
                Map<String, Object> newUserProfile = new HashMap<>();
                newUserProfile.put("email", email);
                newUserProfile.put("username", name);
                newUserProfile.put("profile_picture_url", pictureUrl);
                
                // Store in Firestore
                firestoreService.addUserProfile(uid, email, name, pictureUrl);
                
                userProfile = newUserProfile;
            }
            
            // Remove password from user profile for security
            if (userProfile.containsKey("password")) {
                userProfile.remove("password");
                logger.info("Password removed from user profile for security");
            }
            
            // Create response with JWT token, user details, and expiration date
            return ResponseEntity.ok(new AuthResponse(jwtToken, userProfile, expiresAt, null));
        } catch (Exception e) {
            logger.error("Error authenticating with Google: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Authentication failed: " + e.getMessage()));
        }
    }
}