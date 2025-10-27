# Civilify App - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Authentication & Authorization (RBAC)](#authentication--authorization-rbac)
5. [RAG (Retrieval-Augmented Generation) System](#rag-retrieval-augmented-generation-system)
6. [Frontend Architecture](#frontend-architecture)
7. [Backend Architecture](#backend-architecture)
8. [Database & Storage](#database--storage)
9. [API Endpoints](#api-endpoints)
10. [Configuration & Environment Variables](#configuration--environment-variables)
11. [Deployment](#deployment)
12. [Security](#security)
13. [Error Handling](#error-handling)
14. [Performance Optimizations](#performance-optimizations)

---

## Overview

**Civilify** is an AI-powered legal assistant application specializing in Philippine law. It provides users with intelligent legal guidance through two main modes:

- **Mode A (GLI)**: General Legal Information - Provides comprehensive legal information and guidance
- **Mode B (CPA)**: Case Plausibility Assessment - Analyzes legal scenarios and provides structured assessments

The application features a sophisticated **RAG (Retrieval-Augmented Generation)** system that combines external knowledge base retrieval with OpenAI's language models to deliver accurate, contextually relevant legal information.

### Key Features
- **Role-Based Access Control (RBAC)** with three roles: `SYSTEM_ADMIN`, `ADMIN`, `USER`
- **Dual AI Modes** for different legal assistance needs
- **Knowledge Base Integration** via external Villy service
- **Real-time Chat Interface** with conversation history
- **User Profile Management** with Cloudinary image storage
- **Firebase Authentication** with Google OAuth support
- **JWT-based Security** with role-based authorization

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Spring Boot   │    │   External      │
│                 │◄──►│    Backend      │◄──►│   Services      │
│  - Material UI  │    │                 │    │                 │
│  - React Router │    │  - REST APIs   │    │  - OpenAI API   │
│  - Axios HTTP   │    │  - JWT Auth    │    │  - Villy KB     │
│  - State Mgmt   │    │  - Spring Sec  │    │  - Firebase    │
└─────────────────┘    └─────────────────┘    │  - Cloudinary  │
                                             └─────────────────┘
```

### Component Interaction Flow

```
User Request → Frontend → Backend Controller → Service Layer → External APIs
     ↓              ↓           ↓                ↓              ↓
JWT Validation → Security → Business Logic → Data Processing → Response
     ↓              ↓           ↓                ↓              ↓
Role Check → Authorization → RAG Processing → Data Storage → UI Update
```

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **Material UI (MUI)** - Component library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **React Markdown** - Markdown rendering
- **React Toastify** - Notifications
- **React Icons** - Icon library

### Backend
- **Spring Boot 3.x** - Java framework
- **Spring Security** - Authentication & authorization
- **Spring Web** - REST API framework
- **JWT (JSON Web Tokens)** - Token-based authentication
- **Firebase Admin SDK** - Authentication & Firestore
- **OpenAI Java SDK** - AI integration
- **RestTemplate** - HTTP client for external APIs

### Database & Storage
- **Firebase Firestore** - NoSQL database
- **Cloudinary** - Image storage and management
- **Firebase Authentication** - User authentication

### External Services
- **OpenAI API** - GPT-4o/GPT-5 for AI responses
- **Villy Knowledge Base** - Legal document retrieval
- **Google OAuth** - Social authentication

---

## Authentication & Authorization (RBAC)

### Role Hierarchy
```
ROLE_SYSTEM_ADMIN > ROLE_ADMIN > ROLE_USER
```

### Role Permissions

| Role | Permissions |
|------|-------------|
| **SYSTEM_ADMIN** | • All ADMIN permissions<br>• User role management<br>• System administration<br>• Access to `/system` routes |
| **ADMIN** | • All USER permissions<br>• User management<br>• Access to `/admin` routes<br>• User deletion |
| **USER** | • Chat with AI<br>• Profile management<br>• Access to `/chat` routes |

### Authentication Flow

1. **User Login** → Firebase Authentication
2. **Token Generation** → JWT with role claims
3. **Frontend Storage** → localStorage with user data
4. **Request Authorization** → JWT validation + role checking
5. **Route Protection** → ProtectedRoute component

### Security Implementation

#### Backend Security (`SecurityConfig.java`)
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        return http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/chat/**").permitAll()
                .requestMatchers("/api/system/**").hasRole("SYSTEM_ADMIN")
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SYSTEM_ADMIN")
                .requestMatchers("/api/users/**").hasAnyRole("USER", "ADMIN", "SYSTEM_ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

#### Frontend Route Protection (`ProtectedRoute.jsx`)
```javascript
const ProtectedRoute = ({ children, requiredRole }) => {
  const userRole = user.role || 'ROLE_USER';
  
  if (requiredRole) {
    if (userRole === 'ROLE_SYSTEM_ADMIN') return children;
    if (requiredRole === 'ADMIN' && (userRole === 'ROLE_ADMIN' || userRole === 'ROLE_SYSTEM_ADMIN')) return children;
    if (requiredRole === 'USER' && (userRole === 'ROLE_USER' || userRole === 'ROLE_ADMIN' || userRole === 'ROLE_SYSTEM_ADMIN')) return children;
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};
```

---

## RAG (Retrieval-Augmented Generation) System

### Overview
The RAG system implements a **KB-First approach** that prioritizes knowledge base content while enhancing responses with AI capabilities.

### RAG Architecture

```
User Query → Knowledge Base Search → AI Enhancement → Response Generation
     ↓              ↓                      ↓                ↓
Query Analysis → Document Retrieval → Context Building → Final Answer
     ↓              ↓                      ↓                ↓
Preprocessing → Semantic Search → Prompt Engineering → Source Attribution
```

### RAG Flow Implementation

#### 1. Query Processing (`OpenAIController.java`)
```java
// Step 1: Get primary KB response using enhanced chat
KnowledgeBaseChatResponse kbResponse = 
    openAIService.getKnowledgeBaseService().chatWithKnowledgeBaseEnhanced(userMessage, mode);

// Step 2: Generate enhanced AI response with KB context
String enhancedSystemPrompt = buildEnhancedSystemPrompt(systemPrompt, primaryKbAnswer, kbSources, mode);

String aiResponse = openAIService.generateResponse(
    userMessage,
    enhancedSystemPrompt,
    conversationHistoryForAI,
    mode
);
```

#### 2. Knowledge Base Integration (`KnowledgeBaseService.java`)

**Enhanced Chat Method:**
```java
public KnowledgeBaseChatResponse chatWithKnowledgeBaseEnhanced(String question, String mode) {
    // Step 1: Get primary KB response using chat endpoint
    KnowledgeBaseChatResponse kbResponse = chatWithKnowledgeBase(question);
    
    // Step 2: Get additional sources for context enrichment
    List<KnowledgeBaseEntry> additionalSources = searchKnowledgeBase(question, maxResults);
    
    // Step 3: Combine primary answer with additional sources
    List<KnowledgeBaseEntry> allSources = new ArrayList<>();
    if (kbResponse.getSources() != null) {
        allSources.addAll(kbResponse.getSources());
    }
    if (additionalSources != null) {
        allSources.addAll(additionalSources);
    }
    
    // Remove duplicates based on entryId
    Map<String, KnowledgeBaseEntry> uniqueSources = new LinkedHashMap<>();
    for (KnowledgeBaseEntry entry : allSources) {
        if (entry.getEntryId() != null) {
            uniqueSources.put(entry.getEntryId(), entry);
        }
    }
    
    return new KnowledgeBaseChatResponse(kbResponse.getAnswer(), new ArrayList<>(uniqueSources.values()));
}
```

#### 3. System Prompt Enhancement
```java
private String buildEnhancedSystemPrompt(String baseSystemPrompt, String primaryKbAnswer, 
                                       List<KnowledgeBaseEntry> kbSources, String mode) {
    StringBuilder enhancedPrompt = new StringBuilder(baseSystemPrompt);
    
    if (primaryKbAnswer != null && !primaryKbAnswer.trim().isEmpty()) {
        enhancedPrompt.append("\n\nKNOWLEDGE BASE CONTEXT:\n");
        enhancedPrompt.append("The following information was retrieved from the legal knowledge base:\n\n");
        enhancedPrompt.append(primaryKbAnswer);
        
        if (kbSources != null && !kbSources.isEmpty()) {
            enhancedPrompt.append("\n\nSUPPORTING LEGAL SOURCES:\n");
            for (KnowledgeBaseEntry source : kbSources) {
                enhancedPrompt.append("- ").append(source.getTitle());
                if (source.getCanonicalCitation() != null) {
                    enhancedPrompt.append(" (").append(source.getCanonicalCitation()).append(")");
                }
                enhancedPrompt.append("\n");
            }
        }
        
        enhancedPrompt.append("\nIMPORTANT: Base your response primarily on the knowledge base context provided above. ");
        enhancedPrompt.append("Use the specific legal provisions, citations, and information from the knowledge base.");
    }
    
    return enhancedPrompt.toString();
}
```

### RAG Features

#### 1. **Structured Query Generation (SQG)**
- Analyzes user queries to extract structured information
- Generates keywords, legal topics, and statute references
- Improves search precision and relevance

#### 2. **Hybrid Retrieval**
- **Vector Embeddings**: Semantic similarity search
- **Trigram Lexical Search**: Keyword-based matching
- **Regex Fast-Path**: Direct pattern matching for specific legal terms

#### 3. **Metadata Filtering**
- Filters results based on legal document types
- Prioritizes relevant entry types (statutes, cases, rules)
- Enhances result relevance

#### 4. **Cross-Encoder Reranking**
- Uses specialized models for better precision
- Reranks search results based on query relevance
- Improves answer quality

#### 5. **Confidence Gating**
- Prevents low-quality responses with dynamic thresholds
- Ensures only high-confidence answers are returned
- Maintains response quality standards

#### 6. **Caching & Performance**
- Client-side caching with TTL (Time To Live)
- In-flight request deduplication
- Jittered exponential backoff for retries
- Rate limiting protection

### AI Mode-Specific Prompts

#### Mode A (GLI) - General Legal Information
```java
private String getGliSystemPrompt() {
    return """
        You are Villy, Civilify's AI-powered legal assistant specializing in Philippine law. 
        Your role is to provide accurate, comprehensive legal information based on the provided knowledge base context.
        
        INTEGRATION RULES:
        1. ALWAYS prioritize and strictly adhere to the knowledge base content provided in the context
        2. Quote relevant legal provisions, rules, and statutes with proper citations
        3. If the knowledge base contains relevant information, base your response primarily on that content
        4. When citing legal sources, use the exact citations provided (e.g., "Rule 114 Sec. 1", "RPC Art. 308")
        5. If multiple relevant sources are provided, synthesize them coherently
        6. Always mention when information comes from specific legal documents
        
        RESPONSE GUIDELINES:
        - Provide clear, actionable legal information
        - Include relevant legal citations and references
        - Explain legal concepts in accessible language
        - Highlight important deadlines, requirements, or procedures
        - If the query involves procedural steps, provide them in logical order
        
        If the knowledge base context doesn't contain relevant information for the query, 
        acknowledge this limitation and provide general guidance while recommending consultation with a legal professional.
        """;
}
```

#### Mode B (CPA) - Case Plausibility Assessment
```java
private String getCpaSystemPrompt() {
    return """
        You are Villy, Civilify's AI-powered legal assistant specializing in case plausibility assessment for Philippine law. 
        Your role is to analyze legal scenarios and provide structured assessments based on relevant legal provisions.
        
        INTEGRATION RULES:
        1. ALWAYS prioritize and strictly adhere to the knowledge base content provided in the context
        2. Use specific legal provisions, elements, and requirements from the knowledge base for your analysis
        3. Quote relevant statutes, rules, and legal principles with proper citations
        4. Base your plausibility assessment on the legal standards found in the knowledge base
        
        ASSESSMENT FRAMEWORK:
        1. Legal Basis Analysis: Identify applicable laws, rules, or legal principles from the knowledge base
        2. Element-by-Element Review: Analyze each required element based on provided legal provisions
        3. Evidence Evaluation: Assess the strength and relevance of available evidence
        4. Procedural Considerations: Review any procedural requirements or deadlines
        5. Plausibility Score: Provide a percentage score (0-100%) with clear justification
        
        RESPONSE FORMAT:
        - Start with a brief case summary
        - Provide detailed legal analysis using knowledge base content
        - Include specific legal citations and provisions
        - End with: "Plausibility Score: X% - [Label] [Brief justification]"
        - Suggest next steps or additional considerations
        
        If the knowledge base context doesn't contain relevant legal provisions for the case, 
        acknowledge this limitation and recommend consultation with a legal professional for proper assessment.
        """;
}
```

---

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── ProtectedRoute.jsx          # Route protection with RBAC
│   ├── ProfileAvatar.jsx           # User avatar component
│   ├── VillyReportCard.jsx         # AI response display
│   └── LoadingScreen.jsx           # Loading states
├── pages/
│   ├── signin.jsx                  # Authentication page
│   ├── signup.jsx                  # User registration
│   ├── chat.jsx                    # Main chat interface
│   ├── admin.jsx                   # Admin dashboard
│   ├── system.jsx                 # System admin dashboard
│   ├── profile.jsx                 # User profile management
│   └── unauthorized.jsx            # Access denied page
├── utils/
│   ├── auth.js                     # Authentication utilities
│   └── axiosConfig.js              # HTTP client configuration
└── Routes.jsx                      # Application routing
```

### State Management

#### Authentication State (`useAuth` hook)
```javascript
export const useAuth = () => {
  const [user, setUser] = React.useState(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      const tokenStatus = validateAuthToken();
      if (tokenStatus.valid) {
        const userData = getUserData();
        if (userData) {
          setUser(userData);
          const adminStatus = userData.role === 'admin' || 
                             userData.email?.includes('admin') ||
                             userData.isAdmin === true;
          setIsAdmin(adminStatus);
        }
      }
    };
    checkAuth();
  }, []);

  return { user, isAdmin, loading };
};
```

#### Chat State Management
```javascript
const [messages, setMessages] = useState([]);
const [isTyping, setIsTyping] = useState(false);
const [currentConversationId, setCurrentConversationId] = useState(null);
const [selectedMode, setSelectedMode] = useState("A");
const [userData, setUserData] = useState(null);
```

### UI/UX Design Principles

#### Material UI Integration
- **Consistent Design Language**: All components use Material UI for consistency
- **Responsive Layout**: Mobile-first design with responsive breakpoints
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Theme Integration**: Consistent color scheme and typography

#### User Experience Features
- **Real-time Typing Indicators**: Shows when AI is processing
- **Message Timestamps**: Click to reveal/hide timestamps
- **Source Attribution**: Displays knowledge base sources
- **Mode Switching**: Clear visual indicators for GLI/CPA modes
- **Error Handling**: Graceful error messages with retry options

---

## Backend Architecture

### Service Layer Architecture

```
Controller Layer → Service Layer → Repository/External APIs
     ↓               ↓                    ↓
REST Endpoints → Business Logic → Data Access
     ↓               ↓                    ↓
Request/Response → Processing → Storage/Retrieval
```

### Core Services

#### 1. **OpenAIService** - AI Integration
```java
@Service
public class OpenAIService {
    
    public String generateResponse(String userMessage, String systemPrompt, 
                                 List<Map<String, String>> conversationHistory, String mode) {
        // Dynamic model selection based on mode
        String model = mode.equals("A") ? gliModel : cpaModel;
        
        // Build request with conversation context
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        
        // Add conversation history
        for (Map<String, String> msg : conversationHistory) {
            String role = Boolean.parseBoolean(msg.get("isUserMessage")) ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", msg.get("content")));
        }
        
        messages.add(Map.of("role", "user", "content", userMessage));
        
        // Call OpenAI API with mode-specific parameters
        return callOpenAIAPI(messages, model, mode);
    }
}
```

#### 2. **KnowledgeBaseService** - RAG Integration
```java
@Service
public class KnowledgeBaseService {
    
    public List<KnowledgeBaseEntry> searchKnowledgeBase(String query, int limit) {
        // Input sanitization
        String normalizedQuery = sanitizeUserText(query).toLowerCase(Locale.ROOT).trim();
        
        // Cache check
        String cacheKey = "kb_search:" + normalizedQuery + ":" + limit;
        if (cache.containsKey(cacheKey)) {
            return cache.get(cacheKey);
        }
        
        // Execute search with retry logic
        return executeSearchWithRetry(normalizedQuery, limit, cacheKey);
    }
    
    private List<KnowledgeBaseEntry> executeSearchWithRetry(String query, int limit, String cacheKey) {
        for (int attempt = 1; attempt <= maxRetryAttempts; attempt++) {
            try {
                List<KnowledgeBaseEntry> results = doSearch(query, limit, cacheKey);
                cache.put(cacheKey, results);
                return results;
            } catch (HttpClientErrorException.TooManyRequests e) {
                if (attempt < maxRetryAttempts) {
                    long delay = calculateBackoffDelay(attempt);
                    sleepQuietly(delay);
                } else {
                    throw e;
                }
            }
        }
        return new ArrayList<>();
    }
}
```

#### 3. **ChatService** - Conversation Management
```java
@Service
public class ChatService {
    
    public ChatConversation createConversation(String userId, String userEmail, String title) {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(CONVERSATIONS_COLLECTION).document();
        String conversationId = docRef.getId();
        
        ChatConversation conversation = new ChatConversation(
            conversationId, userId, userEmail, title, new Date(), new Date(), "pending"
        );
        
        docRef.set(conversation);
        return conversation;
    }
    
    public ChatMessage addMessage(String conversationId, String userId, 
                                String userEmail, String content, boolean isUserMessage) {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(CONVERSATIONS_COLLECTION)
                                   .document(conversationId)
                                   .collection("messages")
                                   .document();
        
        ChatMessage message = new ChatMessage(
            docRef.getId(), userId, userEmail, content, isUserMessage, new Date(), conversationId
        );
        
        docRef.set(message);
        return message;
    }
}
```

### Controller Layer

#### REST API Controllers
- **OpenAIController**: Handles AI chat requests and RAG processing
- **AuthController**: Manages authentication and user login
- **UserController**: User profile management and registration
- **AdminController**: Admin-specific operations with RBAC
- **ChatController**: Conversation and message management
- **KnowledgeBaseController**: Direct knowledge base access

---

## Database & Storage

### Firebase Firestore Structure

#### Collections Schema
```
conversations/
├── {conversationId}/
│   ├── id: string
│   ├── userId: string
│   ├── userEmail: string
│   ├── title: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── status: string
│   └── messages/
│       ├── {messageId}/
│       │   ├── id: string
│       │   ├── userId: string
│       │   ├── userEmail: string
│       │   ├── content: string
│       │   ├── isUserMessage: boolean
│       │   ├── timestamp: timestamp
│       │   └── conversationId: string

users/
├── {userId}/
│   ├── email: string
│   ├── username: string
│   ├── profilePictureUrl: string
│   ├── role: string
│   └── createdAt: timestamp
```

### Cloudinary Integration

#### Image Storage
- **Profile Pictures**: User avatar storage and management
- **Upload Presets**: Secure, direct client-side uploads
- **Image Transformations**: Automatic resizing and optimization
- **CDN Delivery**: Global content delivery network

---

## API Endpoints

### Authentication Endpoints
```
POST /api/auth/login          # User login with Firebase
POST /api/auth/google         # Google OAuth authentication
POST /api/auth/forgot-password # Password reset
```

### User Management Endpoints
```
GET  /api/users/profile       # Get user profile
PUT  /api/users/profile       # Update user profile
POST /api/users/register      # User registration
GET  /api/users/email/{email} # Get user by email
POST /api/users/upload-profile-picture # Upload profile picture
```

### Chat Endpoints
```
POST /api/chat/conversations                    # Create conversation
GET  /api/chat/conversations/user/{email}       # Get user conversations
GET  /api/chat/conversations/{id}               # Get specific conversation
POST /api/chat/conversations/{id}/messages      # Add message to conversation
GET  /api/chat/conversations/{id}/messages      # Get conversation messages
```

### AI Endpoints
```
POST /api/ai/chat              # Main AI chat endpoint with RAG
```

### Knowledge Base Endpoints
```
POST /api/knowledge-base/chat  # Chat with knowledge base
POST /api/knowledge-base/search # Search knowledge base
```

### Admin Endpoints (RBAC Protected)
```
GET  /api/admin/users                    # Get all users (ADMIN+)
PUT  /api/admin/users/{id}/role          # Update user role (SYSTEM_ADMIN)
DELETE /api/admin/users/{id}             # Delete user (ADMIN+)
POST /api/admin/setup-initial-admin      # Setup initial admin (SYSTEM_ADMIN)
```

### System Admin Endpoints (SYSTEM_ADMIN only)
```
GET  /api/system/users                   # System admin user management
PUT  /api/system/users/{id}/role         # System admin role management
```

---

## Configuration & Environment Variables

### Backend Configuration (`application.properties`)

#### Core Application Settings
```properties
spring.application.name=civilify
server.port=8081
```

#### Firebase Configuration
```properties
firebase.database.url=${FIREBASE_DATABASE_URL}
firebase.project.id=${FIREBASE_PROJECT_ID}
firebase.service-account=${FIREBASE_SERVICE_ACCOUNT_FILE}
firebase.api-key=${FIREBASE_API_KEY}
```

#### JWT Configuration
```properties
jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION:604800000}  # 7 days default
```

#### OpenAI Configuration
```properties
# Mode A (GLI) - General Legal Information
openai.gli.api.key=${OPENAI_GLI_API_KEY}
openai.gli.model=${OPENAI_GLI_MODEL:gpt-4o}
openai.gli.temperature=0.3
openai.gli.max-tokens=600

# Mode B (CPA) - Case Plausibility Assessment
openai.cpa.api.key=${OPENAI_CPA_API_KEY}
openai.cpa.model=${OPENAI_CPA_MODEL:gpt-5}
openai.cpa.temperature=0.2
openai.cpa.max-tokens=2000
```

#### Knowledge Base Configuration
```properties
knowledge.base.api.url=${KNOWLEDGE_BASE_API_URL:https://law-entry-extension.onrender.com/api}
knowledge.base.api.key=${KNOWLEDGE_BASE_API_KEY}
knowledge.base.timeout=${KNOWLEDGE_BASE_TIMEOUT:30000}
knowledge.base.retry.attempts=${KNOWLEDGE_BASE_RETRY_ATTEMPTS:3}
knowledge.base.max.results=${KNOWLEDGE_BASE_MAX_RESULTS:5}
knowledge.base.enabled=${KNOWLEDGE_BASE_ENABLED:true}
knowledge.base.sqg.enabled=${KNOWLEDGE_BASE_SQG_ENABLED:true}
knowledge.base.metadata.filtering.enabled=${KNOWLEDGE_BASE_METADATA_FILTERING_ENABLED:true}
```

#### Cloudinary Configuration
```properties
cloudinary.cloudName=${CLOUDINARY_CLOUD_NAME}
cloudinary.apiKey=${CLOUDINARY_API_KEY}
cloudinary.apiSecret=${CLOUDINARY_API_SECRET}
cloudinary.uploadPreset=${CLOUDINARY_UPLOAD_PRESET}
```

#### CORS Configuration
```properties
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173}
cors.allowed-methods=${CORS_ALLOWED_METHODS:GET,POST,PUT,DELETE,OPTIONS}
cors.allowed-headers=${CORS_ALLOWED_HEADERS:*}
cors.allow-credentials=${CORS_ALLOW_CREDENTIALS:true}
```

### Required Environment Variables

#### Production Environment Variables
```bash
# Firebase
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_FILE=path/to/service-account.json
FIREBASE_API_KEY=your-firebase-api-key

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRATION=604800000

# OpenAI
OPENAI_GLI_API_KEY=sk-your-openai-key-for-mode-a
OPENAI_CPA_API_KEY=sk-your-openai-key-for-mode-b
OPENAI_GLI_MODEL=gpt-4o
OPENAI_CPA_MODEL=gpt-5
OPENAI_ORG=your-openai-org-id  # Optional for project-scoped keys
OPENAI_PROJECT=your-openai-project-id  # Optional for project-scoped keys

# Knowledge Base (Villy)
KNOWLEDGE_BASE_API_URL=https://law-entry-extension.onrender.com/api
KNOWLEDGE_BASE_API_KEY=your-villy-service-token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

---

## Deployment

### Backend Deployment (Render)

#### Build Configuration
```yaml
# render.yaml
services:
  - type: web
    name: civilify-backend
    env: java
    buildCommand: ./mvnw clean package -DskipTests
    startCommand: java -jar target/civilify-0.0.1-SNAPSHOT.jar
    envVars:
      - key: SPRING_PROFILES_ACTIVE
        value: production
```

#### Environment Variables Setup
1. **Firebase Configuration**: Set Firebase project credentials
2. **OpenAI API Keys**: Configure API keys for both modes
3. **Knowledge Base**: Set Villy service endpoint and token
4. **JWT Secret**: Set secure JWT signing key
5. **Cloudinary**: Configure image storage credentials

### Frontend Deployment (Vercel)

#### Build Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "react"
}
```

#### Environment Variables
```bash
VITE_API_URL=https://your-backend.onrender.com
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

---

## Security

### Authentication Security
- **JWT Tokens**: Secure token-based authentication with expiration
- **Firebase Integration**: Leverages Firebase's security infrastructure
- **Role-Based Access**: Granular permission system
- **Token Validation**: Server-side token validation on every request

### API Security
- **CORS Configuration**: Restricted cross-origin requests
- **Input Validation**: Request validation and sanitization
- **Rate Limiting**: Protection against abuse (via Knowledge Base service)
- **Error Handling**: Secure error messages without information leakage

### Data Security
- **Firestore Security Rules**: Database-level access control
- **Image Upload Security**: Cloudinary secure upload presets
- **Environment Variables**: Sensitive data in environment variables only
- **HTTPS Only**: All communications encrypted in transit

---

## Error Handling

### Frontend Error Handling

#### HTTP Error Interceptors
```javascript
// Response interceptor for auth errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthData();
      window.location.href = '/#/signin';
    }
    return Promise.reject(error);
  }
);
```

#### User-Friendly Error Messages
```javascript
const handleError = (error) => {
  if (error.message.includes('network')) {
    showErrorToast('Network error. Please check your connection.');
  } else if (error.message.includes('timeout')) {
    showErrorToast('Request timed out. Please try again.');
  } else {
    showErrorToast('An error occurred. Please try again.');
  }
};
```

### Backend Error Handling

#### Global Exception Handling
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException e) {
        return ResponseEntity.status(401)
            .body(new ApiResponse<>("ERROR", null, "Authentication failed: " + e.getMessage()));
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException e) {
        return ResponseEntity.status(403)
            .body(new ApiResponse<>("ERROR", null, "Access denied: " + e.getMessage()));
    }
}
```

#### Service-Level Error Handling
```java
public List<KnowledgeBaseEntry> searchKnowledgeBase(String query, int limit) {
    try {
        return executeSearchWithRetry(query, limit, cacheKey);
    } catch (HttpClientErrorException.TooManyRequests e) {
        logger.warn("Knowledge base rate limited: {}", e.getMessage());
        return new ArrayList<>(); // Return empty list instead of failing
    } catch (Exception e) {
        logger.error("Knowledge base search failed: {}", e.getMessage());
        return new ArrayList<>(); // Graceful degradation
    }
}
```

---

## Performance Optimizations

### Frontend Optimizations

#### React Performance
- **useMemo**: Memoize expensive calculations
- **useCallback**: Prevent unnecessary re-renders
- **React.memo**: Optimize component rendering
- **Lazy Loading**: Code splitting for route components

#### HTTP Optimizations
- **Request Deduplication**: Prevent duplicate API calls
- **Caching**: Client-side caching for static data
- **Debouncing**: Debounce user input for search
- **Pagination**: Load data in chunks

### Backend Optimizations

#### Database Optimizations
- **Firestore Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Caching**: In-memory caching for frequently accessed data

#### API Optimizations
- **Response Compression**: Gzip compression for API responses
- **Connection Pooling**: HTTP connection reuse
- **Async Processing**: Non-blocking I/O operations
- **Batch Operations**: Bulk database operations

#### RAG System Optimizations
- **Client-Side Caching**: Cache knowledge base responses
- **In-Flight Deduplication**: Prevent duplicate KB requests
- **Jittered Backoff**: Intelligent retry mechanisms
- **Rate Limiting**: Respect external API limits

---

## Conclusion

Civilify represents a sophisticated AI-powered legal assistant that successfully combines modern web technologies with advanced RAG capabilities. The application's architecture demonstrates:

### Key Strengths
1. **Robust RAG Implementation**: KB-first approach with AI enhancement
2. **Scalable Architecture**: Microservices-ready design
3. **Security-First Design**: Comprehensive RBAC and authentication
4. **Performance Optimized**: Caching, retry logic, and error handling
5. **User-Centric Design**: Intuitive UI with Material Design principles

### Technical Innovations
1. **Dual AI Modes**: Specialized prompts for different legal use cases
2. **Hybrid Retrieval**: Multiple search strategies for optimal results
3. **Intelligent Caching**: Multi-layer caching for performance
4. **Graceful Degradation**: System continues functioning even with service failures
5. **Role-Based Access**: Granular permission system for different user types

The RAG system, in particular, showcases advanced techniques including structured query generation, metadata filtering, cross-encoder reranking, and confidence gating - all working together to provide accurate, contextually relevant legal information to users.

This documentation serves as a comprehensive guide for understanding, maintaining, and extending the Civilify application.
