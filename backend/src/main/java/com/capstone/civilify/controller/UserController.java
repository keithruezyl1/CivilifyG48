package com.capstone.civilify.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.capstone.civilify.dto.AuthResponse;
import com.capstone.civilify.dto.ErrorResponse;
import com.capstone.civilify.service.CloudinaryService;
import com.capstone.civilify.service.FirebaseAuthService;
import com.capstone.civilify.service.FirestoreService;
import com.capstone.civilify.util.JwtUtil;

/**
 * Controller for handling user-related operations.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final FirestoreService firestoreService;
    private final FirebaseAuthService firebaseAuthService;
    private final CloudinaryService cloudinaryService;
    private final JwtUtil jwtUtil;

    /**
     * Constructor for UserController.
     * 
     * @param firestoreService   Firestore service instance.
     * @param firebaseAuthService Firebase authentication service instance.
     * @param cloudinaryService  Cloudinary service instance.
     * @param jwtUtil            JWT utility instance.
     */
    public UserController(FirestoreService firestoreService, FirebaseAuthService firebaseAuthService, CloudinaryService cloudinaryService, JwtUtil jwtUtil) {
        this.firestoreService = firestoreService;
        this.firebaseAuthService = firebaseAuthService;
        this.cloudinaryService = cloudinaryService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Handles user registration.
     * 
     * @param email         User's email.
     * @param password      User's password.
     * @param username      User's username.
     * @param profilePicture User's profile picture (optional).
     * @return Response entity containing JWT token and user details.
     */
    @PostMapping(value = "/register", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerUser(
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String username,
            @RequestParam(required = false) MultipartFile profilePicture) {
        try {
            // Step 1: Create the user with Firebase Authentication
            String uid = firebaseAuthService.createUser(email, password);

            // Step 2: Upload profile picture to Cloudinary if provided
            String profilePictureUrl = null;
            if (profilePicture != null && !profilePicture.isEmpty()) {
                profilePictureUrl = cloudinaryService.uploadImage(profilePicture);
            }

            // Step 3: Store user profile in Firestore
            firestoreService.addUserProfile(uid, email, username, profilePictureUrl);

            // Step 4: Generate JWT token
            String jwtToken = jwtUtil.generateToken(email);

            // Step 5: Create user details map
            Map<String, Object> userDetails = new HashMap<>();
            userDetails.put("userId", uid);
            userDetails.put("email", email);
            userDetails.put("username", username);
            userDetails.put("profile_picture_url", profilePictureUrl);

            // Return response with token and user details
            return ResponseEntity.ok(new AuthResponse(jwtToken, userDetails));
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error registering user: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Retrieves a user's profile picture URL by their UID.
     * 
     * @param uid The user's unique identifier.
     * @return Response entity containing the profile picture URL.
     */
    @GetMapping("/{uid}/profile-picture")
    public ResponseEntity<?> getUserProfilePicture(@PathVariable String uid) {
        try {
            // Fetch user profile from Firestore
            Map<String, Object> userProfile = firestoreService.getUserProfile(uid);
            
            if (userProfile != null && userProfile.containsKey("profile_picture_url")) {
                String profilePictureUrl = (String) userProfile.get("profile_picture_url");
                
                // Return the profile picture URL
                Map<String, String> response = new HashMap<>();
                response.put("profile_picture_url", profilePictureUrl);
                return ResponseEntity.ok(response);
            } else {
                // Return a default profile picture URL if none is found
                Map<String, String> response = new HashMap<>();
                response.put("profile_picture_url", "https://randomuser.me/api/portraits/men/32.jpg");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error fetching user profile picture: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Handles user login.
     * 
     * @param email    User's email.
     * @param password User's password.
     * @return Response entity containing JWT token and user details.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String email, @RequestParam String password) {
        try {
            // Authenticate user with Firebase
            String firebaseToken = firebaseAuthService.signInWithEmailAndPassword(email, password);
            
            // Get user details from Firestore
            Map<String, Object> userDetails = firestoreService.getUserByEmail(email);
            
            // Generate JWT token
            String jwtToken = jwtUtil.generateToken(email);
            
            // Return response with JWT token and user details
            return ResponseEntity.ok(new AuthResponse(jwtToken, userDetails));
        } catch (InterruptedException | ExecutionException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Authentication failed: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    /**
     * Retrieves user details by email.
     * 
     * @param email User's email.
     * @return Response entity containing user details.
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        try {
            Map<String, Object> userData = firestoreService.getUserByEmail(email);
            return ResponseEntity.ok(userData);
        } catch (InterruptedException | ExecutionException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("User not found"));
        }
    }
}