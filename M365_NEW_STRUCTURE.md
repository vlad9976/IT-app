# Microsoft 365 Admin Console - New Structure

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Microsoft 365 Admin Console                                    │
│  Enterprise IT Administration                                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────┬─────────────────┐
│              │                              │                 │
│  SIDEBAR     │     MAIN CONTENT             │  ACTIVITY LOG   │
│              │                              │                 │
│ ┌──────────┐ │  ┌────────────────────────┐  │  Recent Actions │
│ │Connected │ │  │                        │  │  ✅ Create User │
│ │help2@... │ │  │   [Action Form]        │  │  ✅ Reset Pass  │
│ │[Disconnect]│ │  │                        │  │  ❌ Assign Lic  │
│ └──────────┘ │  │   • Input fields       │  │  ✅ Add to Grp  │
│              │  │   • Dropdowns          │  │  ...            │
│ 👤 User Mgmt │  │   • Checkboxes         │  │                 │
│   • Create   │  │   • Buttons            │  │                 │
│   • Reset    │  │                        │  │                 │
│   • Enable   │  │                        │  │                 │
│   • Delete   │  │   [Results Display]    │  │                 │
│              │  │                        │  │                 │
│ 🏆 Licenses  │  └────────────────────────┘  │                 │
│   • Assign   │                              │                 │
│   • Remove   │                              │                 │
│   • View All │                              │                 │
│              │                              │                 │
│ 👥 Groups    │                              │                 │
│   • Add/Rem  │                              │                 │
│              │                              │                 │
│ 📄 Sign-in   │                              │                 │
│   • View     │                              │                 │
│              │                              │                 │
│ 🛡️ Security  │                              │                 │
│   • Lockdown │                              │                 │
│              │                              │                 │
│ 🏢 Tenant    │                              │                 │
│   • Info     │                              │                 │
│              │                              │                 │
└──────────────┴──────────────────────────────┴─────────────────┘
```

---

## Section Breakdown

### 1. User Management (4 Actions)

#### Create User
```
Fields:
├── First Name *
├── Last Name *
├── Display Name (auto-generated)
├── Username *
├── Domain * (dropdown from tenant)
├── Usage Location * (country dropdown)
├── Password * (auto-generate toggle)
└── Force password change (checkbox)

Advanced Options (toggle):
├── Job Title
├── Department
├── Mobile Phone
├── Manager (searchable)
└── Account Enabled (checkbox)
```

#### Reset Password
```
Fields:
├── User * (searchable autocomplete)
├── New Password * (auto-generate toggle)
├── Force change on next login (checkbox)
└── Revoke sign-in sessions (checkbox)
```

#### Enable / Disable
```
Fields:
├── User * (searchable)
├── Action: [Enable] or [Disable]
└── If Disable:
    ├── Remove licenses (checkbox)
    └── Revoke sessions (checkbox)
```

#### Delete User
```
Fields:
├── User * (searchable)
└── Delete Type:
    ├── [Soft Delete] - Recoverable 30 days
    └── [Hard Delete] - Permanent ⚠️

Confirmation Modal: YES
```

---

### 2. Licenses (3 Actions)

#### Assign License
```
Fields:
├── User * (searchable)
├── License SKU * (dropdown with friendly names)
│   Examples:
│   • Microsoft 365 Business Premium
│   • Exchange Online Plan 1
│   • Office 365 E3
│   • Office 365 E5
└── Remove existing licenses (checkbox)
```

#### Remove License
```
Fields:
├── User * (searchable)
└── Assigned Licenses (multi-select checkboxes)
    Auto-loads user's current licenses
```

#### View All Licenses
```
Display:
├── License Name
├── Status (Active/Suspended)
├── Total Units
├── Assigned Units
├── Available Units
├── Usage Bar (visual)
└── [Export CSV] button
```

---

### 3. Groups (1 Action)

#### Add / Remove User
```
Fields:
├── Action: [Add to Group] or [Remove from Group]
├── User * (searchable)
├── Group Type Filter:
│   • All
│   • Security
│   • M365
│   • Distribution
└── Group * (searchable dropdown)
```

---

### 4. Sign-in Logs (1 Action)

#### View Logs
```
Fields:
├── User * (searchable)
├── Start Date (date picker)
├── End Date (date picker)
└── Filter: [All] [Successful Only] [Failed Only]

Results Table:
├── Date/Time
├── Application
├── IP Address
├── Location (City, Country)
├── Status (Success/Failed)
├── Conditional Access Status
└── [Export CSV] button
```

---

### 5. Security (1 Action)

#### Emergency Lockdown ⚠️
```
⚠️ WARNING: Use only for security incidents!

