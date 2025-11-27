# Church Sponsorship System

A complete sponsorship application and management system that allows churches to apply for sponsored access to the church management system.

## Overview

The sponsorship system enables:
- **Application Link Generation**: SUPERADMIN and ADMIN users can generate unique application links
- **Church Applications**: Churches submit applications through a public form
- **Admin Review**: Applications are reviewed and approved/rejected by admins
- **Flexible Sponsorship Periods**: Support for time-limited (days-based) or unlimited sponsorships
- **Automatic Church Creation**: Approved applications automatically create church accounts

## Architecture

### Database Models

#### 1. `SponsorshipApplication`
Stores submitted applications from churches.

```prisma
model SponsorshipApplication {
  id              String   @id @default(cuid())
  token           String   @unique  // Unique application link token
  
  // Church Information
  churchName      String
  denomination    String?
  
  // Contact Information
  contactName     String
  contactEmail    String
  contactPhone    String?
  
  // Location
  address         String?
  city            String?
  state           String?
  country         String?
  zipCode         String?
  
  // Additional Details
  website         String?
  memberCount     Int?
  reason          String
  additionalInfo  Json?
  
  submittedAt     DateTime?
  createdAt       DateTime @default(now())
}
```

#### 2. `Sponsorship`
Active sponsorship records for approved churches.

```prisma
model Sponsorship {
  id                String             @id @default(cuid())
  churchId          String             @unique
  church            Church             @relation(fields: [churchId], references: [id])
  
  applicationToken  String
  status            SponsorshipStatus
  
  // Period Configuration
  periodDays        Int?               // Number of days (null if unlimited)
  isUnlimited       Boolean            @default(false)
  startDate         DateTime
  endDate           DateTime?          // Null if unlimited
  
  // Approval Information
  approvedById      String
  approvedBy        User               @relation("ApprovedSponsorships", fields: [approvedById], references: [id])
  approvedAt        DateTime           @default(now())
  
  // Notes
  rejectionReason   String?
  notes             String?
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}
```

#### 3. `SponsorshipStatus` Enum

```prisma
enum SponsorshipStatus {
  PENDING
  APPROVED
  REJECTED
  ACTIVE
  EXPIRED
  CANCELLED
}
```

### API Endpoints

#### 1. Generate Application Link
**Endpoint**: `POST /api/admin/sponsorship/generate-link`  
**Auth**: SUPERADMIN or ADMIN only  
**Description**: Generates a unique application token and URL

**Request**:
```json
{}
```

**Response**:
```json
{
  "token": "sp_1234567890_abc123",
  "applicationUrl": "https://yourdomain.com/apply-sponsorship?token=sp_1234567890_abc123"
}
```

#### 2. Submit Application
**Endpoint**: `POST /api/sponsorship/apply`  
**Auth**: Public (no auth required)  
**Description**: Submits a sponsorship application

**Request**:
```json
{
  "token": "sp_1234567890_abc123",
  "churchName": "Grace Community Church",
  "denomination": "Non-denominational",
  "contactName": "John Smith",
  "contactEmail": "john@gracechurch.org",
  "contactPhone": "+1234567890",
  "address": "123 Church Street",
  "city": "Springfield",
  "state": "IL",
  "country": "USA",
  "zipCode": "62701",
  "website": "https://gracechurch.org",
  "memberCount": 150,
  "reason": "We are a small church looking to improve our management systems..."
}
```

**Response**:
```json
{
  "success": true,
  "applicationId": "clx1234567",
  "message": "Application submitted successfully"
}
```

#### 3. Verify Application Token
**Endpoint**: `GET /api/sponsorship/apply?token={token}`  
**Auth**: Public  
**Description**: Checks if a token is valid and if it's already been submitted

**Response**:
```json
{
  "valid": true,
  "alreadySubmitted": false
}
```

#### 4. List Applications
**Endpoint**: `GET /api/admin/sponsorship/applications?status={status}`  
**Auth**: SUPERADMIN or ADMIN  
**Description**: Lists all sponsorship applications with optional status filter

