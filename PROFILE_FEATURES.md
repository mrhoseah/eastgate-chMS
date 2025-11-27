# Member & Guest Profile Features

## Overview
The profile page at `/dashboard/people/[id]` provides comprehensive views for both **Members** and **Guests** with role-specific features.

## Features by User Type

### 🔵 For Members (MEMBER, PASTOR, LEADER, etc.)

#### **Overview Tab**
- **Personal Information**: Full profile with contact details, DOB with age calculation, marital status, profession, location
- **Quick Stats Cards**:
  - Total Giving (sum and count)
  - Attendance Rate (percentage with records count)
  - Group Involvement (total groups and leadership roles)
- **Recent Attendance Sidebar**: Last 5 attendance records with status badges
- **Account Details**: Login access, member since date, campus assignment

#### **Attendance Tab**
- Complete attendance history with visual timeline
- Summary statistics:
  - Total Records
  - Present count (green)
  - Absent count (red)
- Detailed records with:
  - Service type (Sunday, Midweek, etc.)
  - Full date display
  - Status badges
  - Visual indicators (colored dots)

#### **Giving History Tab**
- Comprehensive giving analytics:
  - Total contributions
  - Number of donations
  - Average gift size
  - Last gift timestamp
- Individual donation records with:
  - Category
  - Amount (formatted with KES)
  - Payment method badges
  - Date
- Green color coding for financial data

#### **Groups Tab**
- Grid view of all active group memberships
- Each group card shows:
  - Group name and type
  - Member role (with leader badge)
  - Join date
  - Clickable link to group details

#### **Family Tab**
- Visual family tree component
- Detailed family member cards:
  - **Spouse**: With profile image initials, full name
  - **Parent**: Linked to their profile
  - **Children**: With age calculation, baby icon
  - All clickable to navigate to family member profiles

---

### 🟠 For Guests (GUEST role)

#### **Overview Tab**
- **Personal Information**: Same as members
- **Quick Stats Cards**:
  - Total Visits (with last visit time)
  - Follow-up Status (pending vs total)
- **Recent Visits Sidebar**: Last 5 visits with service type and notes
- **Account Details**: Record creation date, guest status

#### **Visit History Tab**
- Full-featured visit tracking via `GuestVisitManager` component
- Record new visits with:
  - Visit date
  - Service type (Sunday, Midweek, Special Event)
  - Event association
  - Notes
  - Recorded by (automatic)
- View complete visit timeline
- Edit/delete existing visits

#### **Follow-ups Tab** (if enabled)
- Comprehensive follow-up management via `GuestFollowUpManager`
- Create follow-ups with:
  - Type (Welcome, Thank You, Invitation, etc.)
  - Method (Email, SMS, Phone Call, Visit)
  - Subject and content
  - Priority level (Low, Normal, High, Urgent)
  - Scheduled date
  - Assignment to team member
- Track follow-up status:
  - Pending (yellow)
  - Completed (green)
  - Cancelled (red)
- Filter and sort follow-ups
- Complete/cancel actions with timestamp

#### **Follow-up Toggle**
- Enable/disable follow-up tracking per guest
- Button in header for quick access
- Updates reflected immediately

---

## Common Features (All Users)

### Header Actions
- **Back Button**: Return to people list
- **Permissions Dialog**: Manage login access, role, status
- **Edit Profile**: Quick navigation to edit form
- **Follow-up Toggle**: (Guests only)

### Personal Information Card
- Profile initials in colored circle
- Full name with title (Dr, Rev, Prof, etc.)
- Status badge (Active, Inactive, Pending)
- Role badge with appropriate color
- Gender badge
- Contact information:
  - Email with icon
  - Phone with icon
  - Date of birth with age calculation
  - Marital status
  - Profession
  - Full location (residence, county, country)

### Account Details Sidebar
- Login access status
- Member since date (if applicable)
- Record creation date
- Last update timestamp
- Campus assignment

### Family Tab
- Available when family relationships exist
- Visual family tree
- Clickable family member cards
- Age calculation for children
- Profile initials for each member

### Groups Tab
- Shows all active group memberships
- Role badges (Leader vs Member)
- Group type indicators
- Join date tracking
- Direct links to group pages

---

## Technical Features

### Data Loading
- Client-side component with API fetching
- Loading spinner during data fetch
- Error handling with user-friendly messages
- Automatic redirect on 404

### API Endpoint
- `/api/people/[id]` returns complete profile data:
  - Basic user fields
  - Campus relation
  - Spouse, parent, children
  - Group memberships (with group details)
  - Donations (last 10, sorted by date)
  - Attendances (last 10, sorted by date)
  - Guest visits (all, sorted by date)
  - Guest follow-ups (all, sorted by date)

### Real-time Updates
- `fetchMember()` function refreshes data
- Called after permission updates
- Maintains current tab state

### Statistics Calculations
- Total giving: Sum of all donation amounts
- Attendance rate: (Present / Total) × 100
- Last visit time: `formatDistanceToNow` from date-fns
- Age calculations: Based on date of birth

### Conditional Rendering
- Tabs appear only when data exists
- Member vs Guest features completely separate
- Follow-up tab respects `enableFollowUps` flag
- Empty states with helpful icons and messages

---

## Component Integration

### Guest-Specific Components
- `GuestVisitManager`: Full CRUD for visit records
- `GuestFollowUpManager`: Follow-up workflow management
- `GuestFollowUpToggle`: Quick toggle in header

### Shared Components
- `UserPermissionsDialog`: Role and access management
- `FamilyTree`: Visual family relationship display
- UI components: Card, Badge, Tabs, Button, etc.

---

## Navigation Flow

```
Members List (Eye Icon)
  ↓
Profile Page (Overview Tab)
  ↓
Tabs: Overview | Attendance | Giving | Groups | Family
```

```
Guests List (Eye Icon)
  ↓
Profile Page (Overview Tab)
  ↓
Tabs: Overview | Visits | Follow-ups | Groups | Family
```

---

## Color Coding

- **Green**: Financial data, positive status, present attendance
- **Red**: Negative status, absent attendance
- **Blue**: Information, attendance rate
- **Purple**: Groups and community
- **Orange**: Follow-ups and pending actions
- **Yellow**: Warnings, pending status
- **Gray**: Neutral, inactive, disabled

---

## Future Enhancements

Possible additions:
- Export profile to PDF
- Communication history (SMS, emails sent)
- Ministry involvement tracking
- Spiritual milestones timeline
- Notes and interactions log
- Photo upload for profile picture
- QR code for quick check-in
- Print-friendly view
- Activity timeline (all events in chronological order)
- Integration with biometric systems
