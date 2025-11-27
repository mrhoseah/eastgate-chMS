# Integration Architecture

This document defines the integration architecture for Shepherd chMS, distinguishing between **system-level integrations** (stored in environment variables) and **church-specific integrations** (stored in the database).

## Architecture Overview

### System-Level Integrations (Environment Variables)
These are **shared across all churches** in the system and configured at the application level:

- **AWS Cognito** - User authentication and identity management
- **Cloudinary** - Media storage and CDN
- **Database** - PostgreSQL connection
- **NextAuth** - Session management

**Storage**: `.env` file  
**Scope**: Global (all churches use the same service)  
**Configuration**: One-time setup by system administrator

### Church-Specific Integrations (Database)
These are **unique per church** and stored in the `ChurchSetting` table:

- **SMS (Afrika's Talking)** - SMS messaging per church
- **M-Pesa** - Mobile payment processing per church
- **Email (SMTP)** - Email sending per church
- **PayPal** - Online payments per church (planned)
- **Bank Details** - EFT account details per church

**Storage**: `prisma.churchSetting` table  
**Scope**: Per church (each church has their own credentials)  
**Configuration**: Church admins configure via Settings page

## Implementation Details

### 1. System-Level Integrations

#### AWS Cognito
```env
# .env
COGNITO_REGION=af-south-1
COGNITO_USER_POOL_ID=af-south-1_LmAJvuOpj
COGNITO_CLIENT_ID=your-client-id
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Usage**:
```typescript
// lib/auth.ts - Direct env variable access
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

#### Cloudinary
```env
# .env
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret
```

**Usage**:
```typescript
// lib/cloudinary.ts - Direct env variable access
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});
```

### 2. Church-Specific Integrations

#### Database Schema
```prisma
model ChurchSetting {
  id        String   @id @default(cuid())
  churchId  String
  key       String   // "sms", "mpesa", "email", etc.
  value     String   // JSON string with credentials
  type      String   @default("text")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  church Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@unique([churchId, key])
  @@index([churchId])
}
```

#### SMS Integration (Afrika's Talking)
```typescript
// lib/sms.ts
async function getSMSSettings(churchId?: string): Promise<SMSSettings | null> {
  const church = await prisma.church.findFirst({
    where: churchId ? { id: churchId } : { isActive: true },
    include: {
      settings: { where: { key: "sms" } },
    },
  });

  if (!church?.settings.length) return null;

  const smsData = JSON.parse(church.settings[0].value);
  return {
    apiKey: smsData.apiKey,
    username: smsData.username,
    senderId: smsData.senderId,
  };
}

// Usage with churchId
export async function sendSMS(options: SendSMSOptions, churchId?: string) {
  const settings = await getSMSSettings(churchId);
  // ... send SMS using church-specific credentials
}
```

**Database Storage**:
```json
{
  "churchId": "church-id",
  "key": "sms",
  "value": "{\"apiKey\":\"xxx\",\"username\":\"sandbox\",\"senderId\":\"AFRICASTKNG\"}"
}
```

#### M-Pesa Integration
```typescript
// lib/mpesa.ts
async function getMpesaSettings(churchId?: string): Promise<MpesaSettings | null> {
  const church = await prisma.church.findFirst({
    where: churchId ? { id: churchId } : { isActive: true },
    include: {
      settings: { where: { key: "mpesa" } },
    },
  });

  if (!church?.settings.length) return null;

  const mpesaData = JSON.parse(church.settings[0].value);
  return {
    consumerKey: mpesaData.consumerKey,
    consumerSecret: mpesaData.consumerSecret,
    shortcode: mpesaData.shortcode,
    passkey: mpesaData.passkey,
    callbackUrl: mpesaData.callbackUrl,
  };
}

// Usage with churchId
export async function initiateSTKPush(options: STKPushOptions, churchId?: string) {
  const settings = await getMpesaSettings(churchId);
  // ... initiate STK push using church-specific credentials
}
```

**Database Storage**:
```json
{
  "churchId": "church-id",
  "key": "mpesa",
  "value": "{\"consumerKey\":\"xxx\",\"consumerSecret\":\"xxx\",\"shortcode\":\"174379\",\"passkey\":\"xxx\",\"callbackUrl\":\"https://example.com/api/mpesa\"}"
}
```

#### Email Integration (SMTP)
```typescript
// lib/email.ts
async function getEmailSettings(churchId?: string): Promise<EmailSettings | null> {
  const church = await prisma.church.findFirst({
    where: churchId ? { id: churchId } : { isActive: true },
    include: {
      settings: { where: { key: "email" } },
    },
  });

  if (!church?.settings.length) return null;

  const emailData = JSON.parse(church.settings[0].value);
  return {
    smtpHost: emailData.smtpHost,
    smtpPort: emailData.smtpPort,
    smtpUser: emailData.smtpUser,
    smtpPassword: emailData.smtpPassword,
    fromEmail: emailData.fromEmail,
  };
}

// Usage with churchId
export async function sendEmail(options: SendEmailOptions, churchId?: string) {
  const settings = await getEmailSettings(churchId);
  // ... send email using church-specific SMTP
}
```

**Database Storage**:
```json
{
  "churchId": "church-id",
  "key": "email",
  "value": "{\"smtpHost\":\"smtp.gmail.com\",\"smtpPort\":\"587\",\"smtpUser\":\"church@example.com\",\"smtpPassword\":\"xxx\",\"fromEmail\":\"church@example.com\"}"
}
```

## API Route Patterns

### System-Level Integration APIs
```typescript
// app/api/upload/cloudinary/route.ts
// No churchId needed - uses global Cloudinary config
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  // Direct upload using system-level Cloudinary
  const result = await uploadImage(file, folder);
  return NextResponse.json(result);
}
```

### Church-Specific Integration APIs
```typescript
// app/api/communications/send-sms/route.ts
import { sendBulkSMS } from "@/lib/sms";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Get church context from session or cookies
  let churchId = (session.user as any)?.churchId;
  if (!churchId) {
    const activeChurch = await prisma.church.findFirst({
      where: { isActive: true },
    });
    churchId = activeChurch?.id;
  }

  // Pass churchId to use church-specific SMS credentials
  const result = await sendBulkSMS(messages, churchId);
  return NextResponse.json(result);
}
```

## Settings Page Architecture

### System Tab (Read-Only)
Displays environment-based integrations. Only visible to SUPERADMIN.

```tsx
// app/dashboard/settings/page.tsx - System Tab
<Tabs defaultValue="system">
  <TabsList>
    <TabsTrigger value="system">System</TabsTrigger>
    <TabsTrigger value="admins">Admins</TabsTrigger>
    <TabsTrigger value="church">Church</TabsTrigger>
  </TabsList>

  <TabsContent value="system">
    {/* Read-only display of ENV variables */}
    <Card>
      <CardHeader>
        <CardTitle>AWS Cognito</CardTitle>
        <CardDescription>User authentication (configured in environment)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Region</Label>
          <Input value={process.env.COGNITO_REGION} disabled />
        </div>
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

### Church Tab (Editable)
Allows church admins to configure their church-specific integrations.

```tsx
// app/dashboard/settings/page.tsx - Church Tab
<TabsContent value="church">
  {/* Editable church-specific settings */}
  <Card>
    <CardHeader>
      <CardTitle>SMS Integration</CardTitle>
      <CardDescription>Configure Afrika's Talking for your church</CardDescription>
    </CardHeader>
    <CardContent>
      <form onSubmit={saveSmsSettings}>
        <Input name="apiKey" placeholder="API Key" />
        <Input name="username" placeholder="Username" />
        <Input name="senderId" placeholder="Sender ID" />
        <Button type="submit">Save SMS Settings</Button>
      </form>
    </CardContent>
  </Card>
</TabsContent>
```

## Multi-Tenancy Support

### SUPERADMIN Context
```typescript
// SUPERADMIN can select any church and configure their settings
const [selectedChurch, setSelectedChurch] = useState<string | null>(null);

// Fetch settings for selected church
const fetchSettings = async () => {
  const res = await fetch(`/api/settings?churchId=${selectedChurch}`);
  const data = await res.json();
  // Display church-specific settings
};

// Save settings for selected church
const saveSettings = async (key: string, value: any) => {
  await fetch("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      churchId: selectedChurch,
      key,
      value: JSON.stringify(value),
    }),
  });
};
```

### Church Admin Context
```typescript
// Church ADMIN can only configure their own church
const session = await getServerSession(authOptions);
const churchId = (session.user as any)?.churchId;

