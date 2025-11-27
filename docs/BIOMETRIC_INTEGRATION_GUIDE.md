# Cams Biometrics Integration Guide

Complete step-by-step guide to integrate Cams Biometrics fingerprint attendance devices with your church management system.

## Overview

This integration allows you to:
- Receive real-time attendance data from fingerprint devices
- Automatically record attendance when members use the device
- Track attendance with temperature and face mask data (if supported)
- Manage multiple biometric devices from one dashboard

## Prerequisites

1. **Cams Biometrics Device** - Physical fingerprint attendance device
2. **Cams API License** - Active API license from Cams Biometrics
3. **API Monitor Access** - Login credentials for Cams API Monitor
4. **Device Internet Connection** - Device must be connected to the internet

## Step-by-Step Integration

### Step 1: Add Biometric Device

1. Navigate to **Dashboard → Attendance → Biometric Devices** tab
2. Click **"Add Device"** button
3. Fill in the device information:
   - **Device Name**: e.g., "Main Entrance Device"
   - **Service Tag ID (STGID)**: Found in Cams API Monitor for your device
   - **Device Model**: e.g., "Cams X1", "ZKTeco F18"
   - **Location**: e.g., "Main Entrance", "Office"
   - **Auth Token**: Authentication token from API Monitor
4. Click **"Add Device"**
5. **Copy the Callback URL** shown in the success message

### Step 2: Configure in Cams API Monitor

