# 🔧 PWA Service Worker Fix for Cognito Authentication

## Problem

After adding PWA support, login authentication started failing with timeout errors. The root cause was the **service worker intercepting all fetch requests**, including external API calls to AWS Cognito.

## Root Cause

The service worker in `public/sw.js` was:
1. Intercepting ALL fetch requests (including external APIs)
2. Trying to cache external requests to AWS Cognito
3. Causing timeouts because service workers can't properly handle external API calls

## Solution

Updated the service worker to:
1. **Skip external requests** - Only handle same-origin requests
2. **Skip sensitive API routes** - Don't intercept auth or dynamic API calls
3. **Let external APIs pass through** - AWS Cognito and other external services bypass the service worker

## Changes Made

### File: `public/sw.js`

Added checks to skip:
- External URLs (different origin)
- Auth API routes (`/api/auth/*`)
- Dynamic API routes that shouldn't be cached

```javascript
// Skip external API calls (AWS Cognito, etc.)
const isExternal = url.origin !== self.location.origin;
if (isExternal) {
  return; // Let external requests pass through
}

// Skip API routes that shouldn't be cached
if (url.pathname.startsWith('/api/auth/') || ...) {
  return; // Let these pass through
}
```

## Testing

1. **Clear service worker cache:**
   - Open browser DevTools → Application → Service Workers
   - Click "Unregister" for the service worker
   - Clear cache storage

2. **Test login:**
   ```bash
   npx tsx scripts/debug-signin.ts mrhoseah@gmail.com "@@H5210h1..."
   ```

3. **Verify in browser:**
   - Open DevTools → Network tab
   - Check that Cognito requests are NOT going through service worker
   - Login should work normally

## Important Notes

- Service workers only run in **production mode** (`NODE_ENV === "production"`)
- In development, the service worker is not registered, so this issue only affects production builds
- The fix ensures external APIs always bypass the service worker

## Related Files

- `public/sw.js` - Service worker (updated)
- `app/sw-register.tsx` - Service worker registration
- `lib/cognito-sdk.ts` - AWS SDK authentication
- `lib/cognito-direct.ts` - Direct HTTP authentication

