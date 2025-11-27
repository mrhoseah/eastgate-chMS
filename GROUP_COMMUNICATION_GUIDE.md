# Group Communication System Guide

## Overview
The SMS communication system now supports hierarchical group targeting, allowing you to send messages to specific segments of your church organization based on group structure and leadership roles.

## Group Targeting Options

### 1. **All Members** (Default)
- Sends to all members in the selected groups
- Does NOT include members of subgroups
- Use case: Department-specific announcements

### 2. **Parent + Subgroups**
- Sends to all members in selected parent groups AND all their subgroups recursively
- Automatically includes nested subgroups (e.g., Zone → Connect Groups → Cell Groups)
- Use case: Zone-wide announcements that need to reach everyone

### 3. **Leaders Only**
- Sends ONLY to members marked as leaders in the selected groups
- Includes leaders from both parent and subgroups if multiple groups selected
- Use case: Leadership meetings, leader-specific training

### 4. **Parent Group Leaders**
- Sends ONLY to leaders of the parent groups you specifically select
- Does NOT include subgroup leaders
- Use case: Zone leader meetings, departmental head communications

### 5. **Subgroup Leaders**
- Sends ONLY to leaders of child groups under the selected parent groups
- Does NOT include the parent group leaders themselves
- Use case: Connect group leader training, cell leader updates

## Practical Examples

### Example 1: Zone Communication
**Scenario:** Send announcement to everyone in the "Zion Zone" including all connect groups and cell groups.

**Setup:**
1. Select "Groups" as Recipient Type
2. Select "Parent + Subgroups" as Group Targeting
3. Choose "Zion Zone"
4. Result: Everyone in Zion Zone, its connect groups, and cell groups receives the message

### Example 2: Department Leaders Meeting
**Scenario:** Invite all departmental heads (not their team members) to a meeting.

**Setup:**
1. Select "Groups" as Recipient Type
2. Select "Parent Group Leaders" as Group Targeting
3. Choose multiple departments (e.g., "Worship", "Youth", "Children")
4. Result: Only the heads of these departments receive the invitation

### Example 3: Cell Leader Training
**Scenario:** Announce training for all cell leaders under your zones.

**Setup:**
1. Select "Groups" as Recipient Type
2. Select "Subgroup Leaders" as Group Targeting
3. Choose your zones
4. Result: Only cell leaders receive the training announcement

### Example 4: Guest Follow-up
**Scenario:** Send thank you message to all first-time visitors.

**Setup:**
1. Select "Guests" as Recipient Type
2. Select all guests
3. Result: All people with GUEST role receive the message

## Group Display Features

When viewing groups, you'll see:
- **Member Count**: Total direct members in the group
- **Subgroup Count**: Number of child groups (if applicable)
- **Parent Group**: Shows which parent group this belongs to
- **Group Type**: Labels like "zone", "connect-group", "cell-group", "department"

## Quick Actions

Pre-configured shortcuts in the sidebar:
- **Send to All Members**: All active church members
- **Send to All Leaders**: Members with LEADER or PASTOR role
- **Send to All Guests**: All guest visitors
- **All Group Leaders**: All people marked as leaders in any group

## Technical Implementation

### API Structure
The system uses `groupTargetType` parameter with these values:
- `all-members`: Default behavior
- `parent-with-subgroups`: Recursive subgroup inclusion
- `leaders-only`: Filter for `isLeader = true`
- `parent-leaders`: Leaders only from selected groups
- `subgroup-leaders`: Leaders only from child groups

### Database Queries
The system recursively fetches subgroups and applies filtering based on the `GroupMember.isLeader` flag and group hierarchy relationships.

### Logging
All messages are logged with the `groupTargetType` in metadata for tracking and reporting purposes.

## Best Practices

1. **Use Parent + Subgroups Sparingly**: This can result in large recipient lists
2. **Test with Small Groups First**: Verify targeting works as expected
3. **Use Search**: Filter groups by name or type to find the right ones quickly
4. **Check Member Counts**: The UI shows how many members are in each group
5. **Personalization Works**: Use `{{firstName}}`, `{{lastName}}`, `{{fullName}}` variables

## Troubleshooting

**Q: Why didn't subgroup members receive the message?**
A: Make sure you selected "Parent + Subgroups" as the targeting option. Default "All Members" only sends to direct group members.

**Q: Leaders didn't receive the message?**
A: Verify that members are marked as leaders (`isLeader = true`) in the `GroupMember` table.

**Q: Message went to wrong people?**
A: Check the group hierarchy and ensure groups are properly nested with correct `parentId` relationships.

## Future Enhancements

Potential additions:
- Role-based targeting (e.g., only co-leaders, assistants)
- Custom member filters (age, gender, location)
- Scheduled group messages
- Message templates per group type
- Analytics on group communication effectiveness
