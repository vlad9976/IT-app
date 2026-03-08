# 🧪 Microsoft 365 Integration - Testing Guide

## Complete Testing Checklist

Use this guide to test all M365 features before deploying to your team.

---

## 🎯 Pre-Testing Setup

### 1. Azure App Registration

- [ ] App registration created in Azure Portal
- [ ] Client ID copied
- [ ] Public client flows enabled
- [ ] All permissions added:
  - [ ] User.Read
  - [ ] User.ReadWrite.All
  - [ ] Directory.ReadWrite.All
  - [ ] Group.ReadWrite.All
  - [ ] AuditLog.Read.All
- [ ] Admin consent granted

### 2. Test Environment

- [ ] App running: `npm run dev`
- [ ] Browser ready for device code
- [ ] Test user account ready (for testing)
- [ ] Test group created in Azure AD

---

## 🧪 Test Scenarios

### Test 1: Authentication

**Objective:** Verify device code flow works

**Steps:**
1. Launch app
2. Click "Microsoft 365" in sidebar
3. Enter your Azure App Client ID
4. Tenant ID: `common` (or your tenant ID)
5. Click "Connect to Microsoft 365"
6. **Verify:** Device code appears (e.g., `ABC123DEF`)
7. Open: https://microsoft.com/devicelogin
8. Enter the code
9. Sign in with admin account
10. **Verify:** App shows "Connected" with your username

**Expected Result:**
```
✅ Device code displayed
✅ Authentication successful
✅ Username shown in header
✅ "Connected" status visible
✅ Disconnect button appears
```

**If fails:** Check `AZURE_APP_SETUP.md` troubleshooting section

---

### Test 2: Create User

**Objective:** Create a new test user

**Steps:**
1. Go to "User Management" tab
2. Select "Create User"
3. Fill in:
   - Display Name: `Test User 001`
   - UPN: `testuser001@yourdomain.com`
   - Password: `TempPass@2026!`
   - Location: `US`
4. Click "Create User"

**Expected Result:**
```
✅ Loading indicator shows
✅ Success message appears
✅ User details displayed in JSON
✅ Form clears after success
```

**Verify in Azure AD:**
1. Go to: https://portal.azure.com/#view/Microsoft_AAD_UsersAndTenants/UserManagementMenuBlade
2. Search for `testuser001`
3. User should exist

**If fails:**
- Check permission: `User.ReadWrite.All`
- Verify admin consent granted
- Check UPN format (must be valid domain)

---

### Test 3: Reset Password

**Objective:** Reset the test user's password

**Steps:**
1. Stay in "User Management" tab
2. Select "Reset Password"
3. Fill in:
   - UPN: `testuser001@yourdomain.com`
   - New Password: `NewPass@2026!`
4. Click "Reset Password"

**Expected Result:**
```
✅ Success message appears
✅ "Password reset successfully" shown
```

**Verify:**
1. Try logging in as `testuser001` with old password → Should fail
2. Try with new password → Should work (and prompt to change)

---

### Test 4: View Available Licenses

**Objective:** List organization licenses

**Steps:**
1. Click "Licenses" tab
2. **Verify:** Licenses load automatically

**Expected Result:**
```
✅ License cards displayed
✅ Shows license names (e.g., "ENTERPRISEPACK")
✅ Shows available count (e.g., "Available: 45 / 100")
```

**If no licenses show:**
- Check permission: `Organization.Read.All`
- Verify your tenant has licenses

---

### Test 5: Assign License

**Objective:** Assign license to test user

**Steps:**
1. Stay in "Licenses" tab
2. Fill in:
   - UPN: `testuser001@yourdomain.com`
   - License: Select any available license
3. Click "Assign License"

**Expected Result:**
```
✅ Success message appears
✅ Available count decreases by 1
```

**Verify in Azure AD:**
1. Go to user's profile
2. Check "Licenses" section
3. License should be assigned

