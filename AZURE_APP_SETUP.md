# 🔷 Azure App Registration Setup Guide

## Microsoft 365 Integration Configuration

This guide walks you through setting up an Azure App Registration for the IT Script Generator's Microsoft 365 integration.

---

## 📋 Prerequisites

- ✅ Microsoft 365 tenant (with admin access)
- ✅ Azure AD admin permissions
- ✅ Global Administrator or Application Administrator role

---

## 🚀 Step-by-Step Setup

### Step 1: Create App Registration

1. **Go to Azure Portal:**
   ```
   https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
   ```

2. **Click:** "New registration"

3. **Fill in details:**
   - **Name:** `IT Script Generator`
   - **Supported account types:** 
     - Select: "Accounts in this organizational directory only (Single tenant)"
     - OR: "Accounts in any organizational directory (Multi-tenant)" if needed
   - **Redirect URI:** Leave empty (not needed for device code flow)

4. **Click:** "Register"

5. **Copy the Application (client) ID:**
   - You'll see it on the Overview page
   - Format: `00000000-0000-0000-0000-000000000000`
   - **Save this** - you'll need it in the app!

---

### Step 2: Enable Device Code Flow

1. **In your app registration, go to:** "Authentication" (left sidebar)

2. **Scroll to:** "Advanced settings"

3. **Find:** "Allow public client flows"

4. **Toggle to:** "Yes"

5. **Click:** "Save" at the top

---

### Step 3: Configure API Permissions

1. **Go to:** "API permissions" (left sidebar)

2. **Click:** "Add a permission"

3. **Select:** "Microsoft Graph"

4. **Select:** "Delegated permissions"

