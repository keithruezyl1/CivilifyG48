# Civilify Backend API Documentation

This document provides comprehensive information about the Civilify backend API endpoints, request/response formats, authentication requirements, and error handling.

## Base URL

The base URL for all API endpoints is configured via environment variables for flexibility across different deployment environments.

Default: `http://localhost:8081`

## Authentication

Most endpoints require authentication using JWT (JSON Web Token).

**Token Format**: `Bearer {token}`

The token must be included in the `Authorization` header for protected endpoints.

**Token Lifetime**: Tokens are valid for 7 days by default.

**Authentication Response**: When authenticating, the API returns the token, expiration date, and authentication status along with user data.

## Error Responses

Error responses generally follow this format:

```json
{
  "error": "Error message description",
  "message": "Additional error details (optional)"
}
```

Or for endpoints using the ApiResponse wrapper:

```json
{
  "result": "ERROR",
  "message": "Error description",
  "data": null
}
```

## API Endpoints

### Health Check Endpoint (`/health`)

#### Check Backend Health

- **URL**: `/health`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Checks if the backend is running and reachable

- **Success Response**:
  - **Code**: 200 OK
  - **Content**: `{ "status": "UP", "timestamp": "2023-05-26T11:35:36Z" }`

### Debug Controller (`/api/debug`)

#### Request Information

- **URL**: `/api/debug/request-info`
- **Method**: `GET`
- **Auth Required**: No (but will show authentication info if provided)
- **Description**: Returns detailed information about the HTTP request, authentication status, and server configuration

- **Success Response**:
  - **Code**: 200 OK
  - **Content**: JSON object with headers, authentication status, and server configuration

#### Validate Token

- **URL**: `/api/debug/validate-token`
- **Method**: `GET`
- **Auth Required**: No
- **Parameters**:
  - `token`: JWT token to validate (without "Bearer " prefix)
- **Description**: Validates a JWT token and returns its details

- **Success Response**:
  - **Code**: 200 OK
  - **Content**: JSON object with token validity information

### Auth Controller (`/api/auth`)

#### Sign In

- **URL**: `/api/auth/signin`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Authenticates user with email and password
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **Success Response**:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "email": "user@example.com",
    "username": "username",
    "profile_picture_url": "https://example.com/profile.jpg"
    // other user details
  }
}
```

#### Forgot Password

- **URL**: `/api/auth/forgot-password`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Sends password reset email
- **Request Body**:

```json
{
  "email": "user@example.com"
}
```

- **Success Response**:

```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

#### Test Endpoint

- **URL**: `/api/auth/test`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Test endpoint to verify API is working
- **Success Response**:

```json
{
  "success": true,
  "message": "Test endpoint is working"
}
```

#### Google Authentication

- **URL**: `/api/auth/google`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Authenticates user with Google ID token
- **Request Body**:

```json
{
  "token": "GOOGLE_ID_TOKEN"
}
```

