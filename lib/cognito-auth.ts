/**
 * Clean Cognito Authentication Module
 * Handles all Cognito authentication logic
 */

import { signInWithCognitoDirect, getUserFromTokenDirect } from "./cognito-direct";
import { signInWithCognitoSdk, getUserFromTokenSdk } from "./cognito-sdk";

export interface CognitoAuthResult {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
}

export interface CognitoUser {
  sub: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  givenName?: string;
  familyName?: string;
  middleName?: string;
  picture?: string;
}

/**
 * Authenticate user with Cognito
 * Uses SDK if available, falls back to Direct HTTP
 */
export async function authenticateWithCognito(
  email: string,
  password: string
): Promise<CognitoAuthResult> {
  // Determine which method to use
  const useSdk = process.env.USE_COGNITO_SDK === "true" || !!process.env.COGNITO_CLIENT_SECRET;

  if (useSdk) {
    try {
      const result = await signInWithCognitoSdk(email, password);
      return {
        accessToken: result.accessToken,
        idToken: result.idToken,
        refreshToken: result.refreshToken,
      };
    } catch (error: any) {
      // If SDK fails, try Direct HTTP as fallback
      console.warn("SDK authentication failed, trying Direct HTTP:", error.message);
      const result = await signInWithCognitoDirect(email, password);
      return {
        accessToken: result.accessToken,
        idToken: result.idToken,
        refreshToken: result.refreshToken,
      };
    }
  }

  // Use Direct HTTP
  const result = await signInWithCognitoDirect(email, password);
  return {
    accessToken: result.accessToken,
    idToken: result.idToken,
    refreshToken: result.refreshToken,
  };
}

/**
 * Get user information from Cognito access token
 */
export async function getCognitoUser(accessToken: string): Promise<CognitoUser> {
  const useSdk = process.env.USE_COGNITO_SDK === "true" || !!process.env.COGNITO_CLIENT_SECRET;

  if (useSdk) {
    try {
      return await getUserFromTokenSdk(accessToken);
    } catch (error: any) {
      // Fallback to Direct HTTP
      console.warn("SDK getUser failed, trying Direct HTTP:", error.message);
      return await getUserFromTokenDirect(accessToken);
    }
  }

  return await getUserFromTokenDirect(accessToken);
}

