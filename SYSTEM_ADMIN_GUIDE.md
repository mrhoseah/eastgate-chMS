# System Administration Guide

## Overview

This guide covers the comprehensive system administration features for managing the ChMS platform at the system level. Only users with the `SUPERADMIN` role can access these features.

## Accessing System Admin Panel

The system admin panel is accessible via an obfuscated URL for security:
```
https://yourdomain.com/sys-591f98aa001826fc
```

**Security Features:**
- Obfuscated route (randomly generated hex)
- Middleware protection (automatic redirect if not SUPERADMIN)
- Session-based authentication
- Audit logging for all actions

## Core Features

### 1. Church Management (`/sys-591f98aa001826fc/churches`)

Comprehensive CRUD interface for managing all churches in the system.

**Features:**
- ✅ Create new churches
- ✅ Edit church information (name, contact, location, settings)
- ✅ Toggle church active/inactive status
- ✅ Delete churches (with confirmation)
- ✅ Search and filter churches
- ✅ View church statistics (campuses, subscription plans)
- ✅ Mark churches as sponsored (free/subsidized accounts)
- ✅ Set unlimited use flags

**Church Fields:**
- Basic: Name, denomination, email, phone
- Location: Address, city, state, zip, country
- Configuration: Timezone, language, currency
- Status: Active/inactive, sponsored, unlimited use

**Stats Display:**
- Total churches
- Active churches
- Sponsored churches
- Inactive churches

### 2. System Administrators (`/sys-591f98aa001826fc/system-admins`)

Manage system-level administrators (not tied to specific churches).

**Features:**
- ✅ Create new SUPERADMIN users
- ✅ View all system administrators
- ✅ Delete system administrators
- ✅ Set temporary passwords
- ✅ Enable/disable login access

**Admin Fields:**
- First name, last name
- Email, phone
- Temporary password (for new accounts)
- Status and login permissions

### 3. System Analytics (`/sys-591f98aa001826fc/analytics`)

System-wide metrics and performance indicators.

**Metrics Displayed:**
- 📊 Total churches
- 📈 Active churches (with percentage)
- 🏢 Total campuses (average per church)
- 👥 System administrators count
- 📅 Recent activity (new churches/admins this month)

**Subscription Distribution:**
- Free plan churches
- Basic plan churches  
- Premium plan churches
- Enterprise plan churches
- Visual percentage breakdowns

**Sponsored Churches:**
- Total sponsored churches
- Percentage of all churches
- Paying vs sponsored comparison

**System Health:**
- Database status
- API services status
- Uptime statistics

### 4. Audit Logs (`/sys-591f98aa001826fc/audit-logs`)

Complete audit trail of all system administrator actions.

**Features:**
- ✅ View all admin actions
- ✅ Filter by action type (CREATE, UPDATE, DELETE, etc.)
- ✅ Filter by entity (Church, User, SystemSetting, etc.)
- ✅ Search by user name, description, entity name
- ✅ Export logs to CSV
- ✅ View IP addresses and timestamps

**Tracked Actions:**
- `CREATE` - Entity creation (green)
- `UPDATE` - Entity updates (blue)
- `DELETE` - Entity deletion (red)
- `LOGIN` / `LOGOUT` - Authentication events (gray)
- `VIEW` - Viewing sensitive data (purple)
- `EXPORT` - Data exports (yellow)
- `TOGGLE_STATUS` - Status changes (orange)
- `INVITE` - Invitation sent (teal)
- `REVOKE` - Permission/access revoked (red)
- `GRANT_PERMISSION` - Permission granted (green)
- `SYSTEM_SETTING_CHANGE` - System config changes (blue)

**Log Information:**
- Timestamp
- User who performed action
- Action type
- Affected entity and entity name
- Description
- IP address
- User agent (stored in metadata)

**Statistics:**
- Total logs count
- Create actions count
- Update actions count
- Delete actions count

### 5. System Announcements (`/sys-591f98aa001826fc/announcements`)

System-wide communication platform for SUPERADMIN to communicate with churches.

**Features:**
- ✅ Create announcements
- ✅ Set priority levels (low, normal, high, urgent, critical)
- ✅ Choose categories (general, maintenance, update, security, billing)
- ✅ Target specific audiences (all, superadmins, church_admins, specific_churches)
- ✅ Pin important announcements
- ✅ Publish/unpublish
- ✅ Schedule announcements (publishAt, expiresAt)
- ✅ Track read status

