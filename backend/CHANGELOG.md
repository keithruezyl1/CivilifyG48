# Changelog

## 2025-04-23: Spring Boot Update

### Updated
- Updated Spring Boot version from 3.2.3 to 3.2.12 for security patches and bug fixes

## 2025-04-16: Firebase Configuration Fixes

### Fixed
- Made the application resilient to missing Firebase configuration:
  - Updated FirebaseConfig to conditionally initialize only when properly configured
  - Added configuration properties to control Firebase enablement
  - Added proper logging for initialization failures
- Modified UserService to operate without Firebase when necessary:
  - Implemented an in-memory fallback store for user data
  - Removed hard dependency on Firebase initialization
  - Added graceful degradation when Firebase is unavailable
  - Improved error handling for Firebase operations

## 2025-04-16: Circular Dependency Fix

### Fixed
- Resolved circular dependency between JwtAuthenticationFilter and SecurityConfig:
  - Removed @Component annotation from JwtAuthenticationFilter
  - Added JwtAuthenticationFilter as a bean in SecurityConfig
  - Updated constructor injection to avoid circular references
  - Removed duplicate UserDetailsService bean definition in SecurityConfig

## 2025-04-16: Codebase Fixes

### Fixed
- Fixed package declarations in all Java files to match the correct directory structure:
  - JwtUtil.java: Corrected package to `com.capstone.civilify.util`
  - User.java: Corrected package to `com.capstone.civilify.entity`
  - Role.java: Corrected package to `com.capstone.civilify.entity` 
  - AuthController.java: Corrected package to `com.capstone.civilify.controller`
  - JwtAuthenticationFilter.java: Corrected package to `com.capstone.civilify.config`
  - SecurityConfig.java: Corrected package to `com.capstone.civilify.config`
  - FirebaseConfig.java: Corrected package to `com.capstone.civilify.config`
  - KeyGeneratorUtil.java: Corrected package to `com.capstone.civilify.util`
- Fixed method in UserService.java where `get()` was undefined for DatabaseReference:
  - Replaced with proper Firebase Admin SDK approach using `addListenerForSingleValueEvent`
  - Added necessary imports for ValueEventListener, DataSnapshot, and DatabaseError
  - Improved error handling with more descriptive error messages

### Added
- Added missing dependencies to `pom.xml`:
  - JWT libraries (jjwt-api, jjwt-impl, jjwt-jackson)
  - Spring Data JPA
  - H2 Database
  - Commons Codec
  - Firebase Admin SDK

### Updated
- Enhanced JwtUtil.java with additional methods required by JwtAuthenticationFilter:
  - Added extractUsername
  - Added extractClaim
  - Added extractAllClaims
  - Added isTokenValid
  - Added methods to handle token expiration
- Added proper import for Claims class in JwtUtil
- Updated SecurityConfig with:
  - Proper endpoint mappings
  - UserDetailsService implementation
  - PasswordEncoder bean
- Updated dependencies from javax to jakarta (PostConstruct annotation)
- Enhanced application.properties with configurations for:
  - H2 Database
  - JPA/Hibernate
  - JWT settings
  - Server configuration
  - OAuth2 settings
- Fixed endpoint URLs in security configuration

### Technical Debt Addressed
- Custom properties in application.properties were renamed to follow Spring naming conventions
- Added proper constructor injection for dependencies
- Updated OAuth2 success URL to match controller endpoint
