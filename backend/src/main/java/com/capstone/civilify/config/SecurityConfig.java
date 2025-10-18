package com.capstone.civilify.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Autowired
    private Environment environment;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, HandlerMappingIntrospector introspector) throws Exception {
        MvcRequestMatcher.Builder mvcMatcherBuilder = new MvcRequestMatcher.Builder(introspector);
        
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authorize -> authorize
                // Public endpoints
                .requestMatchers(mvcMatcherBuilder.pattern("/api/auth/**")).permitAll()
                .requestMatchers(mvcMatcherBuilder.pattern("/api/ai/**")).permitAll()
                .requestMatchers(mvcMatcherBuilder.pattern("/api/knowledge-base/**")).permitAll()
                .requestMatchers(mvcMatcherBuilder.pattern("/health")).permitAll()
                .requestMatchers(mvcMatcherBuilder.pattern("/api/debug/**")).permitAll()
                .requestMatchers(mvcMatcherBuilder.pattern("/api/users/register")).permitAll()
                .requestMatchers(mvcMatcherBuilder.pattern("/api/users/login")).permitAll()
                .requestMatchers(mvcMatcherBuilder.pattern("/api/users/email/**")).permitAll()
                .requestMatchers(mvcMatcherBuilder.pattern("/api/users/*/profile-picture")).permitAll()
                // Role-based protection
                .requestMatchers(mvcMatcherBuilder.pattern("/api/system/**")).hasRole("SYSTEM_ADMIN")
                .requestMatchers(mvcMatcherBuilder.pattern("/api/admin/**")).hasAnyRole("ADMIN", "SYSTEM_ADMIN")
                .requestMatchers(mvcMatcherBuilder.pattern("/api/users/**")).hasAnyRole("USER", "ADMIN", "SYSTEM_ADMIN")
                // For H2 console access (for development only)
                .requestMatchers(mvcMatcherBuilder.pattern("/h2-console/**")).permitAll()
                // Admin-specific endpoints
                // Secure all other endpoints
                .anyRequest().authenticated()
            )
            // Add JWT filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            // Use stateless session management
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Optional: If you need H2 console to work
            .headers(headers -> headers.frameOptions().disable());

        return http.build();
    }

    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        hierarchy.setHierarchy("ROLE_SYSTEM_ADMIN > ROLE_ADMIN \n ROLE_ADMIN > ROLE_USER");
        return hierarchy;
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Get allowed origins from application properties (set in application.properties)
        String[] allowedOriginsArray = environment.getProperty("cors.allowed-origins", String[].class);
        if (allowedOriginsArray != null && allowedOriginsArray.length > 0) {
            configuration.setAllowedOrigins(Arrays.asList(allowedOriginsArray));
        } else {
            // Fallback to default values
            configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000", 
                "http://localhost:5173", 
                "http://127.0.0.1:5173", 
                "http://127.0.0.1:3000"
            ));
        }
        
        // Get allowed methods from application properties
        String[] allowedMethodsArray = environment.getProperty("cors.allowed-methods", String[].class);
        if (allowedMethodsArray != null && allowedMethodsArray.length > 0) {
            configuration.setAllowedMethods(Arrays.asList(allowedMethodsArray));
        } else {
            // Fallback to default values
            configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        }
        
        // Set allowed headers - include all needed headers including custom debug headers
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Allow credentials (important for cookies and Authorization headers)
        configuration.setAllowCredentials(true);
        
        // Add exposed headers for debugging
        configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Auth-Token", "X-Debug-Info"));
        
        // Set max age for preflight requests (1 hour)
        configuration.setMaxAge(3600L);
        
        // Set exposed headers - explicitly expose the Authorization header
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        
        // Set max age for CORS preflight requests (in seconds) - 1 hour
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}