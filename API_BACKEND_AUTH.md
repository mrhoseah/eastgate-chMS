# API Backend Authentication Architecture

## Overview

This application uses a **traditional REST API approach** for authentication, where:

1. **Frontend calls backend API** (`/api/auth/signin`)
2. **Backend API handles Cognito authentication** (like any backend service)
3. **NextAuth manages sessions** after successful authentication

This is a hybrid approach combining:
- **REST API** for authentication logic (Cognito)
- **NextAuth** for session management (JWT, cookies)

## Architecture Flow

```
┌─────────────┐
│   Frontend  │
│  Sign-in    │
│    Form     │
└──────┬──────┘
       │ POST /api/auth/signin
       │ { email, password }
       ▼
┌─────────────────────┐
│  Backend API Route  │
│ /api/auth/signin    │
│                     │
│ 1. Authenticate     │
│    with Cognito     │
│ 2. Get user data    │
│ 3. Check permissions│
│ 4. Return user      │
└──────┬──────────────┘
       │ { success, user }
       ▼
┌─────────────────────┐
│   Frontend          │
│                     │
│ Create NextAuth     │
│ session             │
└──────┬──────────────┘
       │ signIn("cognito-credentials")
       ▼
┌─────────────────────┐
│  NextAuth           │
│ CredentialsProvider │
│                     │
│ (Skip Cognito -     │
│  already done)      │
│ Create JWT session  │
└─────────────────────┘
```

## Implementation Details

### 1. Backend API Route (`/api/auth/signin`)

**File:** `app/api/auth/signin/route.ts`

**Responsibilities:**
- Receives email/password from frontend
- Authenticates with AWS Cognito (SDK or Direct HTTP)
- Retrieves user attributes from Cognito
- Syncs user data with database
- Checks login permissions
- Returns user data on success

**Response Format:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "image": "profile-image-url",
    "role": "ADMIN"
  }
}
```

**Error Responses:**
- `400` - Missing email/password
- `401` - Invalid credentials
- `403` - Permission denied
- `503` - Network error

### 2. Frontend Sign-in (`/auth/signin`)

**File:** `app/auth/signin/page.tsx`

**Flow:**
1. User submits form
2. Calls `POST /api/auth/signin` with credentials
3. If successful, creates NextAuth session
4. Redirects to dashboard

**Code:**
```typescript
// Step 1: Backend API authentication
const response = await fetch("/api/auth/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

// Step 2: Create NextAuth session
if (data.success) {
  await signIn("cognito-credentials", {
    email: data.user.email,
    password: "API_AUTHENTICATED", // Special marker
  });
}
```

### 3. NextAuth CredentialsProvider

**File:** `lib/auth.ts`

**Special Handling:**
- If password is `"API_AUTHENTICATED"`, skips Cognito authentication
- Fetches user from database directly
- Creates session with user data

**Normal Flow:**
- If password is not `"API_AUTHENTICATED"`, performs full Cognito authentication
- This allows direct NextAuth usage if needed

## Benefits

1. **Separation of Concerns:**
   - Authentication logic in API route
   - Session management in NextAuth
   - Clear boundaries

2. **Traditional Backend Pattern:**
   - Frontend calls API endpoint
   - API handles business logic
   - Returns structured response
   - Works like any REST API

3. **Flexibility:**
   - Can call API from any client (web, mobile, etc.)
   - API can be tested independently
   - Easy to add rate limiting, logging, etc.

4. **Error Handling:**
   - Structured error responses
   - Proper HTTP status codes
   - Clear error messages

## API Endpoints

### POST `/api/auth/signin`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "image": "profile-image-url",
    "role": "ADMIN"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

## Testing

### Test API Route Directly:

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Test via Frontend:

1. Navigate to `/auth/signin`
2. Enter credentials
3. Check browser network tab for API call
4. Verify session is created

## Error Handling

The API route handles various error scenarios:

1. **Cognito Errors:**
   - `NotAuthorizedException` → 401 Invalid credentials
   - `UserNotConfirmedException` → 403 Account not activated
   - Network errors → 503 Service unavailable

2. **Permission Errors:**
   - User can't login → 403 Permission denied
   - Account inactive → 403 Account status

3. **Database Errors:**
   - User not found → Created automatically
   - Database errors → 500 Internal server error

## Security Considerations

1. **Credentials:**
   - Never logged or exposed
   - Only sent to backend API
   - Backend handles Cognito communication

2. **Tokens:**
   - Cognito tokens handled server-side
   - Not exposed to frontend
   - NextAuth manages session tokens

3. **Session:**
   - JWT-based sessions
   - Secure cookies
   - Server-side validation

## Migration Notes

This approach replaces the previous NextAuth-only flow:

**Before:**
- Frontend → NextAuth → CredentialsProvider → Cognito

**After:**
- Frontend → API Route → Cognito → NextAuth Session

The API route acts as a traditional backend service, making it easier to:
- Add rate limiting
- Add logging
- Add monitoring
- Support multiple clients
- Test independently

