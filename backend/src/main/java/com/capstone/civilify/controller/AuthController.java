package com.capstone.civilify.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import com.capstone.civilify.util.JwtUtil;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String username, @RequestParam String password) {
        // Validate username and password (replace with actual logic)
        if ("admin".equals(username) && "password".equals(password)) {
            try {
                String privateKey = "YOUR_PRIVATE_KEY"; // Replace with your private key
                String token = jwtUtil.generateAccessToken(username, List.of("ADMIN"), privateKey);
                return ResponseEntity.ok(token);
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Error generating token");
            }
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

     @GetMapping("/oauth2/success")
        public Map<String, Object> getUserDetails(@AuthenticationPrincipal OAuth2User principal) {
        return principal.getAttributes();
    }
}