**Query Parameters**:
- `status` (optional): Filter by submission status (`submitted` or empty)

**Response**:
```json
{
  "applications": [
    {
      "id": "clx1234567",
      "churchName": "Grace Community Church",
      "contactName": "John Smith",
      "contactEmail": "john@gracechurch.org",
      "city": "Springfield",
      "country": "USA",
      "memberCount": 150,
      "reason": "...",
      "submittedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 5. Review Application
**Endpoint**: `POST /api/admin/sponsorship/applications/[id]/review`  
**Auth**: SUPERADMIN or ADMIN  
**Description**: Approve or reject a sponsorship application

**Request (Approve)**:
```json
{
  "action": "approve",
  "periodDays": 365,        // Optional: number of days (omit for unlimited)
  "isUnlimited": false,     // Set to true for unlimited sponsorship
  "notes": "Approved based on mission alignment"
}
```

**Request (Reject)**:
```json
{
  "action": "reject",
  "rejectionReason": "Application did not meet criteria",
  "notes": "Consider reapplying in 6 months"
}
```

**Response (Approve)**:
```json
{
  "success": true,
  "church": {
    "id": "clx9876543",
    "name": "Grace Community Church",
    "email": "john@gracechurch.org"
  },
  "sponsorship": {
    "id": "clx1111111",
    "status": "ACTIVE",
    "startDate": "2024-01-15T10:30:00Z",
    "endDate": "2025-01-15T10:30:00Z",
    "isUnlimited": false
  }
}
```

## User Interface

### Admin Dashboard (`/dashboard/admin/sponsorship`)

**Features**:
- **Generate Link Tab**: Create new application links with one click
- **Applications Tab**: View and manage all submitted applications
- **Review Modal**: Approve or reject applications with detailed options

**Permissions**: Only accessible to SUPERADMIN and ADMIN roles

### Public Application Form (`/apply-sponsorship?token={token}`)

**Features**:
- **Token Verification**: Validates application link before showing form
- **Multi-Section Form**: 
  - Church Information
  - Contact Information
  - Location Details
  - Application Reason
- **Validation**: Required fields marked, email/phone validation
- **Success Screen**: Confirmation message after submission

**Access**: Public (no authentication required)

## Workflow

### 1. Admin Generates Link
1. Admin navigates to `/dashboard/admin/sponsorship`
2. Clicks "Generate New Application Link"
3. System creates unique token: `sp_{timestamp}_{random}`
4. Admin copies and shares the full URL with the church

### 2. Church Applies
1. Church clicks the application link
2. System verifies token is valid and not already used
3. Church fills out comprehensive application form
4. System saves application and shows confirmation

### 3. Admin Reviews
1. Admin views list of submitted applications
2. Clicks "Review" on a specific application
3. Reviews all submitted information
4. Chooses to:
   - **Approve**: Select sponsorship period (days or unlimited)
   - **Reject**: Provide rejection reason

### 4. On Approval
System automatically:
1. Creates a new `Church` record with application data
2. Sets `isSponsored = true` and `unlimitedUse` based on sponsorship type
3. Creates `Sponsorship` record with:
   - Status: `ACTIVE`
   - Start date: Current timestamp
   - End date: Calculated from `periodDays` (null if unlimited)
   - Approver: Current admin user ID
4. Links sponsorship to church and approver

## Sponsorship Types

### Time-Limited Sponsorship
- **Configuration**: Set `periodDays` (e.g., 365 for one year)
- **Expiration**: `endDate` = `startDate + periodDays`
- **Use Case**: Trial periods, temporary support, grant-based sponsorships

### Unlimited Sponsorship
- **Configuration**: Set `isUnlimited = true`, `periodDays = null`
- **Expiration**: Never expires (`endDate = null`)
- **Use Case**: Permanent partnerships, founding churches, special relationships

**Example: East Gate Chapel** has unlimited sponsorship as the primary/founding church.

## Setup Instructions

### 1. Database Migration
The sponsorship system requires database changes. Run:

```bash
npx prisma migrate dev --name add_sponsorship_system
npx prisma generate
```

### 2. Set Up East Gate Chapel (Optional)
If East Gate Chapel already exists and needs unlimited sponsorship:

```bash
npx tsx scripts/setup-east-gate-sponsorship.ts
```

This script:
- Finds East Gate Chapel in the database
- Creates an `ACTIVE` unlimited sponsorship
- Updates church flags (`isSponsored`, `unlimitedUse`)

### 3. Configure Routes
Ensure these routes are accessible:
- Admin dashboard: `/dashboard/admin/sponsorship` (auth required)
- Public form: `/apply-sponsorship` (no auth)

### 4. Test the System
1. Log in as SUPERADMIN or ADMIN
2. Navigate to sponsorship management
3. Generate a test application link
4. Open link in incognito/private window
5. Submit test application
6. Review and approve in admin dashboard

## Security Considerations

### Token Security
- Tokens are unique and time-stamped: `sp_{timestamp}_{random}`
- Each token can only be used once
- No authentication required for application submission (public access by design)

### Access Control
- Link generation: SUPERADMIN and ADMIN only
- Application review: SUPERADMIN and ADMIN only
- Application submission: Public (anyone with valid token)

### Data Validation
- Email format validation
- Required field enforcement
- Minimum character requirements for reason (50+ chars recommended)
- Phone number format checking (optional field)

## Future Enhancements

### Potential Features
1. **Email Notifications**:
   - Send confirmation email when application is submitted
   - Notify admin when new application arrives
   - Send approval/rejection email to applicant

2. **Application Status Tracking**:
   - Allow churches to check application status with token
   - Show review timeline and estimated response time

3. **Sponsorship Renewal**:
   - Automatic expiration warnings
   - Renewal request workflow
   - Extension approval process

4. **Analytics Dashboard**:
   - Application conversion rates
   - Average review time
   - Active sponsorships by type
   - Geographic distribution

5. **Multi-Step Review**:
   - First review by ADMIN
   - Final approval by SUPERADMIN
   - Comments/discussion thread

6. **Document Upload**:
   - Church registration documents
   - Tax-exempt status proof
   - Mission statement PDF

## Troubleshooting

### Common Issues

#### "Invalid or expired token"
- Token may have already been used
- Link may be malformed
- Generate a new link and try again

#### "Unauthorized" when generating links
- User role must be SUPERADMIN or ADMIN
- Check authentication session
- Verify user permissions in database

#### Church not created after approval
- Check Prisma client is up to date: `npx prisma generate`
- Verify database connectivity
- Check server logs for errors

#### Compilation errors
- Run `npx prisma generate` to regenerate Prisma client
- Restart TypeScript server in VS Code
- Clear Next.js cache: `rm -rf .next`

## Database Queries

### Check Active Sponsorships
```sql
SELECT 
  s.id,
  c.name as church_name,
  s.status,
  s.isUnlimited,
  s.startDate,
  s.endDate,
  u.name as approved_by
FROM "Sponsorship" s
JOIN "Church" c ON c.id = s.churchId
JOIN "User" u ON u.id = s.approvedById
WHERE s.status = 'ACTIVE';
```

### Find Expiring Sponsorships
```sql
SELECT 
  c.name,
  s.endDate,
  (s.endDate - CURRENT_TIMESTAMP) as days_remaining
FROM "Sponsorship" s
JOIN "Church" c ON c.id = s.churchId
WHERE 
  s.status = 'ACTIVE' 
  AND s.isUnlimited = false
  AND s.endDate < (CURRENT_TIMESTAMP + INTERVAL '30 days')
ORDER BY s.endDate;
```

### List Pending Applications
```sql
SELECT 
  id,
  churchName,
  contactEmail,
  submittedAt,
  reason
FROM "SponsorshipApplication"
WHERE submittedAt IS NOT NULL
ORDER BY submittedAt DESC;
```

## Support

For questions or issues with the sponsorship system:
1. Check this documentation
2. Review server logs for errors
3. Verify database schema matches Prisma schema
4. Ensure all migrations have been run
5. Test with a fresh application token

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: Church Management System Team
