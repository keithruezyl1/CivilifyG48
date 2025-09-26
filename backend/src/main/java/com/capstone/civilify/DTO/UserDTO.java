package com.capstone.civilify.DTO;

/**
 * Data Transfer Object for User information.
 */
public record UserDTO(
    String userId,
    String email,
    String username,
    String profilePictureUrl,
    String role
) {
    /**
     * Canonical constructor with validation
     */
    public UserDTO {
        // Validate required fields
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID cannot be null or blank");
        }
        
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be null or blank");
        }
        
        if (username == null) { // Allow empty username but not null
            throw new IllegalArgumentException("Username cannot be null");
        }
        
        // Role defaults to ROLE_USER if not provided
        if (role == null || role.isBlank()) {
            role = "ROLE_USER";
        }
    }
}