**If fails:**
- Check user's `usageLocation` is set
- Verify license is available
- Check permission: `User.ReadWrite.All`

---

### Test 6: List Groups

**Objective:** Display all Azure AD groups

**Steps:**
1. Click "Groups" tab
2. **Verify:** Groups load automatically

**Expected Result:**
```
✅ Groups displayed in scrollable list
✅ Shows group names
✅ Shows descriptions (if available)
✅ Shows count (e.g., "Available Groups (45)")
```

**If no groups show:**
- Check permission: `Group.Read.All`
- Verify groups exist in your tenant

---

### Test 7: Add User to Group

**Objective:** Add test user to a group

**Steps:**
1. Stay in "Groups" tab
2. Fill in:
   - UPN: `testuser001@yourdomain.com`
   - Group: Select any group from dropdown
3. Click "Add User to Group"

**Expected Result:**
```
✅ Success message appears
✅ "User added to group successfully" shown
```

**Verify in Azure AD:**
1. Go to the group
2. Check "Members" section
3. Test user should be listed

**If fails:**
- Check user exists
- Check group exists
- Check permission: `Group.ReadWrite.All`

---

### Test 8: View Sign-in Logs

**Objective:** Retrieve user's sign-in history

**Steps:**
1. Click "Sign-in Logs" tab
2. Fill in:
   - UPN: Your admin account (or testuser001 after they log in)
   - Limit: `10`
3. Click "Get Sign-in Logs"

**Expected Result:**
```
✅ Loading indicator shows
✅ Logs displayed in cards
✅ Shows: Date, App, IP, Location, Status
✅ Success/Failed badges colored correctly
```

**If fails:**
- Check permission: `AuditLog.Read.All`
- User must have sign-in activity
- Try with your own account first

---

### Test 9: Disconnect and Reconnect

**Objective:** Verify disconnect clears session

**Steps:**
1. Click "Disconnect" button
2. **Verify:** Returns to connection screen
3. Click "Connect to Microsoft 365" again
4. Complete device code flow
5. **Verify:** Reconnects successfully

**Expected Result:**
```
✅ Disconnect clears username
✅ Returns to connection panel
✅ Can reconnect without issues
✅ Previous operations still work
```

---

### Test 10: Error Handling

**Objective:** Verify errors are handled gracefully

**Test A: Invalid UPN**
1. Try to reset password for `nonexistent@yourdomain.com`
2. **Expected:** "Resource not found" error displayed

**Test B: Expired Token**
1. Connect to M365
2. Wait 1+ hour (or force token expiration)
3. Try an operation
4. **Expected:** Silent token renewal OR reconnect prompt

**Test C: Insufficient Permissions**
1. Sign in with non-admin account
2. Try to create user
3. **Expected:** "Access denied" error with helpful message

---

## 📊 Test Results Template

### Authentication Test
- [ ] Device code displayed correctly
- [ ] Browser redirect worked
- [ ] Authentication successful
- [ ] Username displayed
- [ ] Disconnect worked

### User Operations
- [ ] Create user successful
- [ ] Password reset successful
- [ ] User details retrieved
- [ ] Error handling works

### License Operations
- [ ] Licenses loaded
- [ ] Available count accurate
- [ ] License assignment successful
- [ ] Dropdown populated

### Group Operations
- [ ] Groups loaded
- [ ] Add to group successful
- [ ] Group list scrollable

### Audit Operations
- [ ] Sign-in logs retrieved
- [ ] Logs formatted correctly
- [ ] Status indicators work
- [ ] Location data shows

---

## 🔍 What to Check

### In the App

**Connection Panel:**
- [ ] Client ID input works
- [ ] Tenant ID input works
- [ ] Device code displays clearly
- [ ] Verification URL shown
- [ ] Loading state during auth
- [ ] Success/error messages

