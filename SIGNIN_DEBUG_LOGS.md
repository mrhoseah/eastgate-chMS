# 🔍 Sign In Debug Logs

**Generated:** 2025-11-16  
**Email:** mrhoseah@gmail.com

---

## 📊 Test Results Summary

### ✅ Network Connectivity: WORKING
- **DNS Resolution:** ✅ Success
- **HTTPS Connection (curl):** ✅ Success (Status 400 - expected with test credentials)
- **Node.js Native HTTPS:** ✅ Success (Status 400 - connection works)

### ❌ AWS SDK Authentication: FAILING
- **Error:** `TimeoutError` (ETIMEDOUT)
- **Location:** `internalConnectMultiple` timeout
- **Issue:** AWS SDK cannot establish connection within timeout period

### ⏳ Direct HTTP Method: TESTING
- **Status:** Testing with increased timeout (30s) and retries (5)

---

## 🔍 Detailed Error Logs

### Latest Error (from auth-errors.json):

```json
{
  "timestamp": "2025-11-16T10:50:55.643Z",
  "type": "CognitoSDK_InitiateAuth_Error",
  "error": {
    "name": "TimeoutError",
    "message": "TimeoutError",
    "code": "ETIMEDOUT",
    "stack": "AggregateError [ETIMEDOUT]: \n    at internalConnectMultiple (node:net:1134:18)\n    at internalConnectMultiple (node:net:1210:5)\n    at Timeout.internalConnectMultipleTimeout (node:net:1742:5)\n    at listOnTimeout (node:internal/timers:610:11)"
  },
  "context": {
    "input": {
      "AuthFlow": "USER_PASSWORD_AUTH",
      "ClientId": "3tqr6stk71nj1dqid070ortevv",
      "AuthParameters": {
        "USERNAME": "mrhoseah@gmail.com",
        "PASSWORD": "@@H5210h1...",
        "SECRET_HASH": "c9MKAn0TwdpesZunsCtRZY9OX+rqKaPMGjIHQhqMbXU="
      }
    },
    "region": "af-south-1"
  }
}
```

---

## 🎯 Key Findings

1. **Network IS Reachable**
   - curl successfully connects to Cognito
   - Node.js native HTTPS works
   - DNS resolution works

2. **AWS SDK Has Connection Issues**
   - Times out before establishing connection
   - May be trying IPv6 first (which fails in WSL2)
   - Default timeout may be too short

3. **Direct HTTP May Work Better**
   - Uses `fetchWithTimeout` with configurable timeout
   - Has retry logic with exponential backoff
   - Can be configured via environment variables

---

## 🔧 Applied Fixes

### Fix 1: Increased AWS SDK Timeout
**File:** `lib/cognito-sdk.ts`
- Added `requestHandler` with `requestTimeout: 30000` (30 seconds)
- Uses `COGNITO_FETCH_TIMEOUT_MS` environment variable if set

### Fix 2: Test Direct HTTP Method
- Testing with `USE_COGNITO_SDK=false`
- Increased timeout to 30 seconds
- Increased retries to 5

---

## 📝 Configuration

### Current Environment Variables:
```env
COGNITO_REGION=af-south-1
COGNITO_USER_POOL_ID=af-south-1_LmAJvuOpj
COGNITO_CLIENT_ID=3tqr6stk71nj1dqid070ortevv
COGNITO_CLIENT_SECRET=*** (set)
USE_COGNITO_SDK=true (default, but testing false)
COGNITO_FETCH_TIMEOUT_MS=30000 (increased from 8000)
COGNITO_FETCH_RETRIES=5 (increased from 2)
```

---

## 🧪 Test Commands

### Test Network:
```bash
# Test DNS
host cognito-idp.af-south-1.amazonaws.com

# Test HTTPS
curl -v https://cognito-idp.af-south-1.amazonaws.com/

# Test Node.js native
node /tmp/test-node-fetch.js
```

### Test Login:
```bash
# Test with SDK (current)
npx tsx scripts/debug-signin.ts mrhoseah@gmail.com "@@H5210h1..."

# Test with Direct HTTP
USE_COGNITO_SDK=false npx tsx scripts/debug-signin.ts mrhoseah@gmail.com "@@H5210h1..."

# Test with increased timeout
COGNITO_FETCH_TIMEOUT_MS=30000 COGNITO_FETCH_RETRIES=5 npx tsx scripts/debug-signin.ts mrhoseah@gmail.com "@@H5210h1..."
```

---

## 📚 Related Files

- `scripts/debug-signin.ts` - Comprehensive login test script
- `lib/cognito-sdk.ts` - AWS SDK implementation (updated with timeout)
- `lib/cognito-direct.ts` - Direct HTTP implementation
- `lib/auth.ts` - NextAuth configuration
- `auth-errors.json` - Error log file (929 entries)

---

## 💡 Recommendations

1. **Use Direct HTTP Method** if SDK continues to fail
   - Set `USE_COGNITO_SDK=false` in `.env`
   - More reliable in WSL2 environments

2. **Increase Timeout** for both methods
   - Set `COGNITO_FETCH_TIMEOUT_MS=30000` in `.env`
   - Set `COGNITO_FETCH_RETRIES=5` in `.env`

3. **Force IPv4** if using SDK
   - Set `NODE_OPTIONS=--dns-result-order=ipv4first`
   - Or configure in code

4. **Monitor Logs**
   - Check `auth-errors.json` for detailed error information
   - Check server console for real-time errors

---

## 🎯 Next Steps

1. ✅ Test Direct HTTP method with increased timeout
2. ✅ If successful, update `.env` to use Direct HTTP
3. ✅ If still failing, investigate WSL2 network configuration
4. ✅ Consider using a different network environment for testing

