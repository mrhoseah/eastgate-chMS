# 🔍 Complete Login Debug Report

**Date:** 2025-11-16  
**Email:** mrhoseah@gmail.com  
**Status:** ❌ FAILING - Network Timeout in Node.js fetch()

---

## 📊 Executive Summary

### ✅ What Works:
- **Network connectivity:** ✅ DNS resolution works
- **HTTPS (curl):** ✅ Successfully connects to Cognito
- **Node.js native HTTPS:** ✅ Successfully connects (Status 400)

### ❌ What Fails:
- **AWS SDK:** ❌ TimeoutError (ETIMEDOUT)
- **Direct HTTP (fetch):** ❌ TimeoutError (ETIMEDOUT)
- **Both methods:** Fail at `internalConnectMultiple` timeout

### 🎯 Root Cause:
**Node.js `fetch()` and AWS SDK cannot establish TCP connections** to Cognito, even though:
- curl works perfectly
- Node.js native `https` module works
- DNS resolution works

This suggests a **WSL2-specific issue with Node.js fetch/undici** or the AWS SDK's HTTP client.

---

## 🔍 Detailed Test Results

### Test 1: Network Connectivity ✅
```bash
$ curl -v https://cognito-idp.af-south-1.amazonaws.com/
* Connected to cognito-idp.af-south-1.amazonaws.com (13.246.117.10) port 443
* TLS handshake successful
Status: 400 (expected - invalid credentials)
```
**Result:** ✅ Network is reachable

### Test 2: Node.js Native HTTPS ✅
```javascript
const https = require('https');
// ... connection code ...
Status: 400
✅ Connection successful
```
**Result:** ✅ Node.js can connect using native `https` module

### Test 3: AWS SDK ❌
```
Error: Cognito SDK InitiateAuth error: TimeoutError
Code: ETIMEDOUT
Location: internalConnectMultiple timeout
```
**Result:** ❌ AWS SDK times out

### Test 4: Direct HTTP (fetch) ❌
```
Error: fetchWithTimeout: failed after 6 attempt(s): fetch failed
Original Error: TypeError: fetch failed
Code: ETIMEDOUT
```
**Result:** ❌ Node.js `fetch()` times out

---

## 🔧 Attempted Fixes

### Fix 1: Increased Timeout
- **File:** `lib/cognito-sdk.ts`
- **Change:** Added `requestTimeout: 30000` (30 seconds)
- **Result:** ❌ Still times out

### Fix 2: Increased Retries
- **Change:** `COGNITO_FETCH_RETRIES=5`
- **Result:** ❌ All 6 attempts (1 + 5 retries) failed

### Fix 3: Force IPv4
- **Change:** `NODE_OPTIONS=--dns-result-order=ipv4first`
- **Result:** ❌ Still times out

### Fix 4: Direct HTTP Method
- **Change:** `USE_COGNITO_SDK=false`
- **Result:** ❌ Still times out (same issue with fetch)

---

## 🎯 Key Insight

**The problem is NOT network connectivity** - it's specifically with:
1. Node.js `fetch()` implementation (undici)
2. AWS SDK's HTTP client

Both fail to establish connections, while:
- curl works (uses libcurl)
- Node.js native `https` works (uses Node.js core)

---

## 💡 Possible Solutions

### Solution 1: Use Node.js Native HTTPS (Recommended)
Replace `fetch()` with Node.js native `https` module in `cognito-direct.ts`:

```typescript
import https from 'https';

async function fetchWithNativeHttps(url: string, options: RequestInit) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers as any,
      family: 4, // Force IPv4
      timeout: 30000,
    }, (res) => {
      // Handle response
    });
    // ... rest of implementation
  });
}
```

### Solution 2: Configure Undici (Node.js fetch)
If using Node.js 18+, configure undici to prefer IPv4:

```typescript
import { setGlobalDispatcher, Agent } from 'undici';

const agent = new Agent({
  family: 4, // Force IPv4
});

setGlobalDispatcher(agent);
```

### Solution 3: Use HTTP Agent for AWS SDK
Configure AWS SDK to use a custom HTTP agent:

```typescript
import https from 'https';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';

const agent = new https.Agent({
  family: 4, // Force IPv4
  keepAlive: true,
});

const client = new CognitoIdentityProviderClient({
  region: config.region,
  requestHandler: new NodeHttpHandler({
    httpsAgent: agent,
    requestTimeout: 30000,
  }),
});
```

### Solution 4: Use Proxy or VPN
If behind a firewall, configure proxy settings.

---

## 📝 Error Logs Summary

### Recent Errors (from auth-errors.json):

**Total Errors:** 929 entries

**Latest Error:**
```json
{
  "timestamp": "2025-11-16T10:50:55.643Z",
  "type": "CognitoSDK_InitiateAuth_Error",
  "error": {
    "name": "TimeoutError",
    "code": "ETIMEDOUT"
  }
}
```

**Pattern:** All errors are `TimeoutError` with `ETIMEDOUT` code.

---

## 🧪 Test Scripts

### Available Scripts:
1. `scripts/debug-signin.ts` - Comprehensive login test
2. `scripts/test-full-auth-flow.ts` - Full auth flow test
3. `scripts/test-nextauth-login.ts` - NextAuth specific test

### Run Tests:
```bash
# Test with SDK
npx tsx scripts/debug-signin.ts mrhoseah@gmail.com "@@H5210h1..."

# Test with Direct HTTP
USE_COGNITO_SDK=false npx tsx scripts/debug-signin.ts mrhoseah@gmail.com "@@H5210h1..."

# Test with increased timeout
COGNITO_FETCH_TIMEOUT_MS=30000 COGNITO_FETCH_RETRIES=5 npx tsx scripts/debug-signin.ts mrhoseah@gmail.com "@@H5210h1..."
```

---

## 📚 Files Modified

1. **`lib/cognito-sdk.ts`**
   - Added `requestTimeout: 30000` to AWS SDK client
   - Still failing due to connection timeout

2. **`scripts/debug-signin.ts`**
   - Created comprehensive debug script
   - Tests network, SDK, and Direct HTTP methods

3. **Documentation:**
   - `LOGIN_DEBUG_SUMMARY.md` - Summary of findings
   - `SIGNIN_DEBUG_LOGS.md` - Detailed logs
   - `DEBUG_LOGIN_REPORT.md` - Initial report

---

## 🎯 Recommended Next Steps

1. **Implement Solution 1:** Replace `fetch()` with Node.js native `https` module
2. **Test:** Run login test with native HTTPS implementation
3. **If successful:** Update production code
4. **If still failing:** Investigate WSL2 network configuration or use different environment

---

## 🔗 Related Files

- `lib/cognito-sdk.ts` - AWS SDK implementation
- `lib/cognito-direct.ts` - Direct HTTP implementation (uses fetch)
- `lib/auth.ts` - NextAuth configuration
- `auth-errors.json` - Error log file (929 entries)
- `scripts/debug-signin.ts` - Debug script

---

## 💬 Conclusion

The login is failing due to **Node.js fetch/undici connection issues in WSL2**, not network connectivity problems. The solution is to **use Node.js native `https` module** instead of `fetch()` for Cognito API calls.