1. Log in to [Cams API Monitor](https://camsbiometrics.com)
2. Find your device using the Service Tag ID
3. Configure the following settings:
   - **Callback URL**: Paste the URL you copied (format: `https://your-domain.com/api/biometric/callback?stgid=YOUR_STGID`)
   - **Auth Token**: Set to match the token you entered in Step 1
4. Save the configuration

### Step 3: Add Users to Biometric Device

You need to add users to the biometric device first. This can be done in two ways:

#### Option A: Using Device Admin Panel
1. Access the device's admin panel directly
2. Add users and enroll their fingerprints
3. Note the **User ID** assigned to each user (e.g., 1, 2, 100)

#### Option B: Using Cams API Monitor
1. Log in to Cams API Monitor
2. Use the bulk upload feature or RESTful API to add users
3. Note the **User ID** for each user

### Step 4: Link Users to Biometric IDs

1. Navigate to **Dashboard → Attendance → Link Users** tab
2. Click **"Map User"** button
3. Select a user from the list (only unmapped users are shown)
4. Enter the **Biometric User ID** (the ID from the device)
5. Click **"Map User"**
6. Repeat for all users who will use the device

### Step 5: Test the Integration

1. Have a mapped user mark attendance on the device
2. Check the **Attendance Sessions** tab to verify the attendance was recorded
3. The attendance should appear automatically with:
   - User name
   - Timestamp
   - Input type (Fingerprint, Face, Card, etc.)
   - Temperature (if supported)
   - Face mask status (if supported)

## Understanding the Data Flow

```
Biometric Device → Cams Protocol Engine → Your Server (Callback API) → Database
```

1. **User marks attendance** on the device
2. **Device sends data** to Cams Protocol Engine
3. **Protocol Engine** forwards data to your callback URL
4. **Your server** receives the data and:
   - Validates the device and auth token
   - Finds the user by biometric User ID
   - Creates an attendance record
   - Returns success response

## API Endpoints

### Callback Endpoint (Receives Data from Device)
```
POST /api/biometric/callback?stgid=YOUR_STGID
```

This endpoint is called automatically by Cams when attendance is recorded. You don't need to call it manually.

### Device Management
- `GET /api/biometric/devices` - List all devices
- `POST /api/biometric/devices` - Add new device
- `GET /api/biometric/devices/[id]` - Get device details
- `PATCH /api/biometric/devices/[id]` - Update device
- `DELETE /api/biometric/devices/[id]` - Remove device

### User Mapping
- `PATCH /api/users/[id]` - Update user's biometricUserId

## Data Format

### Attendance Data Received
```json
{
  "RealTime": {
    "OperationID": "123456789",
    "PunchLog": {
      "UserId": "1",
      "LogTime": "2024-01-15 09:30:00 GMT +0530",
      "Type": "CheckIn",
      "InputType": "Fingerprint",
      "Temperature": "36.5",
      "FaceMask": false
    },
    "AuthToken": "your-auth-token",
    "Time": "2024-01-15 04:00:00 GMT +0000"
  }
}
```

### Attendance Types
- `CheckIn` - User checking in
- `CheckOut` - User checking out
- `BreakIn` - Break start
- `BreakOut` - Break end
- `OverTimeIn` - Overtime start
- `OverTimeOut` - Overtime end
- `MealIn` - Meal start
- `MealOut` - Meal end

### Input Types
- `Fingerprint`
- `Face`
- `Card`
- `Palm`
- `FingerVein`
- `Iris`
- `Retina`
- `Password`

## Troubleshooting

### Attendance Not Appearing

1. **Check Device Connection**
   - Ensure device is online and connected to internet
   - Verify device can reach your server

2. **Verify Callback URL**
   - Check the URL in API Monitor matches your server
   - Ensure the URL is publicly accessible (not localhost)
   - Test the URL manually if possible

3. **Check Auth Token**
   - Verify auth token in API Monitor matches the one in your system
   - Tokens are case-sensitive

4. **Verify User Mapping**
   - Ensure user is mapped to correct biometric User ID
   - Check the User ID in device matches the one in system

5. **Check Server Logs**
   - Look for errors in server console
   - Check for authentication failures
   - Verify database connections

### User Not Found Errors

- **Problem**: Device sends attendance but user is not found
- **Solution**: 
  1. Verify the biometric User ID in the device
  2. Check if user is mapped in "Link Users" tab
  3. Ensure the User ID matches exactly (case-sensitive)

### Device Not Responding

1. **Check Device Status**
   - Verify device is powered on
   - Check network connection
   - Restart device if needed

2. **Verify API License**
   - Ensure API license is active
   - Check license expiration date
   - Renew if expired

## Best Practices

1. **Regular Backups**: Backup your user mappings regularly
2. **Monitor Logs**: Check server logs for any errors
3. **Test Regularly**: Have test users mark attendance periodically
4. **Keep Devices Updated**: Update device firmware when available
5. **Document User IDs**: Keep a record of which User ID belongs to which member
6. **Multiple Devices**: Use different Service Tag IDs for each device location

## Security Considerations

1. **Auth Tokens**: Keep auth tokens secure and don't share them
2. **HTTPS**: Always use HTTPS for callback URLs
3. **Firewall**: Restrict access to callback endpoint if possible
4. **Validation**: The system validates auth tokens before processing attendance

## Support

- **Cams Biometrics Documentation**: https://camsbiometrics.com/application/biometric-web-api.html
- **Cams Support**: sales@camsunit.com or WhatsApp: +91-98-409-21006
- **API Monitor**: https://camsbiometrics.com

## Quick Reference

| Task | Location |
|------|----------|
| Add Device | Attendance → Biometric Devices → Add Device |
| Link Users | Attendance → Link Users → Map User |
| View Attendance | Attendance → Attendance Sessions |
| Device Settings | Attendance → Biometric Devices → [Device] |
| View Mapped Users | Attendance → Link Users → Mapped Users |

## Example Workflow

1. **Setup Day**:
   - Add device to system
   - Configure in API Monitor
   - Add 10 test users to device
   - Map 10 users in system

2. **Testing Day**:
   - Have each test user mark attendance
   - Verify all attendance records appear
   - Check data accuracy

3. **Production**:
   - Add remaining users to device
   - Map all users in system
   - Monitor for first week
   - Adjust as needed

---

**Last Updated**: 2024
**Version**: 1.0

