import { config } from "dotenv";
import { resolve } from "path";
import { signInWithCognitoDirect, getUserFromTokenDirect } from "../lib/cognito-direct";
import { signInWithCognitoSdk, getUserFromTokenSdk } from "../lib/cognito-sdk";
import { prisma } from "../lib/prisma";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

async function debugSignIn() {
  console.log("🔍 DEBUG: Sign In Test\n");
  console.log("=" .repeat(60));
  
  const email = process.argv[2] || "mrhoseah@gmail.com";
  const password = process.argv[3] || "@@H5210h1...";

  console.log("\n📋 Configuration:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password.length > 0 ? "***" : "NOT SET"}`);
  console.log(`   Region: ${process.env.COGNITO_REGION || "NOT SET"}`);
  console.log(`   User Pool ID: ${process.env.COGNITO_USER_POOL_ID || "NOT SET"}`);
  console.log(`   Client ID: ${process.env.COGNITO_CLIENT_ID || "NOT SET"}`);
  console.log(`   Has Client Secret: ${!!process.env.COGNITO_CLIENT_SECRET}`);
  console.log(`   USE_COGNITO_SDK: ${process.env.USE_COGNITO_SDK || "NOT SET"}`);
  console.log(`   COGNITO_FETCH_TIMEOUT_MS: ${process.env.COGNITO_FETCH_TIMEOUT_MS || "8000 (default)"}`);
  console.log(`   COGNITO_FETCH_RETRIES: ${process.env.COGNITO_FETCH_RETRIES || "2 (default)"}`);
  console.log("");

  // Step 1: Test network connectivity
  console.log("1️⃣ Testing Network Connectivity...");
  try {
    const testUrl = `https://cognito-idp.${process.env.COGNITO_REGION || "af-south-1"}.amazonaws.com/`;
    console.log(`   Testing: ${testUrl}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(testUrl, {
        method: "POST",
        headers: {
          "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
          "Content-Type": "application/x-amz-json-1.1",
        },
        body: JSON.stringify({ AuthFlow: "USER_PASSWORD_AUTH", ClientId: "test" }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      console.log(`   ✅ Network reachable (Status: ${response.status})`);
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        console.error("   ❌ Network timeout - cannot reach Cognito endpoint");
      } else {
        console.error(`   ⚠️  Network error: ${err.message}`);
        console.error("   (This might be expected - endpoint may require valid credentials)");
      }
    }
  } catch (error: any) {
    console.error(`   ❌ Network test failed: ${error.message}`);
  }
  console.log("");

  // Step 2: Determine which method to use
  console.log("2️⃣ Determining Authentication Method...");
  const envUseSdk = process.env.USE_COGNITO_SDK;
  const useSdk = typeof envUseSdk === "string"
    ? envUseSdk.toLowerCase() === "true"
    : !!process.env.COGNITO_CLIENT_SECRET;
  
  console.log(`   Method: ${useSdk ? "AWS SDK" : "Direct HTTP"}`);
  console.log(`   Reason: ${envUseSdk ? `USE_COGNITO_SDK=${envUseSdk}` : (process.env.COGNITO_CLIENT_SECRET ? "COGNITO_CLIENT_SECRET is set" : "No client secret, using Direct HTTP")}`);
  console.log("");

  // Step 3: Test Cognito Authentication
  console.log(`3️⃣ Testing Cognito Authentication (${useSdk ? "SDK" : "Direct HTTP"})...`);
  let cognitoResponse;
  let cognitoError;
  
  try {
    const startTime = Date.now();
    if (useSdk) {
      console.log("   Using AWS SDK...");
      cognitoResponse = await signInWithCognitoSdk(email, password);
    } else {
      console.log("   Using Direct HTTP...");
      cognitoResponse = await signInWithCognitoDirect(email, password);
    }
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Authentication successful (${duration}ms)`);
    console.log(`   Access Token: ${cognitoResponse.accessToken.substring(0, 30)}...`);
    console.log(`   ID Token: ${cognitoResponse.idToken.substring(0, 30)}...`);
    console.log(`   Refresh Token: ${cognitoResponse.refreshToken ? "Present" : "Missing"}`);
  } catch (error: any) {
    cognitoError = error;
    console.error(`   ❌ Authentication failed`);
    console.error(`   Error Name: ${error.name}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Error Code: ${error.code || "N/A"}`);
    
    if (error.stack) {
      const stackLines = error.stack.split("\n").slice(0, 5);
      console.error(`   Stack Trace:`);
      stackLines.forEach((line: string) => {
        console.error(`      ${line}`);
      });
    }
    
    if (error.original) {
      console.error(`   Original Error:`);
      console.error(`      Name: ${error.original.name}`);
      console.error(`      Message: ${error.original.message}`);
      console.error(`      Code: ${error.original.code || "N/A"}`);
    }
    
    if (error.attempts) {
      console.error(`   Attempts: ${error.attempts}`);
    }
  }
  console.log("");

  // Step 4: If authentication succeeded, get user info
  if (cognitoResponse) {
    console.log("4️⃣ Getting User Information from Cognito...");
    try {
      const cognitoUser = useSdk
        ? await getUserFromTokenSdk(cognitoResponse.accessToken)
        : await getUserFromTokenDirect(cognitoResponse.accessToken);
      
      console.log("   ✅ User information retrieved");
      console.log(`   Email: ${cognitoUser.email}`);
      console.log(`   Sub: ${cognitoUser.sub}`);
      console.log(`   Given Name: ${cognitoUser.givenName || "N/A"}`);
      console.log(`   Family Name: ${cognitoUser.familyName || "N/A"}`);
      console.log(`   Email Verified: ${cognitoUser.emailVerified}`);
      console.log(`   Phone: ${cognitoUser.phone || "N/A"}`);
    } catch (error: any) {
      console.error(`   ❌ Failed to get user information`);
      console.error(`   Error: ${error.message}`);
    }
    console.log("");

    // Step 5: Check database user
    console.log("5️⃣ Checking Database User...");
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          canLogin: true,
          emailVerified: true,
        },
      });

      if (!dbUser) {
        console.log("   ⚠️  User not found in database");
        console.log("   (Would be created during NextAuth flow)");
      } else {
        console.log("   ✅ User found in database");
        console.log(`   ID: ${dbUser.id}`);
        console.log(`   Name: ${dbUser.firstName} ${dbUser.lastName}`);
        console.log(`   Role: ${dbUser.role}`);
        console.log(`   Status: ${dbUser.status}`);
        console.log(`   Can Login: ${dbUser.canLogin}`);
        console.log(`   Email Verified: ${dbUser.emailVerified}`);
        
        // Check permissions
        const isAdmin = dbUser.role === "ADMIN";
        const canLogin = isAdmin || (dbUser.canLogin && dbUser.status === "ACTIVE");
        
        console.log("");
        console.log("   Permission Check:");
        console.log(`   Is Admin: ${isAdmin}`);
        console.log(`   Can Login: ${canLogin}`);
        
        if (!canLogin) {
          console.error("   ❌ User cannot login!");
          if (!isAdmin && !dbUser.canLogin) {
            console.error("      Reason: canLogin is false");
          }
          if (dbUser.status !== "ACTIVE") {
            console.error(`      Reason: Status is ${dbUser.status} (must be ACTIVE)`);
          }
        } else {
          console.log("   ✅ User has permission to login");
        }
      }
    } catch (error: any) {
      console.error(`   ❌ Database error: ${error.message}`);
    }
    console.log("");
  }

  // Summary
  console.log("=" .repeat(60));
  console.log("\n📊 SUMMARY:\n");
  
  if (cognitoResponse) {
    console.log("✅ Cognito Authentication: SUCCESS");
    console.log("✅ User Token Retrieval: SUCCESS");
    console.log("✅ Database Check: COMPLETED");
    console.log("\n💡 The authentication flow should work in the web app.");
    console.log("   If it doesn't, check:");
    console.log("   1. Next.js dev server is running");
    console.log("   2. Browser console for errors");
    console.log("   3. Server logs for NextAuth errors");
  } else {
    console.log("❌ Cognito Authentication: FAILED");
    console.log("\n🔧 Troubleshooting Steps:");
    console.log("   1. Check network connectivity to AWS");
    console.log("   2. Verify Cognito credentials in .env");
    console.log("   3. Check if USER_PASSWORD_AUTH flow is enabled");
    console.log("   4. Try increasing COGNITO_FETCH_TIMEOUT_MS");
    console.log("   5. Try using AWS SDK: set USE_COGNITO_SDK=true");
    
    if (cognitoError) {
      console.log("\n📝 Error Details:");
      console.log(`   Type: ${cognitoError.name}`);
      console.log(`   Message: ${cognitoError.message}`);
      if (cognitoError.code) {
        console.log(`   Code: ${cognitoError.code}`);
      }
    }
  }
  
  console.log("\n" + "=" .repeat(60));
}

debugSignIn()
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

