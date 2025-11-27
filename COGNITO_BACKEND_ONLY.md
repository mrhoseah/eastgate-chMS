# Cognito Backend-Only Authentication

## Overview

This application uses **backend-only authentication** with AWS Cognito. There is **no Hosted UI or OAuth callbacks** - all authentication happens server-side using the `USER_PASSWORD_AUTH` flow.

## Architecture

### Authentication Flow

```
User → Frontend Form → NextAuth API → Backend Cognito Auth → Database → Session
```

1. **User submits credentials** on the sign-in page
2. **NextAuth CredentialsProvider** receives email/password
3. **Backend authenticates** with Cognito using `USER_PASSWORD_AUTH` flow
4. **User data synced** with database
5. **Session created** via NextAuth JWT

### No Hosted UI

- ❌ No Cognito Hosted UI
- ❌ No OAuth/OIDC redirects
- ❌ No callback URLs to configure
- ✅ Direct server-side authentication only

## Implementation

### Provider Configuration

Only one provider is configured:

```typescript
CredentialsProvider({
  id: "cognito-credentials",
  name: "Cognito",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    // Backend authentication with Cognito
    // Uses USER_PASSWORD_AUTH flow
  }
})
```

### Authentication Methods

The backend supports two methods (configurable via environment):

1. **AWS SDK** (default when `COGNITO_CLIENT_SECRET` is set)
   - Uses `@aws-sdk/client-cognito-identity-provider`
   - Better error handling and retries
   - Recommended for production

2. **Direct HTTP** (fallback)
   - Direct HTTP calls to Cognito REST API
   - No AWS SDK dependencies
   - Useful for debugging or when SDK has issues

### Configuration

```env
# Cognito Configuration
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret  # Optional but recommended
COGNITO_REGION=af-south-1

# Method Selection
USE_COGNITO_SDK=true  # Use AWS SDK (default if CLIENT_SECRET is set)
# or
USE_COGNITO_SDK=false  # Use Direct HTTP

# Timeout Configuration (for Direct HTTP)
COGNITO_FETCH_TIMEOUT_MS=30000  # 30 seconds
COGNITO_FETCH_RETRIES=5  # Number of retries
```

## Required Cognito Settings

### App Client Configuration

1. **Enable USER_PASSWORD_AUTH flow:**
   - Go to Cognito Console → User Pool → App Integration
   - Select your app client
   - Edit "Authentication flows configuration"
   - ✅ Enable **ALLOW_USER_PASSWORD_AUTH**
   - ✅ Enable **ALLOW_REFRESH_TOKEN_AUTH** (recommended)

2. **No Callback URLs needed:**
   - Since we're not using Hosted UI, no callback URLs need to be configured
   - No OAuth settings required

3. **Client Secret (optional but recommended):**
   - If using client secret, ensure it's configured
   - Used for SECRET_HASH computation

## Benefits

1. **Simpler Setup:**
   - No callback URL configuration
   - No OAuth redirect handling
   - No Hosted UI dependencies

2. **Better Security:**
   - Credentials never leave the server
   - No client-side token handling
   - Server-side session management

3. **More Control:**
   - Custom error handling
   - Database synchronization
   - Permission checks

4. **Easier Debugging:**
   - All authentication logic in one place
   - Clear error messages
   - Server-side logging

## Files

- `lib/auth.ts` - NextAuth configuration (CredentialsProvider only)
- `lib/cognito-sdk.ts` - AWS SDK authentication
- `lib/cognito-direct.ts` - Direct HTTP authentication
- `app/auth/signin/page.tsx` - Sign-in form

## Migration Notes

If you previously had Hosted UI configured:

1. ✅ **Removed:** `CognitoProvider` from NextAuth
2. ✅ **Kept:** `CredentialsProvider` for backend auth
3. ✅ **No changes needed:** Cognito app client settings (just ensure USER_PASSWORD_AUTH is enabled)
4. ✅ **No callback URLs:** Can be removed from Cognito console

## Testing

Test authentication:

```bash
# Test with debug script
npx tsx scripts/debug-signin.ts email@example.com "password"

# Test via web UI
# Navigate to /auth/signin
# Enter credentials
# Check server logs for authentication flow
```

