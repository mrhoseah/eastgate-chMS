# Integration Quick Reference

## TL;DR
- **System integrations** (Cognito, Cloudinary) → Use `.env` variables directly
- **Church integrations** (SMS, M-Pesa, Email) → Pass `churchId` parameter

## For Developers

### When to Pass `churchId`?

**✅ ALWAYS pass churchId for:**
- `sendSMS(options, churchId)`
- `sendBulkSMS(messages, churchId)`
- `sendEmail(options, churchId)`
- `sendBulkEmail(emails, churchId)`
- `initiateSTKPush(options, churchId)`
- `querySTKStatus(checkoutId, churchId)`

**❌ NEVER pass churchId for:**
- `uploadImage()` - Uses global Cloudinary
- Cognito functions - Uses global user pool
- Database operations - Use foreign keys

### How to Get `churchId` in API Routes?

```typescript
// Method 1: From session (if churchId is stored in session)
const churchId = (session.user as any)?.churchId;

// Method 2: From user's campus
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  include: { campus: { select: { churchId: true } } },
});
const churchId = user?.campus?.churchId;

// Method 3: Fallback to active church
if (!churchId) {
  const activeChurch = await prisma.church.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  churchId = activeChurch?.id;
}

// Use it
await sendSMS(options, churchId);
```

### Quick Copy-Paste Template

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get church context
  let churchId = (session.user as any)?.churchId;
  if (!churchId) {
    const activeChurch = await prisma.church.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    churchId = activeChurch?.id;
  }

  // Use church-specific integration
  const result = await sendSMS(messageOptions, churchId);
  
  return NextResponse.json(result);
}
```

## Integration Functions

### SMS
```typescript
import { sendSMS, sendBulkSMS } from "@/lib/sms";

// Single SMS
await sendSMS({ 
  to: "+254712345678",
  message: "Hello {{firstName}}"
}, churchId);

// Bulk SMS
await sendBulkSMS([
  { to: "+254712345678", message: "Hi John" },
  { to: "+254798765432", message: "Hi Jane" },
], churchId);
```

### Email
```typescript
import { sendEmail, sendBulkEmail } from "@/lib/email";

// Single email
await sendEmail({
  to: "user@example.com",
  subject: "Welcome",
  content: "Hello!",
  html: "<p>Hello!</p>"
}, churchId);

// Bulk email
await sendBulkEmail([
  { to: "user1@example.com", subject: "Hi", content: "Hello" },
  { to: "user2@example.com", subject: "Hi", content: "Hello" },
], churchId);
```

### M-Pesa
```typescript
import { initiateSTKPush, querySTKStatus } from "@/lib/mpesa";

// Initiate payment
const result = await initiateSTKPush({
  phoneNumber: "+254712345678",
  amount: 1000,
  accountReference: "DONATION-123",
  transactionDesc: "Church Donation"
}, churchId);

// Check status
const status = await querySTKStatus(
  result.checkoutRequestID!,
  churchId
);
```

## Common Mistakes

### ❌ Don't Do This
```typescript
// Missing churchId - will use fallback (might be wrong church!)
await sendSMS({ to: "+254712345678", message: "Test" });

// Using env variables for church-specific integrations
const apiKey = process.env.SMS_API_KEY; // ❌ Wrong!
```

### ✅ Do This
```typescript
// Always pass churchId
const churchId = await getChurchId(session);
await sendSMS({ to: "+254712345678", message: "Test" }, churchId);

// Load from database for church-specific integrations
const settings = await getSMSSettings(churchId); // ✅ Correct!
```

## Settings Configuration

### System Settings (Read-Only)
`.env` file:
```env
COGNITO_REGION=af-south-1
COGNITO_USER_POOL_ID=af-south-1_xxx
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

### Church Settings (Per Church)
Database: `ChurchSetting` table

**SMS**:
```json
{
  "apiKey": "xxx",
  "username": "sandbox",
  "senderId": "CHURCH1"
}
```

**M-Pesa**:
```json
{
  "consumerKey": "xxx",
  "consumerSecret": "xxx",
  "shortcode": "174379",
  "passkey": "xxx",
  "callbackUrl": "https://example.com/api/mpesa"
}
```

**Email**:
```json
{
  "smtpHost": "smtp.gmail.com",
  "smtpPort": "587",
  "smtpUser": "church@example.com",
  "smtpPassword": "xxx",
  "fromEmail": "church@example.com"
}
```

## Debugging

### SMS Not Sending?
```typescript
// Check settings exist
const settings = await getSMSSettings(churchId);
console.log("SMS Settings:", settings); // Should not be null

// Check recipients have phone numbers
const recipients = await prisma.user.findMany({
  where: { id: { in: recipientIds }, phone: { not: null } }
});
console.log("Recipients with phones:", recipients.length);
```

### M-Pesa Failing?
```typescript
// Check settings
const settings = await getMpesaSettings(churchId);
console.log("M-Pesa Settings:", settings);

// Check access token
const token = await getAccessToken(churchId);
console.log("Access Token:", token ? "✅" : "❌");
```

### Email Not Working?
```typescript
// Verify config
const result = await verifyEmailConfig(churchId);
console.log("Email Config Valid:", result.valid);
if (!result.valid) {
  console.error("Error:", result.error);
}
```

## For SUPERADMIN

### Managing Multiple Churches
```typescript
// List all churches
const churches = await prisma.church.findMany({
  include: {
    settings: true,
    _count: { select: { campuses: true, users: true } }
  }
});

// Configure specific church
await fetch("/api/settings", {
  method: "POST",
  body: JSON.stringify({
    churchId: "church-id-here", // Specify church
    key: "sms",
    value: JSON.stringify({ apiKey: "xxx", username: "yyy" }),
  }),
});

// Test with specific church
await sendSMS(options, "church-id-here");
```

## Need More Details?

📖 Read: `INTEGRATION_ARCHITECTURE.md` - Complete guide  
📋 Read: `INTEGRATION_UPDATES.md` - Recent changes

## Checklist for New Integrations

- [ ] Decide: System-level or Church-specific?
- [ ] If Church-specific:
  - [ ] Add `churchId?: string` parameter to all functions
  - [ ] Fetch settings from `ChurchSetting` table
  - [ ] Update API routes to extract and pass `churchId`
  - [ ] Add to Settings page (Church tab)
- [ ] If System-level:
  - [ ] Add to `.env` file
  - [ ] Use env variables directly
  - [ ] Add to Settings page (System tab, read-only)
- [ ] Add error handling for missing config
- [ ] Add debug logging
- [ ] Test with multiple churches
- [ ] Update documentation
