# ⚡ Microsoft 365 Integration - Quick Start

## 🎯 5-Minute Setup

### Step 1: Create Azure App (2 minutes)

1. Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. Click "New registration"
3. Name: `IT Script Generator`
4. Click "Register"
5. **Copy the Client ID** (you'll need this!)

### Step 2: Configure App (2 minutes)

**Enable Device Code Flow:**
1. Go to "Authentication"
2. Scroll to "Advanced settings"
3. Enable "Allow public client flows"
4. Save

**Add Permissions:**
1. Go to "API permissions"
2. Click "Add a permission" → "Microsoft Graph" → "Delegated"
3. Add these:
   - `User.Read`
   - `User.ReadWrite.All`
   - `Directory.ReadWrite.All`
   - `Group.ReadWrite.All`
   - `AuditLog.Read.All`
4. Click "Grant admin consent for [Organization]"

### Step 3: Use in App (1 minute)

1. Launch IT Script Generator
2. Click "Microsoft 365" in sidebar
3. Paste your Client ID
4. Click "Connect"
5. Go to https://microsoft.com/devicelogin
6. Enter the code shown
7. Sign in
8. Done!

---

## 🎯 What You Can Do

### User Management
- ✅ Create new users
- ✅ Reset passwords
- ✅ Set usage location

### License Management
- ✅ View available licenses
- ✅ Assign licenses to users
- ✅ See license consumption

### Group Management
- ✅ List all groups
- ✅ Add users to groups

### Audit & Compliance
- ✅ View sign-in logs
- ✅ Track user activity
- ✅ Monitor failed logins

---

## 🔒 Security

- ✅ No passwords stored
- ✅ No client secrets
- ✅ Tokens in memory only
- ✅ Device code flow (secure)
- ✅ Admin consent required

---

## 🆘 Troubleshooting

| Issue | Fix |
|-------|-----|
| "Not authenticated" | Click Disconnect → Reconnect |
| "Access denied" | Grant admin consent in Azure |
| "Device code expired" | Click Connect again (faster this time) |
| "Resource not found" | Check UPN spelling |

---

## 📚 Full Documentation

- **Azure Setup:** `AZURE_APP_SETUP.md`
- **Implementation Details:** `M365_IMPLEMENTATION.md`

---

**Ready?** Launch the app and click "Microsoft 365"!
