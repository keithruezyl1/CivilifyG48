package com.capstone.civilify.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.security.Principal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
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
            // We need to call this method to verify credentials, but we're using JWT for subsequent auth
            firebaseAuthService.signInWithEmailAndPassword(email, password);
            
            // Get user details from Firestore
            Map<String, Object> userDetails = firestoreService.getUserByEmail(email);
            
            // Remove password from user details for security
            if (userDetails.containsKey("password")) {
                userDetails.remove("password");
                logger.info("Password removed from user details for security");
            }
            
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
            
            // Remove password from user data for security
            if (userData.containsKey("password")) {
                userData.remove("password");
                logger.info("Password removed from user profile data for security");
            }
            
            return ResponseEntity.ok(userData);
        } catch (InterruptedException | ExecutionException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("User not found"));
        }
    }

    /**
     * Retrieves the authenticated user's profile.
     * 
     * @param principal The authenticated user.
     * @return Response entity containing the user's profile details.
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(Principal principal, HttpServletRequest request) {
        try {
            // Debug authentication issues
            String authHeader = request.getHeader("Authorization");
            boolean hasAuth = (authHeader != null && !authHeader.isEmpty());
            
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Authentication required. Has Auth Header: " + hasAuth));
            }
            
            String email = principal.getName();
            Map<String, Object> userData = firestoreService.getUserByEmail(email);
            
            if (userData == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("User profile not found"));
            }
            
            // Remove password from user data for security
            if (userData.containsKey("password")) {
                userData.remove("password");
                logger.info("Password removed from user profile data for security");
            }
            
            return ResponseEntity.ok(userData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Error fetching user profile: " + e.getMessage()));
        }
    }

    /**
     * Updates the authenticated user's profile.
     * 
     * @param principal The authenticated user.
     * @param profileData Map containing the profile data to update.
     * @return Response entity containing the updated user profile.
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(Principal principal, @RequestBody Map<String, Object> profileData, HttpServletRequest request) {
        try {
            // Debug auth header and validate it safely
            String authHeader = null;
            boolean hasAuthHeader = false;
            boolean isBearerToken = false;
            
            // Get header if request exists
            if (request != null) {
                authHeader = request.getHeader("Authorization");
                // First check if header exists
                if (authHeader != null) {
                    hasAuthHeader = !authHeader.isEmpty();
                    // Only check format if we have a non-empty header
                    if (hasAuthHeader) {
                        isBearerToken = authHeader.startsWith("Bearer ");
                    }
                }
            }
            
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Authentication required: Header present: " + hasAuthHeader + ", Bearer format: " + isBearerToken));
            }
            
            String email = principal.getName();
            
            // Validate the profile data
            if (profileData.containsKey("email") && !email.equals(profileData.get("email"))) {
                // Prevent changing email through this endpoint for security reasons
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Changing email is not allowed through this endpoint"));
            }
            
            // Check if password is being updated
            if (profileData.containsKey("password")) {
                String newPassword = (String) profileData.get("password");
                
                // Update password in Firebase Authentication
                boolean passwordUpdateSuccess = firebaseAuthService.updateUserPassword(email, newPassword);
                
                if (!passwordUpdateSuccess) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ErrorResponse("Failed to update password in authentication system"));
                }
                
                logger.info("Password successfully updated in Firebase Authentication for user: {}", email);
            }
            
            // Update the user profile in Firestore
            Map<String, Object> updatedProfile = firestoreService.updateUserProfile(email, profileData);
            
            // Make sure password is never sent back to the frontend for security
            updatedProfile.remove("password");
            
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Error updating user profile: " + e.getMessage()));
        }
    }

    /**
     * Uploads a profile picture for the authenticated user.
     * 
     * @param principal The authenticated user.
     * @param profilePicture The profile picture file to upload.
     * @return Response entity containing the URL of the uploaded profile picture.
     */
    @PostMapping(value = "/upload-profile-picture", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadProfilePicture(Principal principal, @RequestParam("profilePicture") MultipartFile profilePicture, HttpServletRequest request) {
        try {
            // Debug auth header to troubleshoot
            // Get auth header and validate it safely
            String authHeader = null; // Initialize to null first
            boolean hasAuthHeader = false;
            boolean isBearerToken = false;
            
            // Get header if request exists
            if (request != null) {
                authHeader = request.getHeader("Authorization");
                // First check if header exists
                if (authHeader != null) {
                    hasAuthHeader = !authHeader.isEmpty();
                    // Only check format if we have a non-empty header
                    if (hasAuthHeader) {
                        isBearerToken = authHeader.startsWith("Bearer ");
                    }
                }
            }
            
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Authentication required: Header present: " + hasAuthHeader + ", Bearer format: " + isBearerToken));
            }
            
            if (profilePicture == null || profilePicture.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("No profile picture provided"));
            }
            
            String email = principal.getName();
            
            // Upload the profile picture to Cloudinary
            String profilePictureUrl = cloudinaryService.uploadImage(profilePicture);
            
            // Update the user's profile with the new profile picture URL
            Map<String, Object> profileUpdate = new HashMap<>();
            profileUpdate.put("profile_picture_url", profilePictureUrl);
            
            // Update the profile and log the result
            firestoreService.updateUserProfile(email, profileUpdate);
            
            // Return just the profile picture URL in the response
            Map<String, String> response = new HashMap<>();
            response.put("profile_picture_url", profilePictureUrl);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Error uploading profile picture: " + e.getMessage()));
        }
    }
}