# Civilify Backend Environment Variables Setup

## Overview

This document explains how environment variables are set up for the Civilify backend application to protect sensitive information when pushing to GitHub.

## How It Works

1. We use the `spring-dotenv` library to load environment variables from a `.env` file at runtime.
2. Sensitive configuration values are read from environment variables with fallback values.
3. The `.env` file is added to `.gitignore` so it's not committed to the repository.
4. A `.env.example` file is provided as a template for developers.

## Setup Instructions

### For Development

1. Copy `.env.example` to `.env` in the backend directory:
   ```
   copy .env.example .env
   ```

2. Open the `.env` file and replace the placeholder values with your actual secret keys and configuration values.

3. Start the application normally - Spring Boot will automatically load the environment variables from the `.env` file.

### For Production

In production environments, you should set environment variables through your deployment platform rather than using a `.env` file. This provides better security and follows best practices.

## How to Add New Environment Variables

1. Add the variable to `.env.example` with a placeholder value.
2. Add the variable to your local `.env` file with the actual value.
3. Use the variable in `application.properties` using the syntax: `${VARIABLE_NAME:default_value}`

## Current Environment Variables

The following environment variables are currently used:

### Firebase Configuration
- `FIREBASE_DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_API_KEY`

### CORS Configuration
- `CORS_ALLOWED_ORIGINS`
- `CORS_ALLOWED_METHODS`
- `CORS_ALLOWED_HEADERS`
- `CORS_ALLOW_CREDENTIALS`

### Cloudinary Configuration
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_PRESET`

### Google OAuth2 Configuration
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### JWT Configuration
- `JWT_SECRET`
- `JWT_EXPIRATION`

### OpenAI Configuration
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
