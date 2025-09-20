# Knowledge Base Integration for Civilify

## Overview

This document describes the implementation of knowledge base integration for the Civilify application, enabling Villy (the AI assistant) to use Retrieval-Augmented Generation (RAG) with a legal knowledge base before falling back to internet-based responses.

## Architecture

### Backend Integration

#### 1. Knowledge Base Service (`KnowledgeBaseService.java`)
- **Purpose**: Handles communication with the law-entry-extension-reference system
- **Key Features**:
  - RAG chat functionality with fallback to GPT
  - Semantic search capabilities
  - Health monitoring
  - Error handling and retry logic
- **Configuration**: Uses environment variables for API endpoints and authentication

#### 2. Knowledge Base Controller (`KnowledgeBaseController.java`)
- **Endpoints**:
  - `POST /api/knowledge-base/chat` - RAG chat with knowledge base
  - `POST /api/knowledge-base/search` - Semantic search
  - `GET /api/knowledge-base/entry/{entryId}` - Get specific entry
  - `GET /api/knowledge-base/health` - Health check
- **Authentication**: JWT-based authentication required
- **Response Format**: Includes answer, sources, and metadata

#### 3. Enhanced OpenAI Service
- **Integration**: Modified to use knowledge base first, then fallback to GPT
- **Method**: `chatWithKnowledgeBase()` - Main entry point for enhanced chat
- **Fallback**: Automatic fallback to internet-based GPT if KB unavailable

#### 4. Updated OpenAI Controller
- **Enhancement**: Modified chat endpoint to include knowledge base sources
- **Response**: Now includes `sources` and `hasKnowledgeBaseContext` fields
- **Backward Compatibility**: Maintains existing response structure

### Frontend Integration

#### 1. Knowledge Base Service (`knowledgeBaseService.js`)
- **Purpose**: Frontend service for KB operations
- **Features**:
  - Chat with knowledge base
  - Search functionality
  - Health monitoring
  - Error handling
- **Authentication**: Automatic JWT token inclusion

#### 2. Enhanced Chat Interface
- **Source Display**: Shows knowledge base sources below AI responses
- **Visual Indicators**: Clear indication when KB context is used
- **Source Format**: Displays title, citation, type, and summary
- **Responsive Design**: Works on all screen sizes

#### 3. Admin Knowledge Base Management
- **Page**: `/admin/knowledge-base` - Admin-only access
- **Features**:
  - Statistics dashboard
  - Quick actions for KB management
  - Integration status monitoring
  - Links to law-entry-extension system

#### 4. Updated Admin Panel
- **Navigation**: Added KB management link
- **Access Control**: Admin-only features
- **Integration**: Seamless access to law-entry-extension

## Configuration

### Environment Variables

#### Backend Configuration
```properties
# Knowledge Base Configuration
knowledge.base.api.url=${KNOWLEDGE_BASE_API_URL:http://localhost:10000/api}
knowledge.base.api.key=${KNOWLEDGE_BASE_API_KEY}
knowledge.base.timeout=${KNOWLEDGE_BASE_TIMEOUT:30000}
knowledge.base.retry.attempts=${KNOWLEDGE_BASE_RETRY_ATTEMPTS:3}
knowledge.base.retry.delay=${KNOWLEDGE_BASE_RETRY_DELAY:1000}
```

#### Frontend Configuration
```javascript
// API Base URL for knowledge base service
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';
```

## Data Flow

### 1. User Query Processing
```
User Input → Frontend Chat → Backend OpenAI Controller → Knowledge Base Service → Law Entry Extension API
```

### 2. RAG Response Flow
```
1. Query Knowledge Base (RAG)
2. If relevant context found → Return KB response with sources
3. If no relevant context → Fallback to GPT with internet access
4. Return response with metadata (sources, KB context flag)
```

### 3. Source Display
```
Backend Response → Frontend Chat → Source Component → User Interface
```

## Key Features

### 1. RAG Integration
- **Primary**: Knowledge base search for legal context
- **Fallback**: Internet-based GPT when KB unavailable
- **Seamless**: User experience remains consistent

### 2. Source Attribution
- **Display**: Shows up to 3 most relevant sources
- **Information**: Title, citation, type, summary
- **Visual**: Clear indication of KB vs internet sources

### 3. Admin Management
- **Dashboard**: Statistics and system status
- **Access**: Admin-only features and controls
- **Integration**: Direct links to law-entry-extension

### 4. Error Handling
- **Graceful**: Automatic fallback on KB errors
- **Logging**: Comprehensive error tracking
- **User Experience**: No interruption in chat flow

## Security

### 1. Authentication
- **JWT**: Required for all KB operations
- **Admin Access**: Role-based access control
- **Token Validation**: Automatic token verification

### 2. Access Control
- **Admin Only**: KB management features
- **User Access**: Chat functionality for all users
- **API Security**: Secure communication with law-entry-extension

## Deployment

### 1. Backend Deployment
- **Dependencies**: No additional dependencies required
- **Configuration**: Set environment variables
- **Health Check**: `/api/knowledge-base/health` endpoint

### 2. Frontend Deployment
- **Build**: Standard React build process
- **Routing**: New admin routes added
- **Assets**: No additional assets required

### 3. Law Entry Extension
- **Deployment**: Separate system (law-entry-extension-reference)
- **API**: Must be accessible from Civilify backend
- **Database**: PostgreSQL with pgvector extension

## Testing

### 1. Backend Testing
```bash
# Health check
curl -X GET http://localhost:8081/api/knowledge-base/health

# Chat test
curl -X POST http://localhost:8081/api/knowledge-base/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Rule 114 Section 20?", "mode": "GLI"}'
```

### 2. Frontend Testing
- **Chat Interface**: Test KB source display
- **Admin Panel**: Verify admin-only access
- **Error Handling**: Test fallback scenarios

## Monitoring

### 1. Health Monitoring
- **Endpoint**: `/api/knowledge-base/health`
- **Metrics**: Response time, error rate, availability
- **Alerts**: Configure monitoring for KB service

### 2. Usage Analytics
- **KB Usage**: Track KB vs GPT usage
- **Source Quality**: Monitor source relevance
- **User Engagement**: Track source click-through rates

## Troubleshooting

### 1. Common Issues
- **KB Unavailable**: Automatic fallback to GPT
- **Authentication**: Check JWT token validity
- **Network**: Verify law-entry-extension connectivity

### 2. Debug Information
- **Logs**: Check backend logs for KB service errors
- **Network**: Monitor API calls to law-entry-extension
- **Response**: Verify source data in chat responses

## Future Enhancements

### 1. Planned Features
- **Source Click-through**: Direct links to KB entries
- **Feedback System**: User feedback on source relevance
- **Analytics Dashboard**: Detailed usage statistics
- **Batch Operations**: Bulk KB operations for admins

### 2. Performance Optimizations
- **Caching**: Cache frequent KB queries
- **Async Processing**: Background KB updates
- **Load Balancing**: Multiple KB service instances

## Conclusion

The knowledge base integration successfully enhances Villy's capabilities by providing legal context from a curated knowledge base while maintaining the existing user experience. The system is designed for reliability, security, and scalability, with comprehensive error handling and monitoring capabilities.

The implementation follows the RAG pattern described in the integration guide, providing users with more accurate and contextually relevant legal information while maintaining the flexibility of internet-based responses when needed.

