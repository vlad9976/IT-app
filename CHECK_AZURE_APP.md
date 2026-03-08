# Azure App Registration Diagnostic Checklist

## Your App Details
**Client ID:** `b3f2e8af-f78d-4068-81ac-36ab964d2de7`

**Error:** `post_request_failed: invalid_grant`

This error means the authentication request was rejected by Microsoft. Let's fix it.

---

## Step-by-Step Fix

### 1. Open Your Azure App Registration
1. Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. Find your app with Client ID: `b3f2e8af-f78d-4068-81ac-36ab964d2de7`
3. Click on it to open

---

### 2. Enable Device Code Flow (CRITICAL)
1. In your app, click **"Authentication"** in the left menu
2. Scroll down to **"Advanced settings"**
3. Find **"Allow public client flows"**
4. **Set it to "Yes"** ← THIS IS LIKELY THE ISSUE
5. Click **"Save"** at the top

**Why:** Device Code Flow requires public client flows to be enabled.

---

### 3. Verify API Permissions
1. Click **"API permissions"** in the left menu
2. You should see these **Microsoft Graph Delegated** permissions:
   - ✅ User.Read
   - ✅ User.ReadWrite.All
   - ✅ Directory.ReadWrite.All
   - ✅ Group.ReadWrite.All
   - ✅ AuditLog.Read.All

**If any are missing:**
1. Click **"+ Add a permission"**
2. Select **"Microsoft Graph"**
3. Select **"Delegated permissions"**
4. Search for and add the missing permissions
5. Click **"Add permissions"**

---

### 4. Grant Admin Consent (CRITICAL)
1. Still in **"API permissions"** page
2. Look for a button: **"Grant admin consent for [Your Organization]"**
3. Click it
4. Confirm "Yes"
5. Wait for all permissions to show a green checkmark with "Granted for [Your Organization]"

**Why:** These high-privilege permissions require admin approval.

---

### 5. Verify Supported Account Types
1. Click **"Overview"** in the left menu
2. Under **"Essentials"**, find **"Supported account types"**
3. It should be one of:
   - "Accounts in this organizational directory only" (Single tenant)
   - "Accounts in any organizational directory" (Multi-tenant)

**If it says "Personal Microsoft accounts only":**
- This won't work for Microsoft 365 admin operations
- You need to create a new app registration with organizational accounts

---

## After Making Changes

1. **Wait 2-3 minutes** for Azure changes to propagate
2. **Close and restart your IT Script Generator app**
3. Click "Microsoft 365" → "Connect to Microsoft 365"
4. Try again

---

## Still Not Working?

If you still get `invalid_grant` error after the above steps, check:

### A. Tenant Configuration
- Is your Microsoft 365 tenant configured to allow device code flow?
- Some organizations disable this for security reasons
- Check with your Azure/M365 administrator

### B. User Account
- Are you using a Microsoft 365 admin account?
- Personal Microsoft accounts (outlook.com, hotmail.com) won't work
- You need an organizational account (e.g., admin@yourcompany.com)

### C. Conditional Access Policies
- Your organization might have conditional access policies blocking device code flow
- Check Azure AD → Security → Conditional Access

---

## Quick Test (Alternative)

If you want to test if your Azure App is configured correctly, try this PowerShell command:

```powershell
# Test device code flow manually
$clientId = "b3f2e8af-f78d-4068-81ac-36ab964d2de7"
$tenantId = "common"

$body = @{
    client_id = $clientId
    scope = "User.Read"
}

$response = Invoke-RestMethod -Method Post -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/devicecode" -Body $body

Write-Host "Device Code: $($response.user_code)"
Write-Host "Go to: $($response.verification_uri)"
```

If this command fails with the same error, it confirms the Azure App configuration issue.

---

## Most Likely Solution

Based on the error, the #1 most common cause is:

**"Allow public client flows" is set to "No"**

Go to Authentication → Advanced settings → Allow public client flows → **Set to "Yes"** → Save

Then restart the app and try again.
