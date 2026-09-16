# 🔒 Private Repository Setup Guide

## For Team Members - Enable Auto-Updates

Since this app uses a **private GitHub repository**, you need to set up a personal token to receive automatic updates.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install the App

1. Download the installer from your admin
2. Run `IT-Script-Generator-Setup-1.0.2.exe`
3. Complete installation

### Step 2: Set Up Update Token

**Run this script** (included with the app):

```powershell
.\setup-user-token.ps1
```

The script will:
- Guide you to create a GitHub token
- Save it securely on your computer
- Test that it works

### Step 3: Done!

Launch the app - updates will now work automatically!

---

## 📝 Manual Setup (If Script Doesn't Work)

### Create GitHub Token

1. Go to: https://github.com/settings/tokens/new
2. **Note:** `IT App Updates`
3. **Expiration:** 90 days (recommended)
4. **Scopes:** Check ONLY:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (starts with `ghp_...`)

### Save Token to File

**Windows:**

1. Open Notepad
2. Paste your token
3. Save as: `C:\Users\YOUR_USERNAME\.github-update-token`
   - **Important:** No file extension (not `.txt`)
   - Save in your home directory (e.g., `C:\Users\John\`)

**PowerShell command:**

```powershell
# Replace YOUR_TOKEN with your actual token
"ghp_your_token_here" | Out-File -FilePath "$env:USERPROFILE\.github-update-token" -Encoding UTF8 -NoNewline
```

### Verify Setup

1. Check file exists:
```powershell
Test-Path "$env:USERPROFILE\.github-update-token"
```

Should return: `True`

2. Launch the app
3. Check for updates (should work without errors)

---

## 🔄 Update Workflow

Once set up:

1. **App checks automatically** every 4 hours
2. **Downloads updates** in background
3. **Prompts you to restart** when ready
4. **No manual downloads** needed!

---

## 🔒 Security

### Your Token is Safe

- ✅ Stored locally on your computer only
- ✅ Never shared or transmitted (except to GitHub)
- ✅ Read-only access (can't modify code)
- ✅ Can be revoked anytime

### Token Permissions

Your token can ONLY:
- ✅ Read releases from the private repo
- ✅ Download update files
- ❌ Cannot modify code
- ❌ Cannot access other repos
- ❌ Cannot push changes

### Revoke Token

If you leave the team or token is compromised:

1. Go to: https://github.com/settings/tokens
2. Find your token
3. Click "Delete"
4. Token stops working immediately

---

## ❓ Troubleshooting

### "Failed to check for updates" Error

**Cause:** Token not set or invalid

**Fix:**
```powershell
# Check if file exists
Test-Path "$env:USERPROFILE\.github-update-token"

# If False, run setup again
.\setup-user-token.ps1
```

### "404 Not Found" Error

**Cause:** Token doesn't have repo access

**Fix:**
1. Create new token with `repo` scope
2. Save it again using the script

### Token Expired

**Cause:** Tokens expire after 90 days (or your chosen duration)

**Fix:**
1. Create new token (same process)
2. Run `.\setup-user-token.ps1` again
3. Enter new token

---

## 👥 For Administrators

### Distributing the App

**Include these files with the installer:**

1. `IT-Script-Generator-Setup-1.0.2.exe` (the app)
2. `setup-user-token.ps1` (token setup script)
3. `PRIVATE_REPO_SETUP.md` (this guide)

**Share via:**
- Network drive
- Email
- Internal wiki/documentation

### User Instructions Template

```
Hi Team,

Please install the IT Script Generator:

1. Run: IT-Script-Generator-Setup-1.0.2.exe
2. Run: setup-user-token.ps1
3. Follow the prompts to create your GitHub token

This enables automatic updates.

Questions? See PRIVATE_REPO_SETUP.md

Thanks!
```

### Managing Team Access

**Grant repo access:**

1. Go to: https://github.com/vlad9976/IT-app/settings/access
2. Click "Add people"
3. Add team members
4. Give them "Read" access (not Write)

**This allows them to:**
- ✅ Download releases
- ✅ Receive updates
- ❌ Cannot modify code

---

## 🔗 Quick Links

- **Repository:** https://github.com/vlad9976/IT-app
- **Create Token:** https://github.com/settings/tokens/new
- **Manage Tokens:** https://github.com/settings/tokens
- **Repo Access:** https://github.com/vlad9976/IT-app/settings/access

---

## 📊 Token Lifecycle

```
Day 1: Create token → Save to file → App works
Day 90: Token expires → Create new token → Update file
```

**Tip:** Set a calendar reminder to renew tokens before they expire!

---

**Need help?** Contact your IT administrator or create an issue on GitHub.