// Fetch settings for current church
const fetchSettings = async () => {
  const res = await fetch("/api/settings"); // Uses session churchId
  const data = await res.json();
};
```

## Migration Guide

### Converting System-Level to Church-Specific

If you need to convert a system-level integration to church-specific:

1. **Remove from `.env`**:
   ```env
   # Remove these
   SMS_API_KEY=xxx
   SMS_USERNAME=xxx
   ```

2. **Add to Database**:
   ```sql
   INSERT INTO "ChurchSetting" (id, "churchId", key, value, type)
   VALUES (
     'setting-id',
     'church-id',
     'sms',
     '{"apiKey":"xxx","username":"xxx"}',
     'json'
   );
   ```

3. **Update Library Function**:
   ```typescript
   // Before: Direct env access
   const apiKey = process.env.SMS_API_KEY;

   // After: Database lookup with churchId
   async function getSMSSettings(churchId?: string) {
     const church = await prisma.church.findFirst({
       where: churchId ? { id: churchId } : { isActive: true },
       include: { settings: { where: { key: "sms" } } },
     });
     return JSON.parse(church.settings[0].value);
   }
   ```

### Converting Church-Specific to System-Level

If you need to convert a church-specific integration to system-level:

1. **Add to `.env`**:
   ```env
   INTEGRATION_API_KEY=xxx
   INTEGRATION_SECRET=xxx
   ```

2. **Update Library**:
   ```typescript
   // Remove database lookup
   // Use direct env access
   const apiKey = process.env.INTEGRATION_API_KEY;
   ```

3. **Remove from Database** (optional):
   ```sql
   DELETE FROM "ChurchSetting" WHERE key = 'integration_name';
   ```

## Decision Matrix

Use this matrix to decide where an integration should be stored:

| Question | System-Level | Church-Specific |
|----------|--------------|-----------------|
| Does each church need their own account? | ❌ | ✅ |
| Does the service have per-account billing? | ❌ | ✅ |
| Is configuration shared across all churches? | ✅ | ❌ |
| Can credentials be reused safely? | ✅ | ❌ |
| Does the service support multi-tenancy natively? | ✅ | ❌ |

**Examples**:
- **Cloudinary**: System-level (one account, organize by folders per church)
- **AWS Cognito**: System-level (one user pool, all churches share)
- **SMS**: Church-specific (each church has their own Afrika's Talking account)
- **M-Pesa**: Church-specific (each church has their own Paybill/Till number)
- **Email**: Church-specific (each church sends from their own domain)

## Best Practices

1. **Default Behavior**: All church-specific functions should accept an optional `churchId` parameter and fall back to the active church if not provided.

2. **Error Handling**: Always handle missing configurations gracefully:
   ```typescript
   const settings = await getSMSSettings(churchId);
   if (!settings) {
     return { 
       success: false, 
       error: "SMS not configured. Please configure in Settings." 
     };
   }
   ```

3. **Caching**: Cache access tokens and frequently accessed data:
   ```typescript
   let cachedToken: { token: string; expiry: number } | null = null;
   if (cachedToken && Date.now() < cachedToken.expiry) {
     return cachedToken.token;
   }
   ```

4. **Security**: Never expose sensitive credentials in API responses:
   ```typescript
   // ❌ Bad
   return NextResponse.json({ apiKey: settings.apiKey });

   // ✅ Good
   return NextResponse.json({ configured: !!settings.apiKey });
   ```

5. **Testing**: Use church-specific test credentials for each integration:
   ```json
   {
     "churchId": "test-church",
     "key": "sms",
     "value": "{\"apiKey\":\"test-key\",\"username\":\"sandbox\"}"
   }
   ```

## Future Integrations

When adding new integrations, follow this checklist:

- [ ] Determine if system-level or church-specific (use Decision Matrix)
- [ ] Create library file (`lib/integration-name.ts`)
- [ ] Add settings getter function with `churchId` parameter (if church-specific)
- [ ] Add to Settings page UI (System or Church tab)
- [ ] Create API routes with proper church context
- [ ] Add to integration status check
- [ ] Update documentation
- [ ] Add test credentials for each church
- [ ] Implement error handling for missing configuration

## Troubleshooting

### SMS/Email/M-Pesa Not Working
1. Check if church has settings configured:
   ```sql
   SELECT * FROM "ChurchSetting" WHERE "churchId" = 'xxx' AND key = 'sms';
   ```

2. Verify JSON is valid:
   ```typescript
   const settings = JSON.parse(settingValue);
   console.log(settings);
   ```

3. Check church context is being passed:
   ```typescript
   console.log("[Debug] Church ID:", churchId);
   const settings = await getSMSSettings(churchId);
   console.log("[Debug] Settings:", settings);
   ```

### System Integration Not Working
1. Check `.env` file has all required variables
2. Restart Next.js dev server after changing `.env`
3. Verify environment variables are loaded:
   ```typescript
   console.log("Cognito Region:", process.env.COGNITO_REGION);
   ```

## Summary

- **System Integrations**: `.env` → Used by all churches → Configured once
- **Church Integrations**: `ChurchSetting` table → Per church → Configured by admins
- **Pattern**: All church-specific library functions accept optional `churchId` parameter
- **Settings UI**: System tab (read-only) vs Church tab (editable)
- **Multi-tenancy**: SUPERADMIN can manage all churches, Admins manage their own
