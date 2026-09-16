# 🔒 Private Repository Distribution Guide

## Overview

Your app is now configured to work with a **private GitHub repository**. This means:
- ✅ Code stays private
- ✅ Auto-updates still work
- ⚠️ Each user needs a GitHub token (one-time setup)

---

## 🎯 For You (Administrator)

### Step 1: Republish with Token Authentication

The app now includes token authentication code. Republish it:

```powershell
# Make sure GH_TOKEN is set
$env:GH_TOKEN = 'your_publish_token_here'

# Run the republish script
.\republish-with-token-auth.ps1
```

This creates version **1.0.3** with token authentication support.

### Step 2: Grant Team Access to GitHub Repo

Your team needs **read access** to the private repo:

1. Go to: https://github.com/vlad9976/IT-app/settings/access
2. Click "Manage access"
3. Click "Add people"
4. Add each team member's GitHub username
5. Give them **"Read"** role (not Write)

### Step 3: Prepare Distribution Package

**Create a folder with these files:**

```
IT-App-Distribution/
├── IT-Script-Generator-Setup-1.0.3.exe  (from GitHub release)
├── setup-user-token.ps1                  (from project folder)
└── PRIVATE_REPO_SETUP.md                 (from project folder)
```

### Step 4: Share with Team

**Via email, network drive, or chat:**

```
Hi Team,

I've built a new IT Script Generator tool.

📦 Installation Package: [link to folder or attachment]

⚠️ IMPORTANT: This uses a private repo, so you need to:
1. Install the app
2. Run setup-user-token.ps1
3. Create a GitHub token (instructions in the script)

See PRIVATE_REPO_SETUP.md for details.

Questions? Let me know!
```

---

## 👥 For Your Team Members

### What They Need to Do

**One-time setup (5 minutes):**

1. **Install the app:**
   - Run `IT-Script-Generator-Setup-1.0.3.exe`

2. **Set up GitHub token:**
   - Run `setup-user-token.ps1`
   - Follow the prompts
   - Create a read-only GitHub token

3. **Done!**
   - App will auto-update from now on

### Requirements for Team Members

Each team member needs:
- ✅ GitHub account
- ✅ Read access to `vlad9976/IT-app` repo (you grant this)
- ✅ Internet connection
- ✅ Windows 10/11

---

## 🔄 Update Workflow

### When You Publish Updates

```powershell
# 1. Update version in package.json
# 2. Commit changes
git add .
git commit -m "Add new features"

# 3. Tag and publish
git tag v1.0.4
git push origin main v1.0.4
npm run publish
```

### What Your Team Sees

1. **App checks for updates** (every 4 hours)
2. **Downloads in background** (if available)
3. **Prompts to restart:** "Update ready! Restart now?"
4. **User clicks restart** → Updated!

**No manual downloads needed!**

---

## 🔒 Security Model

### Your Publishing Token (GH_TOKEN)

- **Permissions:** Full repo access + write
- **Purpose:** Publish releases
- **Who has it:** Only you (admin)
- **Storage:** Your computer only

### User Tokens (Read-Only)

- **Permissions:** Read-only repo access
- **Purpose:** Download updates
- **Who has it:** Each team member
- **Storage:** Each user's computer (`~/.github-update-token`)

### Token Lifecycle

```
Admin Token (GH_TOKEN):
- Create once
- Use for all publishes
- Keep secret
- Rotate every 6 months

User Tokens:
- Each user creates their own
- Expires after 90 days
- User renews when needed
- Can be revoked anytime
```

---

## 🆘 Common Issues

### Issue: "Failed to check for updates" (404)

**Cause:** User's token not set or invalid

**Fix:**
```powershell
.\setup-user-token.ps1
```

### Issue: "Token doesn't work"

**Cause:** User doesn't have repo access

**Fix:**
1. Go to: https://github.com/vlad9976/IT-app/settings/access
2. Add the user with "Read" access
3. User runs `setup-user-token.ps1` again

### Issue: "Token expired"

**Cause:** Tokens expire after 90 days

**Fix:**
1. User creates new token
2. Runs `setup-user-token.ps1` again
3. Enters new token

---

## 📊 Comparison: Private vs Public Repo

| Feature | Private Repo | Public Repo |
|---------|--------------|-------------|
| Code visibility | Hidden | Visible to all |
| Auto-updates | Requires tokens | Works instantly |
| Team setup | 5 min per user | 0 min per user |
| Token management | Required | Not needed |
| Security | Same | Same |
| Distribution | Slightly harder | Easier |

**Note:** Making repo public doesn't compromise security if your app doesn't contain secrets.

---

## 🎯 Recommended Approach

### For Small Teams (< 10 people)
✅ **Keep private** - Token setup is manageable

### For Larger Teams (> 10 people)
✅ **Consider public** - Easier distribution, no token management

### If App Contains Sensitive Info
✅ **Keep private** - Security first

### If App is Generic IT Tool
✅ **Make public** - Easier for everyone

---

## 📝 Next Steps

1. **Run:** `.\republish-with-token-auth.ps1`
2. **Grant team access** on GitHub
3. **Prepare distribution package**
4. **Share with team** (app + setup script + guide)
5. **Support team** during initial setup

---

## 🔗 Quick Links

- **Repository:** https://github.com/vlad9976/IT-app
- **Releases:** https://github.com/vlad9976/IT-app/releases
- **Access Settings:** https://github.com/vlad9976/IT-app/settings/access
- **Create Token:** https://github.com/settings/tokens/new

---

**Questions?** Check `AUTO_UPDATE_GUIDE.md` for more details.
