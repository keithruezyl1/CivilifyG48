package com.capstone.civilify.controller;

import com.capstone.civilify.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for debugging purposes.
 * Provides endpoints to diagnose authentication and network issues.
 */
@RestController
@RequestMapping("/api/debug")
public class DebugController {

    private static final Logger logger = LoggerFactory.getLogger(DebugController.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    /**
     * Debug endpoint to check request headers and authentication status.
     * Useful for diagnosing CORS and authentication issues.
     *
     * @param request The HTTP request
     * @return A response entity with debug information
     */
    @GetMapping("/request-info")
    public ResponseEntity<?> getRequestInfo(HttpServletRequest request) {
        Map<String, Object> debugInfo = new HashMap<>();
        Map<String, String> headers = new HashMap<>();

        // Log all headers for debugging
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            headers.put(headerName, request.getHeader(headerName));
        }

        // Debug authentication
        String authHeader = request.getHeader("Authorization");
        boolean hasAuthHeader = (authHeader != null && !authHeader.isEmpty());
        // Safely check if token is Bearer format only if authHeader is not null
        boolean isBearerToken = hasAuthHeader && authHeader != null && authHeader.startsWith("Bearer ");
        
        Map<String, Object> authInfo = new HashMap<>();
        authInfo.put("hasAuthHeader", hasAuthHeader);
        authInfo.put("isBearerToken", isBearerToken);

        // Check token if present
        if (isBearerToken && authHeader != null) {
            String token = authHeader.substring(7);
            try {
                String username = jwtUtil.extractUsername(token);
                boolean isValid = jwtUtil.validateToken(token);
                
                authInfo.put("tokenPresent", true);
                authInfo.put("username", username);
                authInfo.put("isValid", isValid);
                
                if (!isValid) {
                    try {
                        boolean isExpired = jwtUtil.isTokenExpired(token);
                        authInfo.put("isExpired", isExpired);
                    } catch (Exception e) {
                        authInfo.put("expiryCheckError", e.getMessage());
                    }
                }
            } catch (Exception e) {
                authInfo.put("tokenError", e.getMessage());
            }
        }

        // Add server configuration info
        Map<String, Object> serverConfig = new HashMap<>();
        serverConfig.put("allowedOrigins", allowedOrigins);
        serverConfig.put("serverTime", System.currentTimeMillis());

        // Compile all info
        debugInfo.put("headers", headers);
        debugInfo.put("authentication", authInfo);
        debugInfo.put("serverConfig", serverConfig);
        debugInfo.put("remoteAddress", request.getRemoteAddr());
        debugInfo.put("requestURI", request.getRequestURI());

        logger.debug("Debug request received: {}", debugInfo);

        return ResponseEntity.ok(debugInfo);
    }

    /**
     * Endpoint to validate a JWT token and return its details.
     *
     * @param token The JWT token to validate (without "Bearer " prefix)
     * @return A response entity with token information
     */
    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        Map<String, Object> tokenInfo = new HashMap<>();

        try {
            String username = jwtUtil.extractUsername(token);
            boolean isValid = jwtUtil.validateToken(token);
            
            tokenInfo.put("username", username);
            tokenInfo.put("isValid", isValid);
            
            if (!isValid) {
                boolean isExpired = jwtUtil.isTokenExpired(token);
                tokenInfo.put("isExpired", isExpired);
            }
        } catch (Exception e) {
            tokenInfo.put("error", e.getMessage());
            tokenInfo.put("isValid", false);
        }

        return ResponseEntity.ok(tokenInfo);
    }
}
