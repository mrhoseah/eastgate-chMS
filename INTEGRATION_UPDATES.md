# Integration Updates Summary

## Overview
Updated all church-specific integrations (SMS, M-Pesa, Email) to properly support multi-tenancy by accepting an optional `churchId` parameter. This allows the system to support multiple churches with their own integration credentials.

## Changes Made

### 1. SMS Integration (`lib/sms.ts`)
**Status**: ✅ Already implemented correctly

- `getSMSSettings(churchId?: string)` - Fetches SMS settings for specific church
- `sendSMS(options, churchId?)` - Sends SMS using church-specific credentials
- `sendBulkSMS(messages, churchId?)` - Sends bulk SMS using church-specific credentials

**API Route**: `app/api/communications/send-sms/route.ts`
- Extracts `churchId` from session or falls back to active church
- Passes `churchId` to `sendBulkSMS()`
- Added comprehensive debug logging for troubleshooting

### 2. M-Pesa Integration (`lib/mpesa.ts`)
**Status**: ✅ Updated

**Changes**:
- `getMpesaSettings(churchId?: string)` - Added churchId parameter
- `getAccessToken(churchId?: string)` - Added churchId parameter
- `initiateSTKPush(options, churchId?)` - Added churchId parameter
- `querySTKStatus(checkoutRequestID, churchId?)` - Added churchId parameter

**API Route**: `app/api/donations/mpesa-stk/route.ts`
- ✅ Updated to extract `churchId` from user's campus
- ✅ Passes `churchId` to `initiateSTKPush()`

### 3. Email Integration (`lib/email.ts`)
**Status**: ✅ Updated

**Changes**:
- `getEmailSettings(churchId?: string)` - Added churchId parameter
- `createTransporter(churchId?: string)` - Added churchId parameter
- `sendEmail(options, churchId?)` - Added churchId parameter
- `sendBulkEmail(emails, churchId?)` - Added churchId parameter
- `verifyEmailConfig(churchId?)` - Added churchId parameter

**API Routes**:
- `lib/invitation-email.ts`:
  - ✅ Updated `sendInvitationEmail()` to accept and use `churchId`
  - ✅ Extracts `churchId` from invitation's campus if not provided
  - ✅ Passes `churchId` to `sendEmail()`

### 4. Documentation
**Status**: ✅ Created

**File**: `INTEGRATION_ARCHITECTURE.md`
- Complete integration architecture documentation
- System-level vs Church-specific integration patterns
- Implementation examples for each integration type
- Migration guide for converting between integration types
- Decision matrix for new integrations
- Best practices and troubleshooting guide

## Architecture Pattern

### System-Level Integrations (Environment Variables)
```typescript
// Stored in .env
// Used by ALL churches
// Configured once by system admin

// Examples:
// - AWS Cognito (authentication)
// - Cloudinary (media storage)
// - Database connection

import { cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

### Church-Specific Integrations (Database)
```typescript
// Stored in ChurchSetting table
// Each church has their own credentials
// Configured by church admins

// Examples:
// - SMS (Afrika's Talking per church)
// - M-Pesa (Paybill per church)
// - Email (SMTP per church)

async function getSMSSettings(churchId?: string) {
  const church = await prisma.church.findFirst({
    where: churchId ? { id: churchId } : { isActive: true },
    include: { settings: { where: { key: "sms" } } },
  });
  return JSON.parse(church.settings[0].value);
}

export async function sendSMS(options, churchId?) {
  const settings = await getSMSSettings(churchId);
  // Send using church-specific credentials
}
```

## Multi-Tenancy Support

### SUPERADMIN Flow
```typescript
// SUPERADMIN can select any church
const selectedChurch = "church-id-1";

// Configure settings for that church
await fetch("/api/settings", {
  method: "POST",
  body: JSON.stringify({
    churchId: selectedChurch,
    key: "sms",
    value: JSON.stringify({
      apiKey: "xxx",
      username: "church1",
      senderId: "CHURCH1",
    }),
  }),
});

// Send SMS using that church's credentials
await sendSMS(options, selectedChurch);
```

### Church Admin Flow
```typescript
// Church ADMIN automatically uses their church
const session = await getServerSession();
const churchId = session.user.campusId 
  ? (await prisma.campus.findUnique({ 
      where: { id: session.user.campusId } 
    }))?.churchId
  : undefined;

// Configure settings for their church only
await fetch("/api/settings", {
  method: "POST",
  body: JSON.stringify({
    key: "sms",
    value: JSON.stringify({ apiKey: "xxx" }),
  }),
});

// Send SMS using their church's credentials
await sendSMS(options, churchId);
```

## API Route Pattern

### Standard Pattern for Church-Specific APIs
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Extract church context from session
  let churchId = (session.user as any)?.churchId;
  
  // Fallback: Get from user's campus
  if (!churchId && session.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { campus: true },
    });
    churchId = user?.campus?.churchId;
  }
  
  // Fallback: Use active church
  if (!churchId) {
    const activeChurch = await prisma.church.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    churchId = activeChurch?.id;
  }

  // Use church-specific integration
  const result = await sendSMS(options, churchId);
  return NextResponse.json(result);
}
```