- **Success Response**:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "email": "user@example.com",
    "username": "username",
    "profile_picture_url": "https://example.com/profile.jpg"
    // other user details
  }
}
```

### OpenAI Controller (`/api/ai`)

#### Generate Chat Response

- **URL**: `/api/ai/chat`
- **Method**: `POST`
- **Auth Required**: No (but user identification is required in the request body)
- **Description**: Generates an AI response based on user message and conversation history
- **Request Body**:

```json
{
  "message": "User's message text",
  "mode": "A",  // A for General Legal Information, B for Case Plausibility Assessment
  "conversationId": "existing-conversation-id",  // Optional, if continuing a conversation
  "userId": "user-id",  // User's ID for tracking conversation
  "userEmail": "user@example.com"  // User's email for tracking conversation
}
```

- **Success Response**:

```json
{
  "response": "AI generated response text",
  "conversationId": "conversation-id",
  "success": true,
  "plausibilityLabel": "Highly Likely",  // Only for mode B
  "plausibilitySummary": "Summary text",  // Only for mode B
  "isReport": true  // Only for mode B
}
```

- **Error Response**:

```json
{
  "success": false,
  "error": "Error message"
}
```

#### Delete Previous Conversations

- **URL**: `/api/ai/delete-previous-conversations`
- **Method**: `POST`
- **Auth Required**: No (but user email is required in the request body)
- **Description**: Deletes all previous conversations for a user to maintain confidentiality when starting a new chat
- **Request Body**:

```json
{
  "userEmail": "user@example.com"  // User's email to identify conversations to delete
}
```

- **Success Response**:

```json
{
  "success": true,
  "message": "Successfully deleted all previous conversations",
  "deletedCount": 5  // Number of conversations deleted
}
```

- **Error Response**:

```json
{
  "success": false,
  "error": "Error message"
}
```

### User Controller (`/api/users`)

#### Register User

- **URL**: `/api/users/register`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Auth Required**: No
- **Description**: Registers a new user
- **Request Parameters**:
  - `email`: User's email
  - `password`: User's password
  - `username`: User's username
  - `profilePicture` (optional): Profile picture file

- **Success Response**:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "userId": "USER_ID",
    "email": "user@example.com",
    "username": "username",
    "profile_picture_url": "https://example.com/profile.jpg"
  }
}
```

#### Get User Profile Picture

- **URL**: `/api/users/{uid}/profile-picture`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Gets a user's profile picture URL
- **URL Parameters**:
  - `uid`: User ID

- **Success Response**:

```json
{
  "profile_picture_url": "https://example.com/profile.jpg"
}
```

#### User Login

- **URL**: `/api/users/login`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Authenticates user with email and password
- **Request Parameters**:
  - `email`: User's email
  - `password`: User's password

