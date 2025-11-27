# Fresh Authentication Implementation

## Overview

Complete fresh implementation of authentication using:
- **AWS Cognito** for user authentication (credentials from `.env`)
- **NextAuth** for session management
- **Simple, clean flow** - no complex workarounds

## Architecture

```
User Form → NextAuth signIn() → CredentialsProvider → Cognito → Database → Session
```

## Flow

1. **User submits form** (`/auth/signin`)
2. **NextAuth signIn()** called with email/password
3. **CredentialsProvider.authorize()** runs:
   - Authenticates with Cognito (SDK or Direct HTTP)
   - Gets user info from Cognito
   - Syncs with database
   - Checks permissions
   - Returns user object
4. **NextAuth creates session** (JWT)
5. **User redirected** to dashboard

## Configuration

### Required Environment Variables

```env
# Cognito Configuration
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=af-south-1

# Optional
COGNITO_CLIENT_SECRET=your-client-secret  # If using SDK
USE_COGNITO_SDK=true  # Use SDK (default if CLIENT_SECRET exists)

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Timeouts (optional, for slow networks)
COGNITO_FETCH_TIMEOUT_MS=30000
COGNITO_FETCH_RETRIES=5
```

## Files

### Core Files

1. **`lib/auth.ts`** - NextAuth configuration
   - CredentialsProvider with Cognito authentication
   - JWT and session callbacks
   - Clean, simple implementation

2. **`app/auth/signin/page.tsx`** - Sign-in form
   - Calls NextAuth `signIn()` directly
   - Handles errors and success

3. **`app/api/auth/[...nextauth]/route.ts`** - NextAuth API route
   - Handles all NextAuth endpoints

### Supporting Files

- `lib/cognito-sdk.ts` - AWS SDK authentication
- `lib/cognito-direct.ts` - Direct HTTP authentication
- `lib/prisma.ts` - Database client

## Features

1. **Automatic Fallback**
   - Tries SDK first (if configured)
   - Falls back to Direct HTTP if SDK fails
   - Handles network issues gracefully

2. **User Management**
   - Auto-creates users in database
   - Syncs Cognito data with database
   - Checks permissions before login

3. **Error Handling**
   - Clear error messages
   - Handles Cognito-specific errors
   - Network timeout handling

4. **Session Management**
   - JWT-based sessions
   - 30-day session duration
   - Secure cookies in production

## Usage

### Sign In

```typescript
import { signIn } from "next-auth/react";

const result = await signIn("cognito", {
  email: "user@example.com",
  password: "password123",
  redirect: false,
});
```

### Check Session

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
```

### Protect Routes

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  return <div>Protected Content</div>;
}
```

## Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to sign-in:**
   ```
   http://localhost:3000/auth/signin
   ```

3. **Enter credentials:**
   - Email: from Cognito
   - Password: from Cognito

4. **Check session:**
   - Should redirect to `/dashboard`
   - Session should be created

## Troubleshooting

### Timeout Errors

If you get timeout errors:
1. Set `USE_COGNITO_SDK=false` to use Direct HTTP
2. Increase `COGNITO_FETCH_TIMEOUT_MS=60000`
3. Increase `COGNITO_FETCH_RETRIES=5`

### Invalid Credentials

- Verify credentials in `.env`
- Check Cognito User Pool settings
- Ensure `USER_PASSWORD_AUTH` flow is enabled

### Permission Errors

- Check user `canLogin` flag in database
- Verify user `status` is `ACTIVE`
- Check user `role` permissions

## Clean Implementation

This is a **fresh, clean implementation** with:
- ✅ No workarounds
- ✅ No special markers
- ✅ Simple flow
- ✅ Clear error handling
- ✅ Proper NextAuth integration