**User Management:**
- [ ] Form inputs work
- [ ] Validation prevents empty fields
- [ ] Loading states show
- [ ] Results display correctly
- [ ] Form clears after success

**License Management:**
- [ ] Licenses load on tab open
- [ ] Cards show correct data
- [ ] Dropdown populated
- [ ] Assignment works

**Group Management:**
- [ ] Groups load on tab open
- [ ] List is scrollable
- [ ] Dropdown works
- [ ] Add operation succeeds

**Sign-in Logs:**
- [ ] Logs retrieve successfully
- [ ] Cards formatted nicely
- [ ] Status badges colored
- [ ] Scrollable list

### In Azure Portal

After each operation, verify in Azure AD:

**Users:**
- [ ] Test user exists
- [ ] Password was reset
- [ ] License assigned
- [ ] Group membership added

**Audit Logs:**
- [ ] Operations logged
- [ ] Timestamps correct
- [ ] User identity recorded

---

## 🐛 Known Issues & Workarounds

### Issue: Device Code Expires

**Symptom:** "Device code expired" error

**Cause:** User took > 15 minutes to enter code

**Workaround:** Click "Connect" again for new code

### Issue: Token Renewal Fails

**Symptom:** "Not authenticated" after 1 hour

**Cause:** Refresh token expired

**Workaround:** Click "Disconnect" → "Connect" again

### Issue: "Public client flows not enabled"

**Symptom:** Authentication fails immediately

**Cause:** Azure app not configured

**Fix:** Follow `AZURE_APP_SETUP.md` Step 2

---

## 📝 Test Data

### Sample Test Users

```
User 1:
  Display Name: Test User Alpha
  UPN: testalpha@yourdomain.com
  Password: TempPass@2026!
  Location: US

User 2:
  Display Name: Test User Beta
  UPN: testbeta@yourdomain.com
  Password: TempPass@2026!
  Location: GB
```

### Sample Test Group

```
Group Name: IT Test Group
Description: Test group for M365 integration
Type: Security
```

---

## ✅ Sign-Off Checklist

Before deploying to team:

### Functionality
- [ ] All 5 operations tested and working
- [ ] Authentication flow smooth
- [ ] Error handling graceful
- [ ] UI responsive and clear
- [ ] Results display correctly

### Security
- [ ] No tokens on disk
- [ ] Admin consent granted
- [ ] Permissions appropriate
- [ ] Error messages don't leak sensitive info
- [ ] Disconnect clears session

### Documentation
- [ ] Azure setup guide complete
- [ ] Implementation summary written
- [ ] Quick start guide created
- [ ] Testing guide (this file) complete

### Performance
- [ ] Operations complete in < 5 seconds
- [ ] UI doesn't freeze during operations
- [ ] Loading states work
- [ ] Large lists (groups/logs) scroll smoothly

---

## 🚀 Production Readiness

### ✅ Ready to Deploy If:

- [x] All tests passed
- [x] Azure app configured correctly
- [x] Permissions granted
- [x] Error handling works
- [x] UI is polished
- [x] Documentation complete
- [x] Security audit passed

### 🎯 Deployment Steps

1. **Update version:**
```json
{
  "version": "1.1.0"
}
```

2. **Commit and publish:**
```powershell
git add .
git commit -m "Add Microsoft 365 Graph API integration"
git tag v1.1.0
git push origin main v1.1.0
$env:GH_TOKEN = 'your_token'
npm run publish
```

3. **Share with team:**
- Download link
- Azure App Client ID
- `AZURE_APP_SETUP.md` guide

---

## 📞 Support

**Testing issues?**
- Check electron logs
- Review browser console
- Test with Global Admin account
- Verify Azure configuration

**Need help?**
- Read `AZURE_APP_SETUP.md`
- Check `M365_IMPLEMENTATION.md`
- Review Microsoft Graph docs

---

**Start testing:** Launch the app and click "Microsoft 365"!
