# Microsoft 365 Admin Console - Quick Reference Guide

## Getting Started

### 1. Connect to Microsoft 365
1. Open the app
2. Click **"Microsoft 365"** in the sidebar
3. Click **"Connect to Microsoft 365"**
4. Follow the device code instructions
5. Sign in with your admin account

---

## User Management

### Create User
**When to use:** Adding new employees

**Steps:**
1. Select "User Management" → "Create User"
2. Fill in:
   - First Name, Last Name
   - Username (auto-generates display name)
   - Select domain from dropdown
   - Password (auto-generated or custom)
3. Optional: Click "Show Advanced Options" for:
   - Job Title, Department
   - Mobile Phone
   - Manager assignment
4. Click "Create User"

**Tips:**
- Password is auto-generated (secure, 16 chars)
- "Force password change" is enabled by default
- Account is enabled by default

---

### Reset Password
**When to use:** User forgot password or security incident

**Steps:**
1. Select "User Management" → "Reset Password"
2. Search for user
3. Password auto-generates (or enter custom)
4. Options:
   - ✅ Force change on next login (recommended)
   - ✅ Revoke all sessions (recommended for security)
5. Click "Reset Password"

**Tips:**
- Copy the password before closing
- User will be forced to change it on next login

---

### Enable / Disable User
**When to use:** Temporarily deactivate accounts (leave, suspension)

**Steps:**
1. Select "User Management" → "Enable / Disable"
2. Search for user
3. Choose action: Enable or Disable
4. If disabling, optionally:
   - Remove all licenses (frees up licenses)
   - Revoke sessions (immediate logout)
5. Click button

**Tips:**
- Disabling is reversible
- Useful for temporary leave
- Removes access immediately

---

### Delete User
**When to use:** Employee termination

**Steps:**
1. Select "User Management" → "Delete User"
2. Search for user
3. Choose delete type:
   - **Soft Delete:** Recoverable for 30 days (recommended)
   - **Hard Delete:** Permanent, cannot be undone
4. Confirm in modal
5. Click "Delete User"

**Tips:**
- Always use Soft Delete unless absolutely certain
- Hard delete is permanent!

---

## License Management

### Assign License
**When to use:** New user needs access to services

**Steps:**
1. Select "Licenses" → "Assign License"
2. Search for user
3. Select license from dropdown (shows available count)
4. Optional: "Remove existing licenses" (replaces all)
5. Click "Assign License"

**Tips:**
- Check available count before assigning
- Can assign multiple licenses (run multiple times)

---

### Remove License
**When to use:** User no longer needs specific services

**Steps:**
1. Select "Licenses" → "Remove License"
2. Search for user
3. Check boxes for licenses to remove
4. Click "Remove Selected Licenses"

**Tips:**
- Can remove multiple at once
- Frees up licenses for reassignment

---

### View All Licenses
**When to use:** Check tenant license usage

**What you see:**
- All licenses in your tenant
- Total / Assigned / Available counts
- Visual usage bars
- Export to CSV option

---

## Group Management

### Add / Remove User from Group
**When to use:** Managing access permissions

**Steps:**
1. Select "Groups" → "Add / Remove User"
2. Choose action: Add or Remove
3. Search for user
4. Filter groups by type (All / Security / M365 / Distribution)
5. Select group
6. Click button

**Tips:**
- Security groups control access
- M365 groups are for collaboration
- Distribution groups are for email

---

## Sign-in Logs

### View User Activity
**When to use:** Security audits, troubleshooting login issues

**Steps:**
1. Select "Sign-in Logs" → "View Logs"
2. Search for user
3. Set date range (default: last 7 days)
4. Choose filter:
   - All (default)
   - Successful Only
   - Failed Only
5. Click "Get Sign-in Logs"

**What you see:**
- Date/Time of each login
- Application used
- IP Address
- Location (City, Country)
- Success/Failed status
- Conditional Access status

**Export:**
- Click "Export CSV" to save results

**Tips:**
- Failed logins may indicate:
  - Wrong password attempts
  - Blocked by conditional access
  - Account disabled
- Check IP/Location for suspicious activity

---

## Security

### Emergency Lockdown
**When to use:** SECURITY INCIDENTS ONLY
- Compromised account
- Suspicious activity
- Immediate access revocation needed

**What it does:**
1. Resets password to random secure value
2. Disables account
3. Revokes all active sessions

**Steps:**
1. Select "Security" → "Emergency Lockdown"
2. Search for user
3. Read the warning
4. Click "Execute Emergency Lockdown"
5. Confirm in modal
6. **SAVE THE NEW PASSWORD** (shown once only)

**Tips:**
- Use only for security incidents
- User is immediately locked out
- All sessions terminated instantly
- Save the new password securely

---

## Tenant Info

### Organization Overview
**What you see:**
- Tenant name
- Verified domains
- Default domain
- Preferred language

### User License Report
**When to use:** License audit, compliance reporting

**Steps:**
1. Select "Tenant Info" → "Organization Info"
2. Click "Generate Report"
3. View all users with their licenses
4. Click "Export CSV" to save

**What you see:**
- All users in tenant
- Account status (Active/Disabled)
- Assigned licenses
- License count per user

---

## Activity Log

**Located on the right side of the screen**

Shows last 10 actions:
- ✅ Green checkmark = Success
- ❌ Red X = Failed
- Action name
- User affected
- Timestamp

**Tips:**
- Helps track what you've done
- Quick reference for recent changes
- Persists during session only

---

## Toast Notifications

**Appear in top-right corner**

- 🟢 Green = Success
- 🔴 Red = Error
- 🟡 Yellow = Warning
- 🔵 Blue = Info

**Tips:**
- Auto-dismiss after 5 seconds
- Click X to close manually
- Multiple toasts stack vertically

---

## Best Practices

### User Creation
1. Always use auto-generated passwords
2. Enable "Force password change"
3. Set usage location correctly (required for licensing)
4. Fill in job title and department for organization

### Password Resets
1. Always revoke sessions for security
2. Force password change on next login
3. Communicate new password securely (don't email)

### License Management
1. Check available count before assigning
2. Remove licenses from disabled users to free up
3. Run license reports monthly for compliance

### Security
1. Use Emergency Lockdown only for incidents
2. Monitor sign-in logs for suspicious activity
3. Check failed login attempts regularly

### Group Management
1. Use Security groups for access control
2. Use M365 groups for team collaboration
3. Document group purposes

---

## Troubleshooting

### "Not authenticated" error
- Click "Disconnect" and reconnect
- Check if your session expired

### "Access denied" error
- Verify you have admin permissions
- Check Azure App permissions are granted

### User search not working
- Type at least 2 characters
- Wait for autocomplete to load
- Check user exists in tenant

### License assignment fails
- Check license availability
- Verify user has usage location set
- Ensure license is enabled in tenant

---

## Keyboard Shortcuts

- `Ctrl + Shift + I` - Open Developer Console (for debugging)
- `F5` - Refresh app
- `Ctrl + R` - Reload app

---

## Support

For issues or questions:
1. Check the Activity Log for recent errors
2. Open Developer Console (F12) for detailed errors
3. Check electron logs for backend issues
4. Verify Azure App configuration

---

**Version:** 1.0.5 (upcoming)
**Last Updated:** March 2, 2026
