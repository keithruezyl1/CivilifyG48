package com.capstone.civilify.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.SignatureException;
import io.jsonwebtoken.Claims;
import org.apache.commons.codec.binary.Base64;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UserDetails;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Date;
import java.util.List;
import java.util.function.Function;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;

@Service
public class JwtUtil {

    int accessExpirationMs=9600000;
    
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    private Claims extractAllClaims(String token) {
        // Note: This implementation requires a public key which isn't currently available
        // In a real application, this would use the jwtPublicKey
        return Jwts.parserBuilder()
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }
    
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    public String generateAccessToken(String userName,  List<String> roleArray, String jwtPrivateKey) throws NoSuchAlgorithmException, InvalidKeySpecException {
        return Jwts.builder()
                .setSubject(userName)
                .claim("roles", roleArray)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + accessExpirationMs))
                .signWith(SignatureAlgorithm.RS256, generateJwtKeyEncryption(jwtPrivateKey))
                .compact();
    }

    public PublicKey generateJwtKeyDecryption(String jwtPublicKey) throws NoSuchAlgorithmException, InvalidKeySpecException {
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        byte[] keyBytes = Base64.decodeBase64(jwtPublicKey);
        X509EncodedKeySpec x509EncodedKeySpec=new X509EncodedKeySpec(keyBytes);
        return keyFactory.generatePublic(x509EncodedKeySpec);
    }

    public PrivateKey generateJwtKeyEncryption(String jwtPrivateKey) throws NoSuchAlgorithmException, InvalidKeySpecException {
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        byte[] keyBytes = Base64.decodeBase64(jwtPrivateKey);
        PKCS8EncodedKeySpec pkcs8EncodedKeySpec=new PKCS8EncodedKeySpec(keyBytes);
        return keyFactory.generatePrivate(pkcs8EncodedKeySpec);
    }

    public boolean validateJwtToken(String authToken, String jwtPublicKey) {
        try {
            Jwts.parser().setSigningKey(generateJwtKeyDecryption(jwtPublicKey)).parseClaimsJws(authToken);
            return true;
        } catch (SignatureException e) {
            System.out.println("Invalid JWT signature: {}"+ e.getMessage());
        } catch (MalformedJwtException e) {
            System.out.println("Invalid JWT token: {}"+ e.getMessage());
        } catch (ExpiredJwtException e) {
            System.out.println("JWT token is expired: {}"+ e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.out.println("JWT token is unsupported: {}"+ e.getMessage());
        } catch (IllegalArgumentException e) {
            System.out.println("JWT claims string is empty: {}"+ e.getMessage());
        } catch (NoSuchAlgorithmException e) {
            System.out.println("no such algorithm exception");
        } catch (InvalidKeySpecException e) {
            System.out.println("invalid key exception");
        }

        return false;
    }
}