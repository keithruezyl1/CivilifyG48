package com.capstone.civilify.entity;

import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class User implements UserDetails {

    private String id;
    private String email;
    private String username;
    private String profilePictureUrl;
    private String role = "ROLE_USER"; // Default role
    // We don't store the password in our entity since Firebase handles this
    
    public User() {}
    
    public User(String id, String email, String username, String profilePictureUrl) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.profilePictureUrl = profilePictureUrl;
    }
    
    public User(String id, String email, String username, String profilePictureUrl, String role) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.profilePictureUrl = profilePictureUrl;
        this.role = role;
    }

    // UserDetails implementation methods
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Return the user's role
        return Collections.singletonList(new SimpleGrantedAuthority(role));
    }

    @Override
    public String getPassword() {
        // Firebase handles password storage, so we return null here
        return null;
    }

    @Override
    public String getUsername() {
        // Using email as the username for Spring Security
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    // Custom getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public boolean isAdmin() {
        return "ROLE_ADMIN".equals(role);
    }
}