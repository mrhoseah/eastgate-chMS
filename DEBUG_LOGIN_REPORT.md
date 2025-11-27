# 🔍 Login Debug Report

**Generated:** $(date)
**Email:** mrhoseah@gmail.com

## 📋 Configuration

- **Region:** af-south-1
- **User Pool ID:** af-south-1_LmAJvuOpj
- **Client ID:** 3tqr6stk71nj1dqid070ortevv
- **Has Client Secret:** Yes
- **Method:** AWS SDK (USE_COGNITO_SDK=true)
- **Timeout:** 8000ms (default)
- **Retries:** 2 (default)

## ❌ Current Status: FAILED

### Error Details

**Error Type:** TimeoutError
**Error Message:** Cognito SDK InitiateAuth error: TimeoutError
**Error Code:** ETIMEDOUT

**Stack Trace:**
```
Error: Cognito SDK InitiateAuth error: TimeoutError
    at signInWithCognitoSdk (/home/mrhoseah/dev/shepherd-chMS/lib/cognito-sdk.ts:57:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async debugSignIn (/home/mrhoseah/dev/shepherd-chMS/scripts/debug-signin.ts:84:25)
```

## 🔍 Root Cause Analysis

The authentication is failing at the **network layer** - the system cannot establish a connection to AWS Cognito. The error occurs in `internalConnectMultiple`, which is Node.js's TCP connection handler.

### Possible Causes:

1. **Network Connectivity Issues**
   - Firewall blocking outbound HTTPS connections
   - Proxy configuration required
   - VPN or network restrictions
   - WSL2 network configuration issues

2. **DNS Resolution Problems**
   - Cannot resolve `cognito-idp.af-south-1.amazonaws.com`
   - DNS server issues

3. **AWS Service Issues**
   - Regional service outage (unlikely but possible)
   - IP blocking

4. **WSL2 Specific Issues**
   - WSL2 networking limitations
   - Windows firewall blocking WSL2 network access

## 📊 Recent Login Attempts (from auth-errors.json)

### Most Recent Attempts:

1. **2025-11-16T10:47:40.746Z**
   - Email: mrhoseah@gmail.com
   - Method: AWS SDK
   - Error: TimeoutError (ETIMEDOUT)

2. **2025-11-16T06:30:33.111Z**
   - Email: mrhoseah@gmail.com
   - Method: AWS SDK
   - Error: TimeoutError (ETIMEDOUT)

3. **2025-11-15T17:54:27.734Z**
   - Email: mrhoseah@gmail.com
   - Method: AWS SDK
   - Error: TimeoutError (ETIMEDOUT)

**Pattern:** All recent attempts are timing out at the network connection level.

## 🔧 Recommended Solutions

### Solution 1: Test Network Connectivity

```bash
# Test DNS resolution
nslookup cognito-idp.af-south-1.amazonaws.com

# Test HTTPS connectivity
curl -v https://cognito-idp.af-south-1.amazonaws.com/

# Test with timeout
timeout 10 curl https://cognito-idp.af-south-1.amazonaws.com/
```

### Solution 2: Increase Timeout (Temporary Workaround)

Add to `.env`:
```env
COGNITO_FETCH_TIMEOUT_MS=30000
COGNITO_FETCH_RETRIES=5
```

### Solution 3: Try Direct HTTP Instead of SDK

Add to `.env`:
```env
USE_COGNITO_SDK=false
```

### Solution 4: Check WSL2 Network Configuration

If running in WSL2:
```bash
# Check WSL2 network
ip addr show

# Check if you can reach external sites
ping 8.8.8.8

# Check DNS
cat /etc/resolv.conf
```

### Solution 5: Check Windows Firewall

If on Windows with WSL2:
- Windows Firewall might be blocking WSL2 network access
- Check Windows Defender Firewall settings
- Allow Node.js through firewall

### Solution 6: Use Proxy (if behind corporate firewall)

If behind a corporate firewall, configure proxy:
```env
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080
```

## 📝 Next Steps

1. ✅ Run network connectivity tests
2. ✅ Check DNS resolution
3. ✅ Verify firewall settings
4. ✅ Test with increased timeout
5. ✅ Try Direct HTTP method
6. ✅ Check WSL2 network configuration (if applicable)

## 🧪 Test Scripts Available

- `scripts/debug-signin.ts` - Comprehensive login test with detailed logging
- `scripts/test-full-auth-flow.ts` - Full authentication flow test
- `scripts/test-nextauth-login.ts` - NextAuth-specific test

## 📚 Related Files

- `lib/cognito-sdk.ts` - AWS SDK implementation
- `lib/cognito-direct.ts` - Direct HTTP implementation
- `lib/auth.ts` - NextAuth configuration
- `auth-errors.json` - Error log file