- **Success Response**:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "email": "user@example.com",
    "username": "username",
    "profile_picture_url": "https://example.com/profile.jpg"
    // other user details
  }
}
```

#### Get User By Email

- **URL**: `/api/users/email/{email}`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Gets user details by email
- **URL Parameters**:
  - `email`: User's email

- **Success Response**:

```json
{
  "email": "user@example.com",
  "username": "username",
  "profile_picture_url": "https://example.com/profile.jpg"
  // other user details
}
```

### OpenAI Controller (`/api/ai`)

#### Generate Chat Response

- **URL**: `/api/ai/chat`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Generates AI response for user message
- **Request Body**:

```json
{
  "message": "User message here",
  "mode": "A"  // A for General Info, B for Case Analysis (optional, defaults to A)
}
```

- **Success Response**:

```json
{
  "response": "AI-generated response text",
  "success": true
}
```

### Chat Controller (`/api/chat`)

#### Create Conversation

- **URL**: `/api/chat/conversations`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Creates a new chat conversation
- **Request Body**:

```json
{
  "userId": "USER_ID",
  "userEmail": "user@example.com",
  "title": "Conversation Title"
}
```

- **Success Response**:

```json
{
  "id": "CONVERSATION_ID",
  "title": "Conversation Title",
  "userEmail": "user@example.com",
  "userId": "USER_ID",
  "createdAt": "2023-05-26T04:10:54+08:00",
  "updatedAt": "2023-05-26T04:10:54+08:00",
  "status": "open",
  "adminId": null
}
```

#### Get User Conversations

- **URL**: `/api/chat/conversations/user/{email}`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Gets all conversations for a user
- **URL Parameters**:
  - `email`: User's email

- **Success Response**:

```json
[
  {
    "id": "CONVERSATION_ID",
    "title": "Conversation Title",
    "userEmail": "user@example.com",
    "userId": "USER_ID",
    "createdAt": "2023-05-26T04:10:54+08:00",
    "updatedAt": "2023-05-26T04:10:54+08:00",
    "status": "open",
    "adminId": null
  },
  // more conversations
]
```

#### Get Conversation

- **URL**: `/api/chat/conversations/{id}`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Gets a specific conversation
- **URL Parameters**:
  - `id`: Conversation ID

- **Success Response**:

```json
{
  "id": "CONVERSATION_ID",
  "title": "Conversation Title",
  "userEmail": "user@example.com",
  "userId": "USER_ID",
  "createdAt": "2023-05-26T04:10:54+08:00",
  "updatedAt": "2023-05-26T04:10:54+08:00",
  "status": "open",
  "adminId": null
}
```

#### Update Conversation

- **URL**: `/api/chat/conversations/{id}`
- **Method**: `PUT`
- **Auth Required**: No
- **Description**: Updates conversation details
- **URL Parameters**:
  - `id`: Conversation ID
- **Request Body**:

```json
{
  "id": "CONVERSATION_ID",
  "title": "Updated Title",
  "userEmail": "user@example.com",
  "userId": "USER_ID",
  "status": "open",
  "adminId": null
}
```

- **Success Response**:

```json
{
  "id": "CONVERSATION_ID",
  "title": "Updated Title",
  "userEmail": "user@example.com",
  "userId": "USER_ID",
  "createdAt": "2023-05-26T04:10:54+08:00",
  "updatedAt": "2023-05-26T04:10:54+08:00",
  "status": "open",
  "adminId": null
}
```

#### Add Message to Conversation

- **URL**: `/api/chat/conversations/{id}/messages`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Adds a message to a conversation
- **URL Parameters**:
  - `id`: Conversation ID
- **Request Body**:

```json
{
  "userId": "USER_ID",
  "userEmail": "user@example.com",
  "content": "Message content",
  "isUserMessage": true  // true for user message, false for AI message (optional, defaults to true)
}
```

- **Success Response**:

```json
{
  "id": "MESSAGE_ID",
  "conversationId": "CONVERSATION_ID",
  "userId": "USER_ID",
  "userEmail": "user@example.com",
  "content": "Message content",
  "userMessage": true,
  "timestamp": "2023-05-26T04:10:54+08:00"
}
```

#### Get Conversation Messages

- **URL**: `/api/chat/conversations/{id}/messages`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Gets all messages for a conversation
- **URL Parameters**:
  - `id`: Conversation ID

- **Success Response**:

```json
[
  {
    "id": "MESSAGE_ID",
    "conversationId": "CONVERSATION_ID",
    "userId": "USER_ID",
    "userEmail": "user@example.com",
    "content": "Message content",
    "userMessage": true,
    "timestamp": "2023-05-26T04:10:54+08:00"
  },
  // more messages
]
```

#### Assign Admin to Conversation

- **URL**: `/api/chat/conversations/{id}/assign`
- **Method**: `PUT`
- **Auth Required**: No
- **Description**: Assigns an admin to a conversation
- **URL Parameters**:
  - `id`: Conversation ID
- **Request Body**:

```json
{
  "adminId": "ADMIN_ID"
}
```

- **Success Response**:

```json
{
  "id": "CONVERSATION_ID",
  "title": "Conversation Title",
  "userEmail": "user@example.com",
  "userId": "USER_ID",
  "createdAt": "2023-05-26T04:10:54+08:00",
  "updatedAt": "2023-05-26T04:10:54+08:00",
  "status": "open",
  "adminId": "ADMIN_ID"
}
```

#### Update Conversation Status

- **URL**: `/api/chat/conversations/{id}/status`
- **Method**: `PUT`
- **Auth Required**: No
- **Description**: Updates the status of a conversation
- **URL Parameters**:
  - `id`: Conversation ID
- **Request Body**:

```json
{
  "status": "closed"  // possible values: open, closed, pending
}
```

- **Success Response**:

```json
{
  "id": "CONVERSATION_ID",
  "title": "Conversation Title",
  "userEmail": "user@example.com",
  "userId": "USER_ID",
  "createdAt": "2023-05-26T04:10:54+08:00",
  "updatedAt": "2023-05-26T04:10:54+08:00",
  "status": "closed",
  "adminId": "ADMIN_ID"
}
```

#### Get Admin Conversations

- **URL**: `/api/chat/conversations/admin/{id}`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Gets all conversations assigned to an admin
- **URL Parameters**:
  - `id`: Admin ID

- **Success Response**:

```json
[
  {
    "id": "CONVERSATION_ID",
    "title": "Conversation Title",
    "userEmail": "user@example.com",
    "userId": "USER_ID",
    "createdAt": "2023-05-26T04:10:54+08:00",
    "updatedAt": "2023-05-26T04:10:54+08:00",
    "status": "open",
    "adminId": "ADMIN_ID"
  },
  // more conversations
]
```

#### Get Conversations by Status

- **URL**: `/api/chat/conversations/status/{status}`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Gets all conversations with a specific status
- **URL Parameters**:
  - `status`: Status (open, closed, pending)

- **Success Response**:

```json
[
  {
    "id": "CONVERSATION_ID",
    "title": "Conversation Title",
    "userEmail": "user@example.com",
    "userId": "USER_ID",
    "createdAt": "2023-05-26T04:10:54+08:00",
    "updatedAt": "2023-05-26T04:10:54+08:00",
    "status": "open",
    "adminId": null
  },
  // more conversations
]
```

### Admin Controller (`/api/admin`)

#### Get All Users

- **URL**: `/api/admin/users`
- **Method**: `GET`
- **Auth Required**: Yes (ROLE_ADMIN required)
- **Description**: Retrieves all users from the system

- **Success Response**:

```json
{
  "result": "SUCCESS",
  "message": "Users retrieved successfully",
  "data": [
    {
      "userId": "USER_ID",
      "email": "user@example.com",
      "username": "Username",
      "profilePictureUrl": "https://example.com/profile.jpg",
      "role": "ROLE_USER"
    },
    // more users
  ]
}
```

#### Update User Role

- **URL**: `/api/admin/users/{userId}/role`
- **Method**: `PUT`
- **Auth Required**: Yes (ROLE_ADMIN required)
- **Description**: Updates a user's role
- **URL Parameters**:
  - `userId`: User ID
- **Request Body**:

```json
{
  "role": "ROLE_ADMIN"  // possible values: ROLE_USER, ROLE_ADMIN
}
```

- **Success Response**:

```json
{
  "result": "SUCCESS",
  "message": "User role updated successfully",
  "data": {
    "userId": "USER_ID",
    "email": "user@example.com",
    "username": "Username",
    "profilePictureUrl": "https://example.com/profile.jpg",
    "role": "ROLE_ADMIN"
  }
}
```

#### Delete User

- **URL**: `/api/admin/users/{userId}`
- **Method**: `DELETE`
- **Auth Required**: Yes (ROLE_ADMIN required)
- **Description**: Deletes a user from the system
- **URL Parameters**:
  - `userId`: User ID

- **Success Response**:

```json
{
  "result": "SUCCESS",
  "message": "User deleted successfully",
  "data": null
}
```

#### Setup Initial Admin

- **URL**: `/api/admin/setup-initial-admin`
- **Method**: `POST`
- **Auth Required**: Yes
- **Description**: Utility endpoint to set up an initial admin user
- **Query Parameters**:
  - `userEmail`: Email of the user to promote to admin

- **Success Response**:

```json
{
  "result": "SUCCESS",
  "message": "Admin role assigned successfully",
  "data": {
    "userId": "USER_ID",
    "email": "admin@example.com",
    "username": "AdminUser",
    "profilePictureUrl": "https://example.com/profile.jpg",
    "role": "ROLE_ADMIN"
  }
}
```

## CORS Configuration

The backend is configured to accept requests from multiple origins. The allowed origins are defined in the `cors.allowed-origins` property in the application configuration.

Default origins include:
- http://localhost:3000
- http://127.0.0.1:3000
- http://localhost:5173
- http://127.0.0.1:5173
- http://localhost:8081
- http://127.0.0.1:8081
- https://civilify-a9de6.firebaseio.com
- https://civilify-a9de6.firebaseapp.com
- https://civilify-a9de6.web.app

## Environment Variables

Key environment variables for the API include:

- `cors.allowed-origins`: Comma-separated list of allowed CORS origins
- Server port (default: 8081)
- Firebase credentials (stored in serviceAccountKey.json)

Note: The actual environment variable names may vary and would typically be defined in `application.properties` or `application.yml` files.
