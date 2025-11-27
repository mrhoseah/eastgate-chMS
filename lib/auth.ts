import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { signInWithCognitoDirect, getUserFromTokenDirect } from "./cognito-direct";
import { signInWithCognitoSdk, getUserFromTokenSdk } from "./cognito-sdk";

/**
 * Fresh NextAuth Configuration
 * Simple, clean authentication using Cognito credentials from .env
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  useSecureCookies: process.env.NODE_ENV === "production",
  
  pages: {
    signIn: "/auth/signin",
  },
  
  providers: [
    CredentialsProvider({
      id: "cognito",
      name: "Cognito",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Step 1: Authenticate with Cognito
          const useSdk = process.env.USE_COGNITO_SDK === "true" || !!process.env.COGNITO_CLIENT_SECRET;
          
          let cognitoResponse;
          if (useSdk) {
            try {
              cognitoResponse = await signInWithCognitoSdk(credentials.email, credentials.password);
            } catch (error: any) {
              // Fallback to Direct HTTP if SDK fails
              console.warn("SDK failed, using Direct HTTP:", error.message);
              cognitoResponse = await signInWithCognitoDirect(credentials.email, credentials.password);
            }
          } else {
            cognitoResponse = await signInWithCognitoDirect(credentials.email, credentials.password);
          }

          if (!cognitoResponse?.accessToken) {
            throw new Error("No access token received");
          }

          // Step 2: Get user from Cognito
          let cognitoUser;
          if (useSdk) {
            try {
              cognitoUser = await getUserFromTokenSdk(cognitoResponse.accessToken);
            } catch (error: any) {
              cognitoUser = await getUserFromTokenDirect(cognitoResponse.accessToken);
            }
          } else {
            cognitoUser = await getUserFromTokenDirect(cognitoResponse.accessToken);
          }

          if (!cognitoUser?.email) {
            throw new Error("Failed to get user information");
          }

          // Step 3: Find or create user in database
          let user = await prisma.user.findUnique({
            where: { email: cognitoUser.email },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              role: true,
              status: true,
              canLogin: true,
            },
          });

          if (!user) {
            // Create new user
            user = await prisma.user.create({
              data: {
                email: cognitoUser.email,
                firstName: cognitoUser.givenName || "User",
                lastName: cognitoUser.familyName || "",
                profileImage: cognitoUser.picture || null,
                role: "GUEST",
                status: "ACTIVE",
                canLogin: false,
                emailVerified: cognitoUser.emailVerified,
              },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                role: true,
                status: true,
                canLogin: true,
              },
            });
          }

          // Step 4: Check permissions
          const isAdmin = user.role === "ADMIN";
          const canLogin = isAdmin || (user.canLogin && user.status === "ACTIVE");

          if (!canLogin) {
            throw new Error("Account does not have login permission");
          }

          // Step 5: Return user for NextAuth session
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim() || user.email,
            image: user.profileImage || undefined,
            role: user.role,
          };
        } catch (error: any) {
          console.error("Authentication error:", error.message);
          
          // Handle network/timeout errors
          if (error.message?.includes("fetchWithTimeout") ||
              error.message?.includes("timeout") ||
              error.message?.includes("ETIMEDOUT") ||
              error.message?.includes("ECONNRESET") ||
              error.message?.includes("ENOTFOUND") ||
              error.message?.includes("EAI_AGAIN") ||
              error.message?.includes("Network error") ||
              error.message?.includes("network connectivity")) {
            throw new Error(
              "Network error: Unable to connect to authentication service. " +
              "Please check your internet connection and try again. " +
              "If the problem persists, contact your administrator."
            );
          }
          
          // Handle specific Cognito errors
          if (error.message?.includes("NotAuthorizedException") || 
              error.message?.includes("Invalid email or password")) {
            throw new Error("Invalid email or password");
          }
          
          if (error.message?.includes("UserNotConfirmedException")) {
            throw new Error("Account not confirmed. Please contact administrator.");
          }

          // Re-throw with original message
          throw error;
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = (user as any).role;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
};
