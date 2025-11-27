# System-Wide Communication Feature

## Overview
Added comprehensive system-wide communication capabilities for SUPERADMIN to manage all churches, admins, and send announcements across the entire platform.

## Features Added

### 1. System Announcements
**Location**: `/admin/announcements`

SUPERADMIN can create, edit, and manage system-wide announcements with:
- **Priority Levels**: Low, Normal, High, Urgent, Critical
- **Categories**: General, Maintenance, Update, Security, Billing
- **Target Audience**: 
  - All Users (everyone on the platform)
  - Super Admins Only
  - Church Admins (all church administrators)
  - Specific Churches (select which churches see the announcement)
- **Scheduling**: Publish immediately or schedule for future date/time
- **Expiration**: Set expiration date for time-sensitive announcements
- **Pinning**: Pin important announcements to the top
- **Read Tracking**: Track which users have read announcements

### 2. System Announcements Bell
**Location**: Dashboard header (all users)

- Bell icon in header shows unread system announcements
- Notification badge displays unread count
- Side panel displays announcements with:
  - Priority badges
  - Category labels
  - Pin indicators
  - Author information
  - Mark as read functionality

### 3. Database Schema

#### SystemAnnouncement Table
```prisma
model SystemAnnouncement {
  id             String    @id @default(cuid())
  title          String
  content        String
  authorId       String
  priority       String    // low, normal, high, urgent, critical
  targetAudience String    // all, superadmins, church_admins, specific_churches
  targetChurches String?   // Comma-separated church IDs
  category       String    // general, maintenance, update, security, billing
  publishAt      DateTime?
  expiresAt      DateTime?
  isPublished    Boolean
  isPinned       Boolean
  createdAt      DateTime
  updatedAt      DateTime
}
```

#### SystemAnnouncementRead Table
```prisma
model SystemAnnouncementRead {
  id                   String
  systemAnnouncementId String
  userId               String
  readAt               DateTime
}
```

## API Routes

### System Announcements Management (SUPERADMIN Only)
- **GET** `/api/admin/announcements` - Fetch all system announcements
- **POST** `/api/admin/announcements` - Create new announcement
- **GET** `/api/admin/announcements/[id]` - Get single announcement
- **PUT** `/api/admin/announcements/[id]` - Update announcement
- **DELETE** `/api/admin/announcements/[id]` - Delete announcement

### User-Facing Announcements
- **GET** `/api/system-announcements` - Fetch announcements visible to current user
- **POST** `/api/system-announcements` - Mark announcement as read

### Church Management
- **GET** `/api/admin/churches` - Fetch all churches (for selecting target churches)

## Usage Examples

### Creating System Announcements

1. **System-Wide Maintenance Notice**:
   - Title: "Scheduled Maintenance - Sunday 3 AM"
   - Priority: High
   - Category: Maintenance
   - Target: All Users
   - Schedule: Saturday evening
   - Expiration: Monday morning

2. **Church Admin Communication**:
   - Title: "New Bulk SMS Feature Available"
   - Priority: Normal
   - Category: Update
   - Target: Church Admins
   - Pin: Yes

3. **Specific Churches Communication**:
   - Title: "Payment Integration Update Required"
   - Priority: Urgent
   - Category: Billing
   - Target: Specific Churches (select from list)

4. **Super Admin Only**:
   - Title: "Database Migration Scheduled"
   - Priority: Critical
   - Category: Maintenance
   - Target: Super Admins Only

### Viewing Announcements

**For SUPERADMIN**:
- Access full management interface at `/admin/announcements`
- Create, edit, delete, pin/unpin announcements
- View read statistics
- Toggle publish status

**For Church Admins**:
- See announcements targeted to them in bell notification
- View announcements targeted to "All Users" or "Church Admins"
- View announcements targeted to their specific church

**For Regular Users**:
- See announcements targeted to "All Users"
- Receive notifications for new announcements
- Mark announcements as read

## Components

### System Announcements Page
**File**: `app/admin/announcements/page.tsx`
- Full CRUD interface for announcements
- Filter and search capabilities
- Priority color coding
- Pin/unpin toggle
- Publish/unpublish toggle
- Read statistics

### System Announcements Bell
**File**: `components/system-announcements-bell.tsx`
- Header notification bell
- Unread count badge
- Side panel with announcement list
- Mark as read functionality
- Priority badges and category labels

## Integration with Existing Features