## Database Schema

### ChurchSetting Table
```prisma
model ChurchSetting {
  id        String   @id @default(cuid())
  churchId  String
  key       String   // "sms", "mpesa", "email"
  value     String   // JSON string with credentials
  type      String   @default("text")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  church Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@unique([churchId, key])
  @@index([churchId])
}
```

### Example Settings Data
```json
// SMS Settings
{
  "churchId": "cm123",
  "key": "sms",
  "value": "{\"apiKey\":\"xxx\",\"username\":\"sandbox\",\"senderId\":\"CHURCH1\"}"
}

// M-Pesa Settings
{
  "churchId": "cm123",
  "key": "mpesa",
  "value": "{\"consumerKey\":\"xxx\",\"consumerSecret\":\"xxx\",\"shortcode\":\"174379\",\"passkey\":\"xxx\"}"
}

// Email Settings
{
  "churchId": "cm123",
  "key": "email",
  "value": "{\"smtpHost\":\"smtp.gmail.com\",\"smtpPort\":\"587\",\"smtpUser\":\"church@example.com\",\"smtpPassword\":\"xxx\",\"fromEmail\":\"church@example.com\"}"
}
```

## Testing

### Test SMS Bulk Sending
The SMS route now includes comprehensive debug logging:

```
[SMS Bulk] Initial recipient IDs: [...]
[SMS Bulk] Group IDs: [...]
[SMS Bulk] Group target type: all-members
[SMS Bulk] Found 2 groups
[SMS Bulk] Group "Youth": 15 members
[SMS Bulk] Group "Choir": 20 members
[SMS Bulk] Total recipient IDs after processing groups: 35
[SMS Bulk] Found 30 recipients with phone numbers
[SMS Bulk] Recipient: John Doe, Phone: +254712345678
[SMS Bulk] Total messages to send: 30
[SMS Bulk] Settings loaded, grouping messages...
[SMS Bulk] Created 1 message groups
```

This helps identify issues like:
- Empty recipient lists
- Groups with no members
- Members without phone numbers
- Message grouping problems

### Manual Testing Checklist

For each church:
- [ ] Configure SMS settings in Settings > Church > SMS
- [ ] Send test SMS and verify it uses church's credentials
- [ ] Configure M-Pesa settings in Settings > Church > M-Pesa
- [ ] Test STK Push and verify correct Paybill
- [ ] Configure Email settings in Settings > Church > Email
- [ ] Send test invitation and verify from address

## Migration Notes

### No Breaking Changes
All existing code continues to work because:
- `churchId` parameter is optional
- Functions fall back to active church if not provided
- Backward compatible with current API calls

### Future Updates
When adding new API routes:
1. Extract `churchId` from session/campus
2. Pass `churchId` to integration functions
3. Handle missing church context gracefully

## Benefits

1. **Multi-Tenancy**: Each church can have their own integration credentials
2. **Isolation**: One church's integration issues don't affect others
3. **Flexibility**: Different churches can use different SMS providers, email services, etc.
4. **Security**: Credentials are isolated per church in the database
5. **Scalability**: Easy to add new churches with their own integrations

## Next Steps

### Recommended Actions
1. ✅ Test SMS bulk sending with new debug logs
2. ⏳ Update remaining API routes to extract and pass churchId
3. ⏳ Add integration status check UI to Settings page
4. ⏳ Create admin interface for SUPERADMIN to manage all churches' integrations
5. ⏳ Add integration testing with mock credentials per church

### Future Integrations
When adding new integrations:
1. Use Decision Matrix in INTEGRATION_ARCHITECTURE.md
2. Follow the church-specific pattern if each church needs their own account
3. Use environment variables if shared across all churches
4. Add comprehensive error handling for missing configuration
5. Update Settings page with configuration UI

## Related Files

### Library Files
- `lib/sms.ts` - SMS integration
- `lib/mpesa.ts` - M-Pesa integration
- `lib/email.ts` - Email integration
- `lib/cloudinary.ts` - Cloudinary (system-level)
- `lib/auth.ts` - Cognito (system-level)
- `lib/invitation-email.ts` - Invitation emails

### API Routes
- `app/api/communications/send-sms/route.ts` - Send SMS
- `app/api/donations/mpesa-stk/route.ts` - M-Pesa STK Push
- `app/api/invitations/route.ts` - Send invitations

### Settings
- `app/dashboard/settings/page.tsx` - Settings UI

### Documentation
- `INTEGRATION_ARCHITECTURE.md` - Complete architecture guide
- `INTEGRATION_UPDATES.md` - This summary document

## Questions?

Refer to `INTEGRATION_ARCHITECTURE.md` for:
- Detailed implementation examples
- Decision matrix for new integrations
- Troubleshooting guide
- Best practices
- Migration guides
