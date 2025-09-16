# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the OpenSport application.

## Overview

The application now uses Google OAuth for secure authentication with the following features:
- Domain-restricted email authentication
- Session-based authentication with cookies
- 7-day session persistence
- Automatic user registration on first login
- JWT token support for backward compatibility

## Google Cloud Console Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

### 2. Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (or "Internal" if using Google Workspace)
3. Fill in the required information:
   - App name: OpenSport
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `openid`, `profile`, `email`
5. Add test users (if using external type)

### 3. Create OAuth Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure:
   - Name: OpenSport Web Client
   - Authorized JavaScript origins: `http://localhost:3000`, `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`
5. Note down the Client ID and Client Secret

## Environment Configuration

### Backend (.env)

Create or update your `.env` file in the root directory:

```env
# Backend Environment Variables
MONGODB_URI=mongodb://localhost:27017
DB_NAME=opensport
JWT_SECRET=your-very-secure-jwt-secret-key-change-in-production
PORT=8080

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-from-console
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-console
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/callback
ALLOWED_EMAIL_DOMAIN=yourdomain.com

# Frontend Environment Variables
VITE_API_URL=http://localhost:8080
```

### Frontend (.env)

Create `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id-from-console
```

## Domain Configuration

The `ALLOWED_EMAIL_DOMAIN` environment variable restricts which email domains can register and login:

- Set to your organization's domain (e.g., `company.com`)
- Leave empty to allow all Google accounts
- Only users with emails from this domain can access the application

## Database Changes

The User model has been updated to support Google OAuth:

### New Fields:
- `google_id`: Google user ID
- `picture`: User's Google profile picture URL

### Removed Fields:
- `password`: No longer needed for OAuth authentication

### Migration

Existing users will need to:
1. Sign in using Google OAuth
2. Their accounts will be automatically updated with Google ID

## API Endpoints

### New Endpoints:
- `GET /api/auth/google` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - Handles OAuth callback
- `POST /api/auth/logout` - Logs out user and clears session

### Updated Endpoints:
- `POST /api/auth/login` - Now redirects to Google OAuth
- `POST /api/auth/register` - Now redirects to Google OAuth

## Session Management

The application now uses two authentication methods:

1. **Session Cookies** (Primary):
   - HttpOnly cookies for security
   - 7-day expiration
   - Automatic cleanup of expired sessions

2. **JWT Tokens** (Backward compatibility):
   - Still generated for API compatibility
   - 24-hour expiration

## Frontend Changes

### Login/Register Pages:
- Replaced email/password forms with Google OAuth buttons
- Clear messaging about domain restrictions
- Modern Google-style design

### OAuth Flow:
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. After consent, redirected to `/auth/callback`
4. Backend processes OAuth callback
5. User authenticated and redirected to dashboard

## Testing

### Manual Testing:

1. Start MongoDB
2. Set up environment variables
3. Start backend: `go run ./backend/cmd`
4. Start frontend: `cd frontend && npm run dev`
5. Navigate to `http://localhost:5173/login`
6. Click "Sign in with Google"

### Domain Restriction Testing:

1. Set `ALLOWED_EMAIL_DOMAIN=example.com`
2. Try logging in with different email domains
3. Only `@example.com` emails should be allowed

## Troubleshooting

### Common Issues:

1. **"OAuth error: access_denied"**
   - User denied consent or cancelled login
   - Solution: Try again

2. **"Email domain not allowed"**
   - User's email domain doesn't match `ALLOWED_EMAIL_DOMAIN`
   - Solution: Update domain setting or contact admin

3. **"Invalid state parameter"**
   - Security check failed
   - Solution: Clear browser cookies and try again

### Production Deployment:

1. Update redirect URLs in Google Console
2. Use HTTPS for production
3. Set secure environment variables
4. Enable proper CORS settings
5. Use production MongoDB instance

## Security Considerations

1. **HTTPS Required**: Google OAuth requires HTTPS in production
2. **Domain Validation**: Always set `ALLOWED_EMAIL_DOMAIN` in production
3. **Session Security**: Sessions are HttpOnly and secure
4. **State Parameter**: CSRF protection for OAuth flow
5. **Token Expiration**: Regular cleanup of expired sessions

## Migration from Password Authentication

For existing applications with password-based auth:

1. Deploy OAuth changes
2. Users will be prompted to use Google OAuth
3. Existing accounts are automatically linked on first OAuth login
4. Old password endpoints remain for backward compatibility but redirect to OAuth