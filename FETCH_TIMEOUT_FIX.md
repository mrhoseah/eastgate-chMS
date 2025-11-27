# Fetch Timeout Error Fix

## Problem

Getting error: `fetchWithTimeout: failed after 6 attempt(s): fetch failed`

## Root Cause

Node.js `fetch()` API has issues in WSL2 environment:
- Cannot establish connections reliably
- Timeouts before connection completes
- DNS resolution issues
- IPv6/IPv4 conflicts

## Solution

**Replaced `fetch()` with Node.js native `https` module** which:
- ✅ Works reliably in WSL2
- ✅ Better timeout handling
- ✅ Forces IPv4 (avoids IPv6 issues)
- ✅ More detailed error reporting

## Changes Made

### 1. `lib/cognito-direct.ts` - `fetchWithTimeout()` function

**Before:**
- Used `fetch()` API with AbortController
- Default timeout: 8 seconds
- Default retries: 2

**After:**
- Uses Node.js native `https` module
- Default timeout: 30 seconds
- Default retries: 5
- Forces IPv4 (`family: 4`)
- Better error detection and reporting

### 2. `lib/auth.ts` - Error handling

Added specific handling for network/timeout errors:
- Detects timeout/network errors
- Provides clear error messages
- Suggests checking internet connection

## Key Improvements

1. **Native HTTPS Module:**
   ```typescript
   const https = require("https");
   const req = https.request({
     hostname: urlObj.hostname,
     port: 443,
     family: 4, // Force IPv4
     timeout: timeoutMs,
   });
   ```

2. **Better Error Detection:**
   - Detects `ETIMEDOUT`, `ECONNRESET`, `ENOTFOUND`, `EAI_AGAIN`
   - Provides detailed error messages
   - Includes error codes in logs

3. **Improved Retry Logic:**
   - Slower backoff growth (1.5x instead of 2x)
   - Max wait time: 5 seconds
   - More attempts: 5 retries (was 2)

4. **Better Logging:**
   - Shows attempt number
   - Shows error codes
   - Shows hostname being contacted

## Configuration

You can still configure timeouts via environment variables:

```env
# Increase timeout (default: 30000ms = 30 seconds)
COGNITO_FETCH_TIMEOUT_MS=60000

# Increase retries (default: 5)
COGNITO_FETCH_RETRIES=5
```

## Testing

The native https module was tested and works:
```bash
✅ Status: 400  # Connection successful (400 is expected for invalid request)
```

## Why This Works

1. **Native Module:** Node.js `https` is more reliable than `fetch()` in WSL2
2. **IPv4 Forced:** Avoids IPv6 connection issues
3. **Better Timeouts:** Native timeout handling is more reliable
4. **Proven:** curl and native https both work, only `fetch()` was failing

## Error Messages

Now you'll get clearer error messages:

**Before:**
```
fetchWithTimeout: failed after 6 attempt(s): fetch failed
```

**After:**
```
fetchWithTimeout: failed after 6 attempt(s). 
Last error: Request timeout (ETIMEDOUT). 
This may be a network connectivity issue. 
Please check your internet connection and try again.
```

## Next Steps

1. **Test login** - Should work now with native https
2. **Monitor logs** - Check for any remaining issues
3. **Adjust timeouts** - If still slow, increase `COGNITO_FETCH_TIMEOUT_MS`

