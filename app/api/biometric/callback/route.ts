import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Cams Biometrics Callback API
 * Receives real-time attendance data from biometric devices
 * Documentation: https://camsbiometrics.com/application/biometric-web-api.html
 */
export async function POST(request: NextRequest) {
  try {
    // Get service tag ID from query string
    const stgid = request.nextUrl.searchParams.get("stgid");
    if (!stgid) {
      return NextResponse.json(
        { status: "error", message: "Service Tag ID (stgid) is required" },
        { status: 400 }
      );
    }

    // Get raw JSON data from request body
    const rawData = await request.text();
    let data;
    
    try {
      data = JSON.parse(rawData);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return NextResponse.json(
        { status: "error", message: "Invalid JSON format" },
        { status: 400 }
      );
    }

    // Handle RealTime attendance data
    if (data.RealTime && data.RealTime.PunchLog) {
      const punchLog = data.RealTime.PunchLog;
      const authToken = data.RealTime.AuthToken;
      const operationID = data.RealTime.OperationID;

      // Verify device exists and auth token matches
      const device = await prisma.biometricDevice.findUnique({
        where: { serviceTagId: stgid },
      });

      if (!device) {
        console.error(`Device not found: ${stgid}`);
        return NextResponse.json({ status: "done" }); // Return done to prevent retries
      }

      if (device.authToken !== authToken) {
        console.error(`Invalid auth token for device: ${stgid}`);
        return NextResponse.json({ status: "done" }); // Return done to prevent retries
      }

      // Parse attendance time
      const logTime = new Date(punchLog.LogTime);

      // Find user by biometric user ID
      const user = await prisma.user.findFirst({
        where: {
          biometricUserId: punchLog.UserId,
          churchId: device.churchId,
        },
      });

      if (!user) {
        console.error(`User not found for biometric ID: ${punchLog.UserId}`);
        // Still return done to prevent retries
        return NextResponse.json({ status: "done" });
      }

      // Map attendance type
      const attendanceType = mapAttendanceType(punchLog.Type);

      // Create or update attendance record
      const attendance = await prisma.attendance.create({
        data: {
          userId: user.id,
          churchId: device.churchId,
          date: logTime,
          status: attendanceType,
          checkInTime: attendanceType === "PRESENT" ? logTime : null,
          checkOutTime: attendanceType === "ABSENT" ? logTime : null,
          notes: `Biometric: ${punchLog.InputType}${punchLog.Temperature ? `, Temp: ${punchLog.Temperature}°C` : ""}${punchLog.FaceMask !== undefined ? `, Mask: ${punchLog.FaceMask}` : ""}`,
          metadata: {
            biometricDeviceId: device.id,
            serviceTagId: stgid,
            inputType: punchLog.InputType,
            temperature: punchLog.Temperature,
            faceMask: punchLog.FaceMask,
            operationID: operationID,
            rawData: punchLog,
          },
        },
      });

      // Log the attendance for debugging
      console.log(`Attendance recorded: ${user.firstName} ${user.lastName} - ${attendanceType} at ${logTime}`);

      // Return success response (MUST return this format)
      return NextResponse.json(
        { status: "done" },
        { 
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    // Handle other command types (User, Template, Photo, etc.)
    if (data.Add && data.Add.User) {
      // User added to device
      console.log("User added to device:", data.Add.User);
      return NextResponse.json({ status: "done" });
    }

    if (data.Delete && data.Delete.User) {
      // User deleted from device
      console.log("User deleted from device:", data.Delete.User);
      return NextResponse.json({ status: "done" });
    }

    // Default response for any other commands
    return NextResponse.json({ status: "done" });
  } catch (error: any) {
    console.error("Biometric callback error:", error);
    // Always return done to prevent retries
    return NextResponse.json(
      { status: "done" },
      { status: 200 }
    );
  }
}

/**
 * Map Cams attendance type to our attendance status
 */
function mapAttendanceType(type: string): "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" {
  switch (type) {
    case "CheckIn":
      return "PRESENT";
    case "CheckOut":
      return "ABSENT";
    case "BreakIn":
    case "OverTimeIn":
    case "MealIn":
      return "PRESENT";
    case "BreakOut":
    case "OverTimeOut":
    case "MealOut":
      return "ABSENT";
    default:
      return "PRESENT";
  }
}