Actions Performed:
1. Reset password → Random secure password
2. Disable account → Immediate access revocation
3. Revoke sessions → Logout from all devices

Fields:
└── User * (searchable)

Results Display:
├── ✅/❌ Password Reset
├── ✅/❌ Account Disabled
├── ✅/❌ Sessions Revoked
└── 🔑 New Password (copy to clipboard)

Confirmation Modal: YES (danger)
```

---

### 6. Tenant Info (1 Action)

#### Organization Info
```
Display:
├── Organization Name
├── Verified Domains (with default indicator)
└── Preferred Language

User License Report:
├── [Generate Report] button
├── Table:
│   ├── User Name
│   ├── Email
│   ├── Status (Active/Disabled)
│   ├── Licenses (comma-separated)
│   └── License Count
└── [Export CSV] button
```

---

## UI Elements

### Toast Notifications (Top-Right)
- 🟢 **Green:** Success messages
- 🔴 **Red:** Error messages
- 🟡 **Yellow:** Warnings
- 🔵 **Blue:** Info messages
- Auto-dismiss: 5 seconds
- Manual close: Click X

### Activity Log (Right Sidebar)
- Shows last 10 actions
- ✅ Green checkmark = Success
- ❌ Red X = Failed
- Includes timestamp
- Real-time updates

### Confirmation Modals
- Appear for destructive actions:
  - Delete User
  - Emergency Lockdown
- Clear warnings
- Require explicit confirmation

### Search Components
- Type-ahead autocomplete
- Minimum 2 characters to search
- Shows relevant info in dropdown
- Clear button (X)

---

## Common Workflows

### New Employee Onboarding
1. **Create User** (User Management)
2. **Assign License** (Licenses)
3. **Add to Groups** (Groups) - Add to relevant security/M365 groups

### Employee Offboarding
1. **Disable User** (User Management)
   - ✅ Remove licenses
   - ✅ Revoke sessions
2. After 30 days: **Delete User** (soft delete)

### Password Reset Request
1. **Reset Password** (User Management)
   - ✅ Force change on next login
   - ✅ Revoke sessions
2. Securely communicate new password to user

### Security Incident Response
1. **Emergency Lockdown** (Security)
2. **View Sign-in Logs** (Sign-in Logs) - Check for suspicious activity
3. **Review Groups** (Groups) - Verify access levels
4. Save new password for user

### License Audit
1. **View All Licenses** (Licenses) - Check availability
2. **Generate User License Report** (Tenant Info)
3. **Export CSV** for both reports
4. Review and optimize assignments

---

## Data Export

All export functions create CSV files with:
- Timestamp in filename
- Proper formatting
- All relevant columns
- Ready for Excel/Google Sheets

**Exportable Data:**
- Tenant licenses
- User license report
- Sign-in logs

---

## Tips & Best Practices

### General
- ✅ Always use searchable dropdowns (don't type manually)
- ✅ Check Activity Log for confirmation
- ✅ Watch for toast notifications
- ✅ Export reports regularly for compliance

### Security
- ✅ Use Emergency Lockdown only for incidents
- ✅ Monitor failed sign-in attempts
- ✅ Review sign-in logs weekly
- ✅ Revoke sessions when resetting passwords

### Licenses
- ✅ Remove licenses from disabled users
- ✅ Monitor license availability
- ✅ Run license reports monthly
- ✅ Assign appropriate licenses only

### Groups
- ✅ Use Security groups for access control
- ✅ Document group purposes
- ✅ Review group memberships quarterly
- ✅ Remove users from groups when changing roles

---

## Quick Reference: When to Use What

| Scenario | Action | Section |
|----------|--------|---------|
| New employee | Create User | User Management |
| Forgot password | Reset Password | User Management |
| Employee on leave | Disable User | User Management |
| Employee terminated | Disable → Delete | User Management |
| Need Office access | Assign License | Licenses |
| Reduce license costs | Remove License | Licenses |
| Check license usage | View All Licenses | Licenses |
| Grant team access | Add to Group | Groups |
| Revoke team access | Remove from Group | Groups |
| Suspicious activity | View Sign-in Logs | Sign-in Logs |
| Account compromised | Emergency Lockdown | Security |
| License audit | User License Report | Tenant Info |
| Compliance report | Export CSV | Various |

---

## Error Messages

### Common Errors & Solutions

**"Not authenticated"**
- Solution: Disconnect and reconnect

**"Access denied"**
- Solution: Verify admin permissions in Azure

**"User not found"**
- Solution: Check spelling, verify user exists

**"License not available"**
- Solution: Check tenant has available licenses

**"Token expired"**
- Solution: App will auto-refresh, or reconnect

---

**Need Help?** Check the console (F12) for detailed error messages.
