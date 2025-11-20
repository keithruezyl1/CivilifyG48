# Knowledge Base Integration Setup Guide

## Overview

The Civilify application now includes knowledge base integration with the law-entry-extension-reference (Villy) system. This guide explains how to set up and configure the knowledge base functionality.

## Current Status

✅ **Backend Integration Complete**
- Knowledge base service implemented with proper error handling
- RAG (Retrieval-Augmented Generation) functionality ready
- Graceful fallback when Villy service is not available
- Admin-only access controls implemented

✅ **Frontend Integration Complete**
- Admin knowledge base management page
- Enhanced chat interface with source display
- Proper authentication and authorization

## Configuration Options

### Option 1: Use with Villy Service (Recommended)

To use the full RAG functionality, you need to run the Villy service (law-entry-extension-reference):

1. **Start the Villy Service**:
   ```bash
   # Navigate to the law-entry-extension-reference directory
   cd law-entry-extension-reference/server
   
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your database and API keys
   
   # Start the service
   npm start
   ```

2. **Configure Civilify Backend**:
   ```properties
   # In application.properties or environment variables
   knowledge.base.enabled=true
   knowledge.base.api.url=http://localhost:10000/api
   knowledge.base.api.key=your-villy-jwt-token
   ```

3. **Test the Integration**:
   - The chat will now use RAG-first approach
   - Villy responses will include legal context and sources
   - Falls back to regular GPT if no relevant context found

### Option 2: Use Without Villy Service (Current Default)

The application is configured to work without the Villy service:

1. **Current Configuration**:
   ```properties
   knowledge.base.enabled=false
   ```

2. **Behavior**:
   - Chat uses regular GPT responses
   - No knowledge base errors in logs
   - All existing functionality preserved

## Environment Variables

### Backend Configuration

```properties
# Knowledge Base Settings
KNOWLEDGE_BASE_ENABLED=false                    # Set to true to enable Villy integration
KNOWLEDGE_BASE_API_URL=http://localhost:10000/api  # Villy service URL
KNOWLEDGE_BASE_API_KEY=your-jwt-token           # JWT token for Villy authentication
KNOWLEDGE_BASE_TIMEOUT=30000                    # Request timeout in milliseconds
KNOWLEDGE_BASE_RETRY_ATTEMPTS=3                 # Number of retry attempts
KNOWLEDGE_BASE_RETRY_DELAY=1000                 # Delay between retries in milliseconds
```

### Frontend Configuration

```env
# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:8081         # Backend API URL
```

## API Endpoints

### Knowledge Base Endpoints (Admin Only)

- `POST /api/knowledge-base/chat` - Chat with knowledge base using RAG
- `POST /api/knowledge-base/search` - Search knowledge base entries
- `GET /api/knowledge-base/entry/{entryId}` - Get specific entry
- `GET /api/knowledge-base/health` - Check knowledge base health

### Enhanced Chat Endpoint

- `POST /api/ai/chat` - Enhanced chat with RAG integration
  - Uses knowledge base first, falls back to GPT
  - Returns sources when available
  - Includes knowledge base context flag

## Admin Features

### Knowledge Base Management Page

Access: `/admin/knowledge-base` (Admin users only)

Features:
- Health status monitoring
- Statistics dashboard
- Search functionality
- Entry management links

### Admin Access Control

- Only users with `role: 'admin'` or `isAdmin: true` can access
- JWT authentication required
- Automatic redirect for non-admin users

## Error Handling

### Connection Failures

The system gracefully handles Villy service unavailability:

```
WARN: Knowledge base service is not available (connection refused). 
This is expected if the Villy service is not running. 
Falling back to empty results.
```

### Fallback Behavior

1. **Knowledge Base Unavailable**: Falls back to regular GPT responses
2. **No Relevant Context**: Uses internet-based GPT with existing prompts
3. **Authentication Issues**: Logs error and continues with fallback

## Testing the Integration

### 1. Test Without Villy Service

```bash
# Start the backend
cd backend
mvn spring-boot:run

# The application should start without errors
# Chat will use regular GPT responses
```

### 2. Test With Villy Service

```bash
# Start Villy service first
cd law-entry-extension-reference/server
npm start

# Start Civilify backend
cd ../../backend
mvn spring-boot:run

# Enable knowledge base in application.properties
knowledge.base.enabled=true
```

### 3. Test Admin Features

1. Login as admin user
2. Navigate to `/admin/knowledge-base`
3. Check health status and statistics
4. Test search functionality

## Troubleshooting

### Common Issues

1. **Connection Refused Errors**:
   - Ensure Villy service is running on port 10000
   - Check firewall settings
   - Verify URL configuration

2. **Authentication Errors**:
   - Verify JWT token is valid
   - Check API key configuration
   - Ensure proper authorization headers

3. **Frontend Import Errors**:
   - Clear browser cache
   - Restart development server
   - Check console for specific errors

### Logs to Monitor

```bash
# Backend logs
tail -f logs/application.log | grep -i "knowledge"

# Look for these log messages:
# - "Knowledge base is disabled" (expected when disabled)
# - "Knowledge base service is not available" (expected when Villy not running)
# - "Found relevant knowledge base context" (successful RAG)
```

## Next Steps

1. **Enable Knowledge Base**: Set `knowledge.base.enabled=true` when Villy is ready
2. **Configure Authentication**: Set up JWT tokens for Villy service
3. **Test RAG Functionality**: Verify legal context is being retrieved
4. **Monitor Performance**: Check response times and accuracy
5. **Admin Training**: Train admin users on knowledge base management

## Support

For issues with:
- **Villy Service**: Check law-entry-extension-reference documentation
- **Civilify Integration**: Review this guide and error logs
- **Database Issues**: Verify PostgreSQL and pgvector setup
- **Authentication**: Check JWT configuration and tokens

