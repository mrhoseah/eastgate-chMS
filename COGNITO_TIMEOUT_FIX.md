# Cognito Timeout Fix

## Problem

Getting `Cognito SDK InitiateAuth error: TimeoutError` even with correct credentials.

## Root Cause

Network connectivity issues in WSL2 environment causing timeouts when connecting to AWS Cognito.

## Solutions Applied

### 1. Automatic Fallback Mechanism

The API route now automatically falls back to Direct HTTP if SDK fails:

```typescript
// Try SDK first
try {
  cognitoResponse = await signInWithCognitoSdk(email, password);
} catch (error) {
  // Automatically fallback to Direct HTTP
  cognitoResponse = await signInWithCognitoDirect(email, password);
}
```

### 2. Increased Timeouts

**Direct HTTP:**
- Default timeout: `30000ms` (30 seconds) - increased from 8s
- Default retries: `5` - increased from 2

**AWS SDK:**
- Default timeout: `60000ms` (60 seconds) - increased from 30s
- Default retries: `5` - increased from 2

### 3. Environment Variables

You can configure timeouts in `.env`:

```env
# Increase timeout for slow networks
COGNITO_FETCH_TIMEOUT_MS=60000  # 60 seconds

# Increase retries
COGNITO_FETCH_RETRIES=5

# Force Direct HTTP (if SDK keeps timing out)
USE_COGNITO_SDK=false
```

### 4. Better Error Messages

Timeout errors now provide helpful messages:
- Clear indication it's a network issue
- Suggestion to check internet connection
- Contact administrator if persists

## Recommended Configuration

For WSL2 or slow networks, add to `.env`:

```env
# Use Direct HTTP (more reliable in WSL2)
USE_COGNITO_SDK=false

# Increase timeout
COGNITO_FETCH_TIMEOUT_MS=60000

# Increase retries
COGNITO_FETCH_RETRIES=5
```

## Testing

1. **Test with Direct HTTP:**
   ```bash
   USE_COGNITO_SDK=false npm run dev
   ```

2. **Test with increased timeout:**
   ```bash
   COGNITO_FETCH_TIMEOUT_MS=60000 npm run dev
   ```

3. **Test API directly:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"mrhoseah@gmail.com","password":"your-password"}'
   ```

## Why Direct HTTP May Work Better

1. **Simpler connection logic** - Less overhead than SDK
2. **Better timeout handling** - Custom retry logic with exponential backoff
3. **WSL2 compatibility** - Works better with WSL2 networking
4. **More control** - Can configure exactly how connections are made

## If Still Timing Out

1. **Check network connectivity:**
   ```bash
   curl -v https://cognito-idp.af-south-1.amazonaws.com/
   ```

2. **Check DNS:**
   ```bash
   getent hosts cognito-idp.af-south-1.amazonaws.com
   ```

3. **Try from different network** - May be firewall/proxy issue

4. **Use Direct HTTP only:**
   ```env
   USE_COGNITO_SDK=false
   ```

## Files Modified

- `app/api/auth/signin/route.ts` - Added fallback mechanism
- `lib/cognito-direct.ts` - Increased default timeouts
- `lib/cognito-sdk.ts` - Increased default timeouts and retries

