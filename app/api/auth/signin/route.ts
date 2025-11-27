/**
 * Simple Sign-in API Route
 * Just validates and returns - NextAuth handles the rest
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // This route is just for validation
    // Actual authentication happens in NextAuth CredentialsProvider
    return NextResponse.json({
      message: "Please use NextAuth signIn() function",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Invalid request" },
      { status: 400 }
    );
  }
}