5. **Add these permissions:**

   **User Management:**
   - ✅ `User.Read` (Read signed-in user profile)
   - ✅ `User.ReadWrite.All` (Read and write all users' full profiles)
   
   **Directory Management:**
   - ✅ `Directory.ReadWrite.All` (Read and write directory data)
   
   **Group Management:**
   - ✅ `Group.ReadWrite.All` (Read and write all groups)
   
   **Audit Logs:**
   - ✅ `AuditLog.Read.All` (Read audit log data)

6. **Click:** "Add permissions"

---

### Step 4: Grant Admin Consent

**⚠️ IMPORTANT:** These permissions require admin consent.

1. **Click:** "Grant admin consent for [Your Organization]"

2. **Confirm:** Click "Yes"

3. **Verify:** All permissions should show "Granted for [Your Organization]" with a green checkmark

---

### Step 5: Test Configuration

Your app registration should now show:

```
Overview:
  Application (client) ID: [Your Client ID]
  Directory (tenant) ID: [Your Tenant ID]

Authentication:
  Allow public client flows: Yes

API Permissions:
  ✅ User.Read (Granted)
  ✅ User.ReadWrite.All (Granted)
  ✅ Directory.ReadWrite.All (Granted)
  ✅ Group.ReadWrite.All (Granted)
  ✅ AuditLog.Read.All (Granted)
```

---

## 🎯 Using in the App

### Step 1: Launch IT Script Generator

1. Open the app
2. Click "Microsoft 365" in the sidebar

### Step 2: Connect

1. **Enter your Application (client) ID**
2. **Tenant ID:** Use `common` or your specific tenant ID
3. **Click:** "Connect to Microsoft 365"

### Step 3: Device Code Authentication

1. **App will show:** A device code (e.g., `ABC123DEF`)
2. **Open browser:** Go to https://microsoft.com/devicelogin
3. **Enter the code** shown in the app
4. **Sign in** with your Microsoft 365 admin account
5. **Grant permissions** when prompted
6. **Return to app** - it will automatically connect!

---

## 🔒 Security Model

### Device Code Flow

**Why we use it:**
- ✅ No client secret needed
- ✅ No password storage
- ✅ Secure for desktop apps
- ✅ User authenticates directly with Microsoft
- ✅ Token stored in memory only (never on disk)

**How it works:**

```
1. App requests device code from Azure AD
2. User goes to microsoft.com/devicelogin
3. User enters code and signs in
4. Azure AD returns access token to app
5. App uses token for Graph API calls
6. Token expires after 1 hour (auto-renewed)
```

### Token Management

**Access Token:**
- ✅ Stored in memory only
- ✅ Never written to disk
- ✅ Expires after 1 hour
- ✅ Auto-renewed silently
- ✅ Cleared on disconnect

**Refresh Token:**
- ✅ Managed by MSAL library
- ✅ Stored securely by OS
- ✅ Used for silent token renewal

---

## 📊 Permissions Explained

### User.Read
- **Purpose:** Read basic profile of signed-in user
- **Used for:** Displaying username in UI
- **Risk:** Low - only reads public profile

### User.ReadWrite.All
- **Purpose:** Create, modify, and read all users
- **Used for:** Create users, reset passwords
- **Risk:** High - requires admin consent

### Directory.ReadWrite.All
- **Purpose:** Read and write directory data
- **Used for:** Advanced user management
- **Risk:** High - requires admin consent

### Group.ReadWrite.All
- **Purpose:** Manage groups and memberships
- **Used for:** Add users to groups
- **Risk:** Medium - requires admin consent

### AuditLog.Read.All
- **Purpose:** Read audit and sign-in logs
- **Used for:** View user sign-in history
- **Risk:** Low - read-only access

---

## 🆘 Troubleshooting

### Error: "AADSTS50059: No tenant-identifying information found"

**Cause:** Tenant ID not configured correctly

**Fix:**
- Use `common` for multi-tenant
- Or use your specific tenant ID from Azure Portal

### Error: "AADSTS65001: The user or administrator has not consented"

**Cause:** Admin consent not granted

**Fix:**
1. Go to Azure Portal → Your App → API Permissions
2. Click "Grant admin consent for [Organization]"
3. Confirm

### Error: "AADSTS7000218: The request body must contain the following parameter: 'client_assertion'"

**Cause:** Public client flows not enabled

**Fix:**
1. Go to: Authentication → Advanced settings
2. Enable "Allow public client flows"
3. Save

### Error: "Device code expired"

**Cause:** User took too long to enter code (expires in 15 minutes)

**Fix:**
- Click "Connect" again to get a new code
- Enter the code faster

### Error: "Insufficient privileges"

**Cause:** Signed-in user doesn't have required permissions

**Fix:**
- Sign in with Global Administrator account
- Or grant required roles to the user

---

## 🎯 Recommended Roles

### For App Registration Creator
- ✅ Application Administrator
- ✅ Cloud Application Administrator
- OR ✅ Global Administrator

### For App Users
- ✅ User Administrator (for user management)
- ✅ Groups Administrator (for group management)
- ✅ License Administrator (for license assignment)
- OR ✅ Global Administrator (for everything)

---

## 📝 Configuration Checklist

Before using the app:

- [ ] Azure App Registration created
- [ ] Application (client) ID copied
- [ ] Public client flows enabled
- [ ] API permissions added:
  - [ ] User.Read
  - [ ] User.ReadWrite.All
  - [ ] Directory.ReadWrite.All
  - [ ] Group.ReadWrite.All
  - [ ] AuditLog.Read.All
- [ ] Admin consent granted for all permissions
- [ ] Tested device code flow authentication

---

## 🔗 Quick Links

- **Azure Portal:** https://portal.azure.com
- **App Registrations:** https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
- **Device Login:** https://microsoft.com/devicelogin
- **Graph API Docs:** https://docs.microsoft.com/graph/api/overview
- **MSAL Node Docs:** https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node

---

## 📚 Additional Resources

### Microsoft Graph API Endpoints Used

| Operation | Endpoint | Permission |
|-----------|----------|------------|
| Create User | `POST /users` | User.ReadWrite.All |
| Reset Password | `PATCH /users/{id}` | User.ReadWrite.All |
| Assign License | `POST /users/{id}/assignLicense` | User.ReadWrite.All |
| Add to Group | `POST /groups/{id}/members/$ref` | Group.ReadWrite.All |
| Get Sign-in Logs | `GET /auditLogs/signIns` | AuditLog.Read.All |
| List Groups | `GET /groups` | Group.Read.All |
| Get Licenses | `GET /subscribedSkus` | Organization.Read.All |

### Testing the Integration

**Test with these operations:**

1. **Create a test user:**
   - Display Name: `Test User`
   - UPN: `testuser@yourdomain.com`
   - Password: `TempPass@123`

2. **Reset password:**
   - User: `testuser@yourdomain.com`
   - New Password: `NewPass@456`

3. **Assign license:**
   - User: `testuser@yourdomain.com`
   - License: Select from available

4. **Add to group:**
   - User: `testuser@yourdomain.com`
   - Group: Select a test group

5. **View sign-in logs:**
   - User: Your admin account
   - Limit: 10

---

## 🎨 App Configuration File (Optional)

You can create a config file for easier setup:

**Create:** `m365-config.json` (in app folder)

```json
{
  "clientId": "your-client-id-here",
  "tenantId": "common",
  "scopes": [
    "User.Read",
    "User.ReadWrite.All",
    "Directory.ReadWrite.All",
    "Group.ReadWrite.All",
    "AuditLog.Read.All"
  ]
}
```

**⚠️ Add to .gitignore:**
```
m365-config.json
```

---

## 🔐 Security Best Practices

### DO:
- ✅ Use device code flow (no secrets)
- ✅ Grant minimum required permissions
- ✅ Review audit logs regularly
- ✅ Rotate app registration periodically
- ✅ Use specific tenant ID in production

### DON'T:
- ❌ Use client secret in desktop apps
- ❌ Store tokens on disk
- ❌ Grant more permissions than needed
- ❌ Share client ID publicly (keep internal)
- ❌ Use same app for multiple purposes

---

## 📞 Support

**Issues with Azure setup?**
- Check Azure AD admin center
- Review audit logs
- Contact Microsoft support

**Issues with the app?**
- Check electron logs
- Verify permissions granted
- Test with Global Admin account

---

**Setup complete?** Launch the app and click "Microsoft 365" to test!
