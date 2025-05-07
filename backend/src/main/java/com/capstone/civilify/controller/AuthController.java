package com.capstone.civilify.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
                .body(new ErrorResponse("Email and password are required"));
        }
        
        try {
            // Authenticate with Firebase
            logger.info("Authenticating with Firebase...");
            String firebaseToken = firebaseAuthService.signInWithEmailAndPassword(
                loginRequest.getEmail(), 
                loginRequest.getPassword()
            );
            
            logger.info("Firebase authentication successful");
            
            // Get user details from Firestore
            logger.info("Fetching user details from Firestore...");
            Map<String, Object> userDetails = firestoreService.getUserByEmail(loginRequest.getEmail());
            
            // Generate JWT token
            logger.info("Generating JWT token...");
            String jwtToken = jwtUtil.generateToken(loginRequest.getEmail());
            
            // Create response with JWT token and user details
            logger.info("Login successful for user: {}", loginRequest.getEmail());
            return ResponseEntity.ok(new AuthResponse(jwtToken, userDetails));
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Authentication failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Authentication failed: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error during authentication: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("An unexpected error occurred: " + e.getMessage()));
        }
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
            String customToken = firebaseAuthService.createCustomToken(uid);
            
            // Generate JWT token for our application
            String jwtToken = jwtUtil.generateToken(email);
            
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
            
            // Create response with JWT token and user details
            return ResponseEntity.ok(new AuthResponse(jwtToken, userProfile));
        } catch (Exception e) {
            logger.error("Error authenticating with Google: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Authentication failed: " + e.getMessage()));
        }
    }
}