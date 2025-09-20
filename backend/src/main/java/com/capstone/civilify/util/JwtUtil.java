package com.capstone.civilify.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public String extractUserId(String token) {
        return extractUsername(token); // For now, use username as userId
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        // Use the modern builder pattern instead of the deprecated parser() method
        return Jwts.parserBuilder()
                .setSigningKey(getEncodedSecret().getBytes())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private String getEncodedSecret() {
        String encoded = Base64.getEncoder().encodeToString(secret.getBytes());
        logger.debug("Encoded JWT secret (first 5 chars): {}...", encoded.substring(0, Math.min(5, encoded.length())));
        return encoded;
    }

    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, username);
    }
    
    /**
     * Gets the expiration date for a newly generated token
     * @return Date when the token will expire
     */
    public Date getTokenExpirationDate() {
        return new Date(System.currentTimeMillis() + expiration);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        logger.info("Creating token for user: {}", subject);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                // Use the non-deprecated signWith method that takes a Key instead of a String
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(getEncodedSecret().getBytes()), SignatureAlgorithm.HS256)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
    
    public boolean validateToken(String token) {
        try {
            logger.debug("Attempting to validate token: {}", token.substring(0, Math.min(10, token.length())) + "...");
            
            // Use the modern builder pattern instead of the deprecated parser() method
            Jwts.parserBuilder()
                .setSigningKey(getEncodedSecret().getBytes())
                .build()
                .parseClaimsJws(token);
                
            boolean isExpired = isTokenExpired(token);
            if (isExpired) {
                logger.warn("Token signature is valid but token is expired");
                return false;
            }
            
            logger.debug("Token validation successful");
            return true;
            
        } catch (io.jsonwebtoken.security.SecurityException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
            return false;
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
            return false;
        } catch (io.jsonwebtoken.UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
            return false;
        } catch (io.jsonwebtoken.MalformedJwtException e) {
            logger.error("JWT token is malformed: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            logger.error("Invalid token: {}", e.getMessage());
            return false;
        }
    }
}