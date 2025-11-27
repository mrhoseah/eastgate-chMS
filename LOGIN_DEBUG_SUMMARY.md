# 🔍 Login Debug Summary

**Date:** 2025-11-16  
**Email:** mrhoseah@gmail.com  
**Status:** ❌ FAILING - Network Timeout

---

## 🔍 Test Results

### Network Connectivity Test ✅
- **DNS Resolution:** ✅ Working
  - IPv4 addresses resolved: `13.246.117.10`, `13.246.102.221`, `13.245.147.57`
  - IPv6 addresses resolved (but unreachable - normal in WSL2)
  
- **HTTPS Connection (curl):** ✅ Working
  - Successfully connected to `13.246.117.10:443`
  - TLS handshake initiated
  - Connection established

### Authentication Test ❌
- **Method:** AWS SDK (USE_COGNITO_SDK=true)
- **Error:** `TimeoutError` with code `ETIMEDOUT`
- **Location:** `internalConnectMultiple` (Node.js TCP connection)
- **Timeout:** 8 seconds (default)

---

## 🎯 Root Cause

**The network IS reachable** (curl works), but **Node.js/AWS SDK is timing out** when trying to connect.

### Possible Causes:

1. **IPv6 Preference Issue**
   - Node.js might be trying IPv6 first (which fails in WSL2)
   - IPv4 works but Node.js times out before falling back

2. **AWS SDK Connection Behavior**
   - AWS SDK might have different connection logic than curl
   - May be using different DNS resolution or connection pooling

3. **WSL2 Network Limitations**
   - WSL2 networking can be slower than native
   - Connection establishment might take longer than timeout

4. **Node.js Undici/Fetch Issues**
   - Node.js fetch implementation might have timeout issues
   - Different behavior than native curl

---

## 📊 Recent Error Logs

### Latest Attempts (from auth-errors.json):

1. **2025-11-16T10:50:55.643Z**
   ```
   Type: CognitoSDK_InitiateAuth_Error
   Error: TimeoutError (ETIMEDOUT)
   Email: mrhoseah@gmail.com
   Stack: internalConnectMultiple timeout
   ```

2. **2025-11-16T10:50:49.120Z**
   ```
   Type: NextAuth_Authorize_Error
   Error: Cognito SDK InitiateAuth error: TimeoutError
   Email: mrhoseah@gmail.com
   ```

3. **2025-11-16T10:47:40.746Z**
   ```
   Type: CognitoSDK_InitiateAuth_Error
   Error: TimeoutError (ETIMEDOUT)
   Email: mrhoseah@gmail.com
   ```

**Pattern:** All attempts fail with `ETIMEDOUT` at the TCP connection level.

---

## 🔧 Solutions to Try

### Solution 1: Increase Timeout ⏱️

Add to `.env`:
```env
COGNITO_FETCH_TIMEOUT_MS=30000
COGNITO_FETCH_RETRIES=5
```

This gives more time for the connection to establish, especially in WSL2.

### Solution 2: Force IPv4 in Node.js 🌐

The AWS SDK might be trying IPv6 first. We can configure Node.js to prefer IPv4:

Add to your code or environment:
```env
NODE_OPTIONS=--dns-result-order=ipv4first
```

Or in code:
```typescript
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';
```

### Solution 3: Use Direct HTTP Instead of SDK 🔄

The Direct HTTP method might work better than the SDK:

Add to `.env`:
```env
USE_COGNITO_SDK=false
```

This uses the `fetchWithTimeout` function which might handle WSL2 networking better.

### Solution 4: Configure AWS SDK Timeout ⚙️

Modify `lib/cognito-sdk.ts` to add explicit timeout configuration:

```typescript
const client = new CognitoIdentityProviderClient({
  region: config.region,
  requestHandler: {
    requestTimeout: 30000, // 30 seconds
  },
});
```

### Solution 5: Test with Node.js Native HTTPS 📡

We can test if Node.js native HTTPS works (see test script above).

---

## 🧪 Test Commands

### Test Network Connectivity:
```bash
# Test with curl (works ✅)
curl -v https://cognito-idp.af-south-1.amazonaws.com/

# Test DNS
host cognito-idp.af-south-1.amazonaws.com

# Test Node.js connection
node /tmp/test-node-fetch.js
```

### Test Login:
```bash
# Run debug script
npx tsx scripts/debug-signin.ts mrhoseah@gmail.com "@@H5210h1..."

# Test with Direct HTTP
USE_COGNITO_SDK=false npx tsx scripts/debug-signin.ts mrhoseah@gmail.com "@@H5210h1..."

# Test with increased timeout
COGNITO_FETCH_TIMEOUT_MS=30000 npx tsx scripts/debug-signin.ts mrhoseah@gmail.com "@@H5210h1..."
```

---

## 📝 Configuration Summary

Current `.env` settings:
- `COGNITO_REGION=af-south-1`
- `COGNITO_USER_POOL_ID=af-south-1_LmAJvuOpj`
- `COGNITO_CLIENT_ID=3tqr6stk71nj1dqid070ortevv`
- `COGNITO_CLIENT_SECRET=***` (set)
- `USE_COGNITO_SDK=true`
- `COGNITO_FETCH_TIMEOUT_MS=8000` (default)
- `COGNITO_FETCH_RETRIES=2` (default)

---

## 🎯 Recommended Next Steps

1. ✅ **Try Solution 1:** Increase timeout to 30 seconds
2. ✅ **Try Solution 2:** Force IPv4 with `NODE_OPTIONS`
3. ✅ **Try Solution 3:** Switch to Direct HTTP method
4. ✅ **Test:** Run debug script with new settings
5. ✅ **Monitor:** Check if connection succeeds with longer timeout

---

## 📚 Related Files

- `scripts/debug-signin.ts` - Comprehensive login test
- `lib/cognito-sdk.ts` - AWS SDK implementation
- `lib/cognito-direct.ts` - Direct HTTP implementation
- `lib/auth.ts` - NextAuth configuration
- `auth-errors.json` - Error log file

---

## 💡 Key Insight

**The network IS working** (curl succeeds), but **Node.js/AWS SDK is timing out**. This suggests:
- The issue is with Node.js connection behavior, not network infrastructure
- WSL2 networking might be slower than expected
- Increasing timeout or forcing IPv4 should help

