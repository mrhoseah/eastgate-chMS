import { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";
import { logError } from "./error-logger";

function getCognitoConfig() {
  return {
    clientId: process.env.COGNITO_CLIENT_ID || "",
    clientSecret: process.env.COGNITO_CLIENT_SECRET,
    userPoolId: process.env.COGNITO_USER_POOL_ID || "",
    region: process.env.COGNITO_REGION || "af-south-1",
  };
}

function computeSecretHash(username: string): string | undefined {
  const config = getCognitoConfig();
  if (!config.clientSecret) return undefined;
  return createHmac("sha256", config.clientSecret).update(username + config.clientId).digest("base64");
}

function makeClient() {
  const config = getCognitoConfig();
  // Force IPv4 and increase timeout for WSL2/network issues
  // Use longer timeout to handle slow networks
  const timeout = Number(process.env.COGNITO_FETCH_TIMEOUT_MS || 60000); // 60 seconds default for SDK
  
  return new CognitoIdentityProviderClient({ 
    region: config.region,
    // Increase timeout significantly for network issues
    requestHandler: {
      requestTimeout: timeout,
    },
    // Additional configuration for better network handling
    maxAttempts: Number(process.env.COGNITO_FETCH_RETRIES || 5) + 1, // SDK includes initial attempt
  });
}

export async function signInWithCognitoSdk(email: string, password: string) {
  const config = getCognitoConfig();
  const client = makeClient();

  const authParameters: Record<string, string> = {
    USERNAME: email,
    PASSWORD: password,
  };
  const secretHash = computeSecretHash(email);
  if (secretHash) authParameters.SECRET_HASH = secretHash;

  const input = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: config.clientId,
    AuthParameters: authParameters,
  };

  // Retry logic for DNS/network errors
  const maxRetries = 3;
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const command = new InitiateAuthCommand(input as any);
      const response = await client.send(command);
      if (!response.AuthenticationResult?.AccessToken) {
        throw new Error("Authentication failed - no access token received from SDK");
      }
      return {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
      };
    } catch (err: any) {
      lastError = err;
      const isDnsError = err?.code === "EAI_AGAIN" || 
                        err?.message?.includes("getaddrinfo") ||
                        err?.message?.includes("EAI_AGAIN");
      const isNetworkError = err?.code === "ETIMEDOUT" ||
                            err?.name === "TimeoutError" ||
                            err?.message?.includes("timeout");
      
      if ((isDnsError || isNetworkError) && attempt < maxRetries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.warn(`Cognito SDK attempt ${attempt} failed (${isDnsError ? 'DNS' : 'network'} error), retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      
      // If not retryable or last attempt, log and throw
      logError("CognitoSDK_InitiateAuth_Error", err, { 
        input, 
        region: config.region,
        attempt,
        isDnsError,
        isNetworkError,
      });
      const msg = err?.message || String(err);
      throw new Error(`Cognito SDK InitiateAuth error: ${msg}`);
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError || new Error("Cognito SDK InitiateAuth failed after retries");
}

export async function getUserFromTokenSdk(accessToken: string) {
  const client = makeClient();
  try {
    const cmd = new GetUserCommand({ AccessToken: accessToken } as any);
    const res = await client.send(cmd);
    const attributes: Record<string, string> = {};
    res.UserAttributes?.forEach((a: any) => {
      if (a.Name && a.Value) attributes[a.Name] = a.Value;
    });
    return {
      sub: attributes.sub || "",
      email: attributes.email || "",
      emailVerified: attributes.email_verified === "true",
      phone: attributes.phone_number || attributes.phone || "",
      phoneVerified: attributes.phone_number_verified === "true",
      givenName: attributes.given_name || attributes["custom:firstName"] || "",
      familyName: attributes.family_name || attributes["custom:lastName"] || "",
      middleName: attributes.middle_name || "",
      picture: attributes.picture || "",
      customAttributes: attributes,
    };
  } catch (err: any) {
    logError("CognitoSDK_GetUser_Error", err, { region: process.env.COGNITO_REGION });
    throw new Error(err?.message || "Failed to get user from token via SDK");
  }
}