### Dashboard Header
Updated `components/dashboard-header.tsx` to include:
```tsx
<SystemAnnouncementsBell />
```

### Admin Dashboard
Updated `app/admin/page.tsx` to include quick action link:
```tsx
<Button asChild variant="outline">
  <Link href="/admin/announcements">
    <Megaphone className="h-8 w-8 mb-2" />
    <span>Announcements</span>
  </Link>
</Button>
```

## Permission System

### SUPERADMIN Permissions
- Create, edit, delete system announcements
- View all announcements
- Access announcement management interface
- Select target audiences
- View read statistics

### Church Admin Permissions
- View announcements targeted to them
- Mark announcements as read
- No creation/editing privileges

### Regular User Permissions
- View announcements targeted to all users
- Mark announcements as read

## Use Cases

### System Maintenance
```
Title: Scheduled System Maintenance
Priority: High
Category: Maintenance
Target: All Users
Content: "The system will be undergoing scheduled maintenance on Sunday, 
         December 1st from 3:00 AM to 5:00 AM EAT. During this time, 
         the system may be unavailable. We apologize for any inconvenience."
Schedule: Friday evening
Expiration: Monday morning
```

### Feature Announcements
```
Title: New Feature: Group Rotation Management
Priority: Normal
Category: Update
Target: Church Admins
Content: "We're excited to announce a new feature for managing group 
         meeting rotations. Church admins can now automatically assign 
         hosts for small group meetings. Check Settings > Groups."
Pin: Yes
```

### Security Alerts
```
Title: Important: Update Your Password
Priority: Critical
Category: Security
Target: Specific Churches
Content: "We detected unusual activity. Please update your password 
         immediately and enable two-factor authentication in your profile."
Expiration: 48 hours
```

### Billing Notifications
```
Title: Subscription Renewal Reminder
Priority: Normal
Category: Billing
Target: Church Admins
Content: "Your church's subscription will renew on December 15th. 
         Please ensure your payment method is up to date."
```

## Benefits

1. **Centralized Communication**: SUPERADMIN can communicate with all churches from one place
2. **Targeted Messaging**: Send relevant announcements to specific audiences
3. **Read Tracking**: Know who has seen important announcements
4. **Scheduling**: Schedule announcements for future dates
5. **Priority Management**: Highlight urgent or critical announcements
6. **Persistent Visibility**: Users see announcements until marked as read
7. **Organized by Category**: Easy to filter and find specific types of announcements

## Future Enhancements

- Email/SMS notifications for critical announcements
- Rich text editor for formatted content
- Attachment support (PDFs, images)
- Comment/feedback system
- Announcement templates
- Analytics dashboard (views, engagement metrics)
- Multi-language support
- Announcement archives
- Search and filter by date range
- Bulk operations (delete, publish multiple)

## Testing

### Test System Announcements
1. Login as SUPERADMIN (mrhoseah@gmail.com)
2. Navigate to `/admin/announcements`
3. Create announcement with different priorities and targets
4. Verify announcements appear in bell notification
5. Test mark as read functionality
6. Test scheduling and expiration
7. Test pin/unpin functionality

### Test as Church Admin
1. Login as Church ADMIN (admin@eastgatechapel.org)
2. Check bell notification for system announcements
3. Verify only targeted announcements are visible
4. Test mark as read
5. Verify no access to `/admin/announcements` page

## Files Modified/Created

### New Files
- `app/admin/announcements/page.tsx` - Announcement management page
- `app/api/admin/announcements/route.ts` - Announcement CRUD API
- `app/api/admin/announcements/[id]/route.ts` - Single announcement API
- `app/api/admin/churches/route.ts` - Churches list API
- `app/api/system-announcements/route.ts` - User-facing announcements API
- `components/system-announcements-bell.tsx` - Notification bell component

### Modified Files
- `prisma/schema.prisma` - Added SystemAnnouncement and SystemAnnouncementRead models
- `components/dashboard-header.tsx` - Added SystemAnnouncementsBell
- `app/admin/page.tsx` - Added Announcements quick action link

## Dependencies
- No new dependencies required
- Uses existing UI components from shadcn/ui
- Uses existing authentication and authorization patterns

## Related Documentation
- [Integration Architecture](./INTEGRATION_ARCHITECTURE.md)
- [Roles & Permissions Guide](./ROLES_PERMISSIONS_GUIDE.md)
- [Admin Setup](./ADMIN_SETUP.md)
