package com.capstone.civilify.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.capstone.civilify.dto.ApiResponse;
import com.capstone.civilify.dto.UserDTO;
import com.capstone.civilify.service.AdminService;

/**
 * Controller for handling admin operations.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    
    @Autowired
    private AdminService adminService;
    
    /**
     * Retrieves all users from the system.
     * 
     * @return ResponseEntity containing a list of all users.
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        try {
            List<UserDTO> users = adminService.getAllUsers();
            return new ResponseEntity<>(new ApiResponse<>("SUCCESS", "Users retrieved successfully", users), HttpStatus.OK);
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Error retrieving users: {}", e.getMessage());
            return new ResponseEntity<>(new ApiResponse<>("ERROR", "Failed to retrieve users: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Updates a user's role.
     * 
     * @param userId The unique identifier of the user.
     * @param roleData Map containing the new role to assign to the user.
     * @return ResponseEntity containing the updated user data.
     */
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserRole(@PathVariable String userId, @RequestBody RoleUpdateRequest roleData) {
        try {
            // Validate input
            if (roleData == null || roleData.getRole() == null || roleData.getRole().isBlank()) {
                return new ResponseEntity<>(new ApiResponse<>("ERROR", "Role cannot be null or blank", null), HttpStatus.BAD_REQUEST);
            }
            
            UserDTO updatedUser = adminService.updateUserRole(userId, roleData.getRole());
            return new ResponseEntity<>(new ApiResponse<>("SUCCESS", "User role updated successfully", updatedUser), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid input for user role update: {}", e.getMessage());
            return new ResponseEntity<>(new ApiResponse<>("ERROR", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Error updating user role: {}", e.getMessage());
            return new ResponseEntity<>(new ApiResponse<>("ERROR", "Failed to update user role: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Deletes a user from the system.
     * 
     * @param userId The unique identifier of the user to delete.
     * @return ResponseEntity with a success or error message.
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String userId) {
        try {
            boolean deleted = adminService.deleteUser(userId);
            
            if (deleted) {
                return new ResponseEntity<>(new ApiResponse<>("SUCCESS", "User deleted successfully", null), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(new ApiResponse<>("ERROR", "User not found or could not be deleted", null), HttpStatus.NOT_FOUND);
            }
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Error deleting user: {}", e.getMessage());
            return new ResponseEntity<>(new ApiResponse<>("ERROR", "Failed to delete user: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Utility endpoint to set up an initial admin user.
     * This endpoint should be secured or removed in production.
     * 
     * @param userEmail The email of the user to promote to admin.
     * @return ResponseEntity containing the updated user data.
     */
    @PostMapping("/setup-initial-admin")
    public ResponseEntity<ApiResponse<UserDTO>> setupInitialAdmin(@RequestParam String userEmail) {
        try {
            UserDTO updatedUser = adminService.updateUserRoleByEmail(userEmail, "ROLE_ADMIN");
            return new ResponseEntity<>(new ApiResponse<>("SUCCESS", "Admin role assigned successfully", updatedUser), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid input for initial admin setup: {}", e.getMessage());
            return new ResponseEntity<>(new ApiResponse<>("ERROR", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Error setting up initial admin: {}", e.getMessage());
            return new ResponseEntity<>(new ApiResponse<>("ERROR", "Failed to set up admin: " + e.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Request class for role updates.
     */
    public static class RoleUpdateRequest {
        private String role;
        
        public RoleUpdateRequest() {}
        
        public RoleUpdateRequest(String role) {
            this.role = role;
        }
        
        public String getRole() {
            return role;
        }
        
        public void setRole(String role) {
            this.role = role;
        }
    }
}
