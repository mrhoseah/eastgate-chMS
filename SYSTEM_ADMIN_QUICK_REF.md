# System Admin Quick Reference

## Access URL
```
/sys-591f98aa001826fc
```

## Main Features

| Feature | Route | Description |
|---------|-------|-------------|
| **Dashboard** | `/sys-591f98aa001826fc` | Overview with stats and quick actions |
| **Churches** | `/sys-591f98aa001826fc/churches` | CRUD for all churches |
| **System Admins** | `/sys-591f98aa001826fc/system-admins` | Manage SUPERADMIN users |
| **Analytics** | `/sys-591f98aa001826fc/analytics` | System-wide metrics and KPIs |
| **Audit Logs** | `/sys-591f98aa001826fc/audit-logs` | Complete action history |
| **Announcements** | `/sys-591f98aa001826fc/announcements` | System communications |
| **Settings** | `/sys-591f98aa001826fc/settings` | Global configurations |
| **Invitations** | `/sys-591f98aa001826fc/invite` | Invite church admins |

## Key Capabilities

### Church Management
- ✅ Create/Edit/Delete churches
- ✅ Toggle active status
- ✅ Mark as sponsored
- ✅ Set unlimited use
- ✅ View subscription plans

### System Admins
- ✅ Create SUPERADMIN accounts
- ✅ Set temporary passwords
- ✅ Delete administrators
- ✅ View admin list

### Analytics
- 📊 Total/Active churches
- 📈 Monthly growth stats
- 💰 Subscription distribution
- 👑 Sponsored churches
- 🏥 System health

### Audit Logs
- 🔍 Search and filter
- 📥 Export to CSV
- 🎯 Filter by action/entity
- 📅 Timestamp tracking
- 🌐 IP address logging

### Announcements
- 📢 5 priority levels
- 🎯 Targeted audiences
- 📌 Pin important items
- ⏰ Schedule publishing
- 📊 Read tracking

### Settings
- ⚙️ 5 categories
- 🔢 5 data types
- 🔒 Public/Private flags
- ✏️ Editable flags
- 📝 Help text

## Security Features

| Layer | Protection |
|-------|------------|
| **Route** | Obfuscated URL |
| **Middleware** | Auto-redirect non-SUPERADMIN |
| **API** | Role check on every request |
| **Audit** | All actions logged |
| **Session** | NextAuth + Cognito |

## Database Models

### New Models Added
- ✅ `AuditLog` - Action history
- ✅ `SystemSetting` - Global config
- ✅ `SystemAnnouncement` - Communications
- ✅ `SystemAnnouncementRead` - Read tracking

### Updated Models
- ✅ `Church` - Added isSponsored, unlimitedUse
- ✅ `User` - Already has SUPERADMIN role

## API Endpoints

### Churches
```typescript
GET    /api/admin/churches
POST   /api/admin/churches
GET    /api/admin/churches/[id]
PUT    /api/admin/churches/[id]
DELETE /api/admin/churches/[id]
PATCH  /api/admin/churches/[id]/toggle-status
```

### System Admins
```typescript
GET    /api/admin/system-admins
POST   /api/admin/system-admins
DELETE /api/admin/system-admins/[id]
```

### Analytics
```typescript
GET /api/admin/analytics
```

### Audit Logs
```typescript
GET /api/admin/audit-logs?limit=100&offset=0
```

### Settings
```typescript
GET /api/admin/settings
POST /api/admin/settings
PUT /api/admin/settings/[id]
```

### Announcements
```typescript
GET    /api/admin/announcements
POST   /api/admin/announcements
PUT    /api/admin/announcements/[id]
DELETE /api/admin/announcements/[id]
PATCH  /api/admin/announcements/[id]/pin
PATCH  /api/admin/announcements/[id]/publish
```

## Quick Commands

### Database Migration
```bash
npx prisma db push
npx prisma generate
```

### Create SUPERADMIN (SQL)
```sql
UPDATE "User" 
SET role = 'SUPERADMIN', "canLogin" = true 
WHERE email = 'admin@example.com';
```

### Check Audit Logs (SQL)
```sql
SELECT * FROM "AuditLog" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### View System Settings (SQL)
```sql
SELECT key, value, category FROM "SystemSetting" 
ORDER BY category, key;
```

## Development Workflow

1. **Update Schema**
   ```bash
   # Edit prisma/schema.prisma
   npx prisma db push
   ```

2. **Create Feature**
   ```typescript
   // Add page: app/sys-591f98aa001826fc/feature/page.tsx
   // Add API: app/api/admin/feature/route.ts
   // Add audit logging in API
   ```

3. **Update Dashboard**
   ```typescript
   // Add link in app/sys-591f98aa001826fc/page.tsx
   // Add icon import
   ```

4. **Test**
   - Login as SUPERADMIN
   - Navigate to new feature
   - Verify audit log created
   - Test non-SUPERADMIN blocked

## Common Tasks

### Add New System Setting
1. Go to `/sys-591f98aa001826fc/settings`
2. Click "Add Setting"
3. Fill form (key, label, value, type, category)
4. Save

### Send System Announcement
1. Go to `/sys-591f98aa001826fc/announcements`
2. Click "Create Announcement"
3. Set priority and target audience
4. Publish

### Audit Recent Changes
1. Go to `/sys-591f98aa001826fc/audit-logs`
2. Filter by action/entity
3. Review changes
4. Export if needed

### Manage Churches
1. Go to `/sys-591f98aa001826fc/churches`
2. Search/filter churches
3. Edit/toggle status/delete
4. View stats

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't access `/sys-591f98aa001826fc` | Check user role is SUPERADMIN |
| 403 Forbidden on API | Verify session and role |
| Audit logs not created | Check prisma client import |
| Settings won't save | Verify isEditable = true |
| Announcements not visible | Check isPublished and publishAt |

## Need Help?

Refer to: `SYSTEM_ADMIN_GUIDE.md` for detailed documentation.