**Priority Levels:**
- 🔴 Critical (red)
- 🟠 Urgent (orange)
- 🟡 High (yellow)
- 🔵 Normal (blue)
- ⚪ Low (gray)

**Categories:**
- General announcements
- Maintenance notifications
- System updates
- Security alerts
- Billing information

**Target Audiences:**
- All users
- SUPERADMIN only
- Church admins
- Specific churches (select multiple)

### 6. System Settings (`/sys-591f98aa001826fc/settings`)

Global system configuration and feature flags.

**Features:**
- ✅ Create new settings
- ✅ Edit existing settings
- ✅ Group settings by category
- ✅ Set data types (STRING, NUMBER, BOOLEAN, JSON, ARRAY)
- ✅ Mark settings as public (visible to church admins)
- ✅ Mark settings as editable (can be changed via UI)

**Categories:**
- General - System-wide settings
- Security - Authentication and access control
- Billing - Payment and subscription settings
- Features - Feature flags and toggles
- Limits - Usage limits and quotas

**Setting Fields:**
- Key (unique identifier, immutable after creation)
- Label (display name)
- Value (stored as string, parsed by type)
- Type (STRING, NUMBER, BOOLEAN, JSON, ARRAY)
- Category
- Description (help text)
- Is Public (visible to church admins)
- Is Editable (can be modified via UI)

**Example Settings:**
```
Key: max_churches_per_month
Label: Maximum Churches Per Month
Value: 50
Type: NUMBER
Category: limits
Description: Maximum number of new churches allowed per month
Is Public: false
Is Editable: true
```

### 7. Invitation System (`/sys-591f98aa001826fc/invite`)

Send invitations to church administrators (existing from previous implementation).

**Features:**
- ✅ Invite church admins via email
- ✅ Track invitation status
- ✅ Resend invitations
- ✅ Revoke pending invitations

## API Routes

All system admin API routes require `SUPERADMIN` role and are protected by middleware.

### Church Management
- `GET /api/admin/churches` - List all churches
- `POST /api/admin/churches` - Create new church
- `GET /api/admin/churches/[id]` - Get church details
- `PUT /api/admin/churches/[id]` - Update church
- `DELETE /api/admin/churches/[id]` - Delete church
- `PATCH /api/admin/churches/[id]/toggle-status` - Toggle active status

### System Admins
- `GET /api/admin/system-admins` - List system admins
- `POST /api/admin/system-admins` - Create system admin
- `DELETE /api/admin/system-admins/[id]` - Delete system admin

### Analytics
- `GET /api/admin/analytics` - Get system-wide statistics

### Audit Logs
- `GET /api/admin/audit-logs` - Get audit logs (with pagination)

### System Settings
- `GET /api/admin/settings` - List all settings
- `POST /api/admin/settings` - Create new setting
- `PUT /api/admin/settings/[id]` - Update setting

### Announcements
- `GET /api/admin/announcements` - List announcements
- `POST /api/admin/announcements` - Create announcement
- `PUT /api/admin/announcements/[id]` - Update announcement
- `DELETE /api/admin/announcements/[id]` - Delete announcement
- `PATCH /api/admin/announcements/[id]/pin` - Toggle pin
- `PATCH /api/admin/announcements/[id]/publish` - Toggle publish

## Database Schema

### AuditLog
```prisma
model AuditLog {
  id          String      @id @default(cuid())
  userId      String      // SUPERADMIN who performed action
  userName    String      // Cached name
  action      AuditAction // Enum
  entity      String      // e.g., "Church", "User"
  entityId    String?
  entityName  String?
  description String
  metadata    Json?       // Additional data
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime    @default(now())
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  VIEW
  EXPORT
  TOGGLE_STATUS
  INVITE
  REVOKE
  GRANT_PERMISSION
  REVOKE_PERMISSION
  SYSTEM_SETTING_CHANGE
}
```

### SystemSetting
```prisma
model SystemSetting {
  id          String      @id @default(cuid())
  key         String      @unique
  value       String
  type        SettingType @default(STRING)
  category    String      @default("general")
  label       String
  description String?
  isPublic    Boolean     @default(false)
  isEditable  Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum SettingType {
  STRING
  NUMBER
  BOOLEAN
  JSON
  ARRAY
}
```

