package com.capstone.civilify.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final FirebaseAuthService firebaseAuthService;

    public CustomUserDetailsService(FirebaseAuthService firebaseAuthService) {
        this.firebaseAuthService = firebaseAuthService;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        try {
            // Get user from Firebase by email
            UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(email);
            
            // Create UserDetails with default authority
            return new User(
                userRecord.getEmail(),
                // Password is not used for token validation, so we use a placeholder
                "firebase-auth", 
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
            );
        } catch (FirebaseAuthException e) {
            throw new UsernameNotFoundException("User not found with email: " + email, e);
        }
    }
}
