package com.capstone.civilify.service;

import java.util.List;
import java.util.concurrent.ExecutionException;

import com.capstone.civilify.dto.UserDTO;

/**
 * Service interface for admin operations.
 */
public interface AdminService {
    
    /**
     * Retrieves all users from the system
     * 
     * @return List of all users as UserDTO objects
     * @throws ExecutionException If the Firestore operation fails
     * @throws InterruptedException If the operation is interrupted
     */
    List<UserDTO> getAllUsers() throws ExecutionException, InterruptedException;
    
    /**
     * Updates a user's role
     * 
     * @param userId The unique identifier of the user
     * @param role The new role to assign to the user
     * @return The updated user data
     * @throws ExecutionException If the Firestore operation fails
     * @throws InterruptedException If the operation is interrupted
     */
    UserDTO updateUserRole(String userId, String role) throws ExecutionException, InterruptedException;
    
    /**
     * Deletes a user from the system
     * 
     * @param userId The unique identifier of the user to delete
     * @return True if the user was deleted successfully, false otherwise
     * @throws ExecutionException If the Firestore operation fails
     * @throws InterruptedException If the operation is interrupted
     */
    boolean deleteUser(String userId) throws ExecutionException, InterruptedException;
    
    /**
     * Updates a user's role by email
     * 
     * @param email The email of the user
     * @param role The new role to assign to the user
     * @return The updated user data
     * @throws ExecutionException If the Firestore operation fails
     * @throws InterruptedException If the operation is interrupted
     */
    UserDTO updateUserRoleByEmail(String email, String role) throws ExecutionException, InterruptedException;
}