### SystemAnnouncement
```prisma
model SystemAnnouncement {
  id             String   @id @default(cuid())
  title          String
  content        String
  authorId       String
  priority       String   @default("normal")
  targetAudience String   @default("all")
  targetChurches String?  // Comma-separated IDs
  category       String   @default("general")
  publishAt      DateTime?
  expiresAt      DateTime?
  isPublished    Boolean  @default(false)
  isPinned       Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## Security

### Authentication
- NextAuth session-based authentication
- AWS Cognito integration
- Role-based access control (RBAC)

### Authorization
- Middleware protection on `/sys-591f98aa001826fc/*` routes
- Middleware protection on `/api/admin/*` routes
- Server-side role checks in all API routes
- Automatic redirect for non-SUPERADMIN users

### Audit Trail
- All CRUD operations logged
- IP address tracking
- User agent tracking
- Metadata preservation (old/new values)

### Route Obfuscation
- Randomly generated hex route (`591f98aa001826fc`)
- Not easily guessable or discoverable
- Can be regenerated if needed

## Multi-Tenancy

### Church-Specific Integrations
All church-specific integrations (SMS, M-Pesa, Email) are stored in the database per church:

```typescript
// Example: Send SMS for a specific church
await sendSMS(phoneNumber, message, churchId);

// Gets church-specific credentials from database
const settings = await getSMSSettings(churchId);
```

### System-Level Integrations
System-level integrations (Cognito, Cloudinary) use environment variables:

```env
AWS_REGION=
AWS_COGNITO_USER_POOL_ID=
AWS_COGNITO_CLIENT_ID=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Dashboard Navigation

SUPERADMIN users can switch between:
1. **System Dashboard** - `/sys-591f98aa001826fc` (system-wide management)
2. **Church Dashboards** - `/dashboard` (manage specific churches)

Use the church selector in the sidebar to switch contexts.

## Best Practices

### For System Administrators

1. **Regular Monitoring**
   - Check analytics dashboard daily
   - Review audit logs weekly
   - Monitor system health indicators

2. **Church Management**
   - Verify church information before activation
   - Set appropriate subscription plans
   - Monitor sponsored church usage

3. **Security**
   - Keep the obfuscated route URL confidential
   - Review audit logs for suspicious activity
   - Limit number of SUPERADMIN accounts

4. **Communication**
   - Use appropriate priority levels for announcements
   - Target announcements to specific audiences
   - Schedule maintenance announcements in advance

5. **Settings Management**
   - Document all custom settings
   - Test settings changes in staging first
   - Mark critical settings as non-editable

### For Developers

1. **Adding New Features**
   - Always add audit logging for sensitive operations
   - Use TypeScript for type safety
   - Follow existing API route patterns

2. **Database Changes**
   - Update Prisma schema
   - Run `npx prisma db push`
   - Update TypeScript types

3. **Testing**
   - Test with SUPERADMIN role
   - Test access restrictions (non-SUPERADMIN should be blocked)
   - Test audit log creation

## Troubleshooting

### Cannot Access System Admin Panel
- Verify your user has `role: SUPERADMIN` in database
- Check session is valid (re-login if needed)
- Ensure middleware is not blocking requests

### Audit Logs Not Being Created
- Check Prisma client is imported correctly
- Verify `auditLog` table exists in database
- Check for errors in console/logs

### Settings Not Saving
- Verify setting is marked as `isEditable: true`
- Check for unique key constraint violations
- Review API route error responses

### Announcements Not Showing
- Check `isPublished` is `true`
- Verify `publishAt` date is in the past
- Check `targetAudience` matches user role

## Future Enhancements

- [ ] Dashboard activity widgets with real-time updates
- [ ] Advanced analytics with charts (Chart.js/Recharts)
- [ ] Bulk operations for churches
- [ ] System backup and restore functionality
- [ ] Email notification system for critical events
- [ ] Two-factor authentication for SUPERADMIN
- [ ] API rate limiting and monitoring
- [ ] Advanced permission system (granular permissions)

## Support

For system administration support, contact the development team or refer to the main README.md.
