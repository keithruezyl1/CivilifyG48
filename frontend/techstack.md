# Civilify Frontend Tech Stack

## Frameworks & Libraries
- **React 18**: Main UI library for building user interfaces.
- **React Router DOM 7**: Client-side routing and navigation.
- **React Icons**: Icon library for UI icons.
- **React Toastify**: Toast notifications for user feedback.
- **React Markdown**: Rendering markdown in chat and documents.

## Build Tools & Configuration
- **Vite**: Fast development server and build tool.
- **@vitejs/plugin-react-swc**: React plugin for Vite with SWC for fast builds.
- **ESLint**: Linting and code quality.
- **Tailwind CSS**: Utility-first CSS framework (configured but not heavily used in all components).
- **PostCSS & Autoprefixer**: CSS processing and vendor prefixing.

## State & Data Management
- **React useState/useEffect**: Local state and side effects.
- **LocalStorage**: For persisting user session, tokens, and preferences.

## Authentication & Security
- **Custom JWT Auth**: Handles tokens, validation, and session management.
- **Firebase Auth**: Used for authentication and user management.
- **ProtectedRoute Component**: Guards routes for authenticated users.

## Backend/API Integration
- **Axios**: HTTP client for API requests.
- **Custom Axios Instances**: With interceptors for auth and error handling.
- **OpenAI GPT-4/3.5**: Backend integration for AI-powered legal chat and analysis.
- **Cloudinary React**: For profile picture uploads and image management.

## Realtime & Storage
- **Firebase Firestore**: For chat conversations, messages, and user profiles.

## Project Structure
- **/src/pages**: All main pages (chat, admin, signin, signup, profile, etc.)
- **/src/components**: Reusable UI components (avatars, report cards, protected routes, etc.)
- **/src/utils**: Utility functions for auth, API, and backend health checks.
- **/src/assets**: Images and static assets.

## Other
- **Custom CSS**: For layout, theming, and UI polish.
- **Favicon**: Uses favicon.ico for browser tab icon.
- **Villy**: Custom AI assistant persona for legal chat.

---

**Note:**
- The backend is assumed to be a separate service (Flask, Node, or Java Spring) providing REST APIs and OpenAI integration.
- The frontend is designed for extensibility and modern best practices. 