# GitHub Auto-Update Setup Guide

This guide explains how to set up, build, and publish the IT Script Generator with automatic updates via GitHub Releases.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Building the Application](#building-the-application)
4. [Publishing Updates](#publishing-updates)
5. [How Auto-Update Works](#how-auto-update-works)
6. [Troubleshooting](#troubleshooting)
7. [Security Best Practices](#security-best-practices)

---

## ✅ Prerequisites

### Required Software

- **Node.js** (v18 or higher)
- **Git** (for version control)
- **GitHub Account** (for hosting releases)

### Required Tokens

- **GitHub Personal Access Token** with `repo` scope

---

## 🚀 Initial Setup

### Step 1: Configure package.json

Edit `package.json` and update these fields:

```json
"build": {
  "publish": [
    {
      "provider": "github",
      "owner": "YOUR_GITHUB_USERNAME",    // ← Change this
      "repo": "YOUR_REPO_NAME",           // ← Change this
      "private": true
    }
  ]
}
```

**Example:**
```json
"owner": "vlad9976",
"repo": "IT-Script-Generator"
```

### Step 2: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name it: `IT-Toolkit-Publisher`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)

### Step 3: Set Environment Variable (Windows)

**Option A: PowerShell (Session-only)**
```powershell
$env:GH_TOKEN = "ghp_YOUR_TOKEN_HERE"
```

**Option B: System-wide (Recommended for CI/CD)**
```powershell
# Run PowerShell as Administrator
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_YOUR_TOKEN_HERE', 'User')
```

**Option C: Windows GUI**
1. Search: "Environment Variables"
2. Click "Environment Variables"
3. Under "User variables" → Click "New"
4. Variable name: `GH_TOKEN`
5. Variable value: `ghp_YOUR_TOKEN_HERE`
6. Click OK
7. **Restart your terminal/IDE**

### Step 4: Install Dependencies

```bash
npm install
```

This will install:
- `electron-updater` - Auto-update functionality
- `electron-log` - Update logging
- `electron-builder` - Build & publish tool

---

## 🏗️ Building the Application

### Development Build (No Updates)

```bash
npm run dev
```

This runs the app in development mode. Auto-updates are **disabled** in dev mode.

### Production Build (Local)

```bash
npm run build:win
```

This creates a production build in `dist-electron/` folder:
- `IT Script Generator Setup x.x.x.exe` - Installer
- `latest.yml` - Update metadata file

**Note:** This does NOT publish to GitHub.

---

## 📤 Publishing Updates

### First Release (v1.0.0)

1. **Update version in package.json:**
   ```json
   "version": "1.0.0"
   ```

2. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin main
   git push origin v1.0.0
   ```

3. **Build and publish:**
   ```bash
   npm run publish
   ```

   This will:
   - Build the React app
   - Package with electron-builder
   - Create a GitHub Release (v1.0.0)
   - Upload installer + `latest.yml`

4. **Distribute the installer:**
   - Download `IT Script Generator Setup 1.0.0.exe` from GitHub Releases
   - Send to your team
   - They install it normally

---

### Subsequent Updates (v1.0.1, v1.1.0, etc.)

1. **Make your code changes**

2. **Update version in package.json:**
   ```json
   "version": "1.0.1"
   ```

3. **Commit and tag:**
   ```bash
   git add .
   git commit -m "Release v1.0.1 - Bug fixes and improvements"
   git tag v1.0.1
   git push origin main
   git push origin v1.0.1
   ```

4. **Publish:**
   ```bash
   npm run publish
   ```

5. **What happens next:**
   - New release created on GitHub
   - Users with v1.0.0 will see update notification
   - They click "Download" → app downloads in background
   - When done, they click "Restart Now" → app updates automatically

---

## 🔄 How Auto-Update Works

### User Experience Flow

#### First Install (v1.0.0)
1. User downloads `IT Script Generator Setup 1.0.0.exe` from GitHub
2. Runs installer
3. App opens normally
4. Auto-updater checks GitHub for updates (finds none)

#### When Update is Available (v1.0.1 released)
1. **App checks for updates** (on startup + every 4 hours)
2. **Dialog appears:**
   ```
   ┌─────────────────────────────────────┐
   │ Update Available                    │
   ├─────────────────────────────────────┤
   │ A new version (v1.0.1) is available!│
   │                                     │
   │ Would you like to download it now? │
   │ The app will continue running       │
   │ during download.                    │
   │                                     │
   │  [Download]  [Later]                │
   └─────────────────────────────────────┘
   ```

3. **User clicks "Download":**
   - Download happens in background
   - App remains usable
   - Progress logged to console

4. **When download completes:**
   ```
   ┌─────────────────────────────────────┐
   │ Update Ready                        │
   ├─────────────────────────────────────┤
   │ Update downloaded successfully!     │
   │                                     │
   │ Version 1.0.1 is ready to install.  │
   │ The app will restart to complete    │
   │ the installation.                   │
   │                                     │
   │  [Restart Now]  [Restart Later]     │
   └─────────────────────────────────────┘
   ```

5. **User clicks "Restart Now":**
   - App closes
   - Installer runs silently
   - App reopens with new version

6. **User clicks "Restart Later":**
   - Update installs automatically next time they close the app

### Technical Flow

```
App Startup (v1.0.0)
    ↓
Check GitHub Releases
    ↓
Compare versions
    ↓
┌─────────────────────┬──────────────────────┐
│ No Update           │ Update Available     │
│ (v1.0.0 is latest)  │ (v1.0.1 found)       │
│                     │                      │
│ Continue normally   │ Show dialog          │
│                     │   ↓                  │
│                     │ User clicks Download │
│                     │   ↓                  │
│                     │ Download .exe        │
│                     │   ↓                  │
│                     │ Show "Restart?"      │
│                     │   ↓                  │
│                     │ quitAndInstall()     │
│                     │   ↓                  │
│                     │ App restarts (v1.0.1)│
└─────────────────────┴──────────────────────┘
```

---

## 🛠️ Troubleshooting

### Issue: "Cannot find module 'electron-updater'"

**Solution:**
```bash
npm install
```

### Issue: "GH_TOKEN is not set"

**Solution:**
```powershell
# Check if token is set
echo $env:GH_TOKEN

# If empty, set it
$env:GH_TOKEN = "ghp_YOUR_TOKEN_HERE"

# Verify
echo $env:GH_TOKEN
```

### Issue: "Update not available" (but new version exists)

**Checklist:**
1. ✅ Did you increment version in `package.json`?
2. ✅ Did you create a git tag matching the version?
3. ✅ Did you push the tag to GitHub?
4. ✅ Did `npm run publish` complete successfully?
5. ✅ Does the GitHub Release contain `latest.yml`?
6. ✅ Is the release marked as "Latest release" (not pre-release)?

### Issue: "Update check fails silently"

**Debug:**
1. Check logs in: `%APPDATA%\IT Script Generator\logs\`
2. Look for `main.log`
3. Search for "update" or "error"

**Common causes:**
- Private repo but token not configured
- Network/firewall blocking GitHub
- Incorrect owner/repo in `package.json`

### Issue: "Update downloads but doesn't install"

**Solution:**
- Make sure user has admin rights
- Check if antivirus is blocking the installer
- Verify `latest.yml` exists in the GitHub Release

---

## 🔒 Security Best Practices

### 1. Never Commit Tokens

❌ **NEVER DO THIS:**
```json
"GH_TOKEN": "ghp_abc123..."
```

✅ **ALWAYS DO THIS:**
```powershell
$env:GH_TOKEN = "ghp_abc123..."
```

### 2. Add to .gitignore

Ensure `.env` and token files are ignored:
```
.env
.env.local
*.token
```

### 3. Use Separate Tokens

- **Development:** Personal token with `repo` scope
- **CI/CD (GitHub Actions):** Use `GITHUB_TOKEN` secret

### 4. Rotate Tokens Regularly

- Regenerate tokens every 90 days
- Revoke old tokens immediately

### 5. Code Signing (Optional but Recommended)

For production apps, sign your code to avoid Windows SmartScreen warnings:

1. Purchase code signing certificate
2. Add to `package.json`:
   ```json
   "win": {
     "certificateFile": "path/to/cert.pfx",
     "certificatePassword": "CERT_PASSWORD"
   }
   ```

---

## 📊 Update Workflow Summary

### For Developers

```bash
# 1. Make changes to code
# 2. Update version
npm version patch  # 1.0.0 → 1.0.1
# or
npm version minor  # 1.0.0 → 1.1.0

# 3. Commit and tag
git add .
git commit -m "Release v1.0.1"
git push origin main
git push --tags

# 4. Publish
npm run publish
```

### For End Users

1. **First install:** Download and run installer from GitHub
2. **Updates:** Automatic! Just click "Download" when prompted
3. **No manual downloads** needed after first install

---

## 🎯 Testing Auto-Update

### Test Scenario

1. **Build v1.0.0:**
   ```bash
   # Set version to 1.0.0
   npm run publish
   ```

2. **Install v1.0.0** on test machine

3. **Build v1.0.1:**
   ```bash
   # Set version to 1.0.1
   npm run publish
   ```

4. **Open v1.0.0** on test machine
5. **Wait 10 seconds** - update dialog should appear
6. **Click "Download"** - watch progress
7. **Click "Restart Now"** - app should update to v1.0.1

---

## 📝 Release Checklist

Before publishing a new version:

- [ ] All features tested locally
- [ ] Version number incremented in `package.json`
- [ ] Changelog/release notes prepared
- [ ] Code committed to git
- [ ] Git tag created and pushed
- [ ] `GH_TOKEN` environment variable is set
- [ ] `npm run publish` executed successfully
- [ ] GitHub Release created with installer + `latest.yml`
- [ ] Test update on a machine with previous version

---

## 🔧 Advanced Configuration

### Custom Update Check Interval

Edit `electron/main.js`:

```javascript
// Check every 2 hours instead of 4
setInterval(() => {
  autoUpdater.checkForUpdatesAndNotify();
}, 2 * 60 * 60 * 1000);
```

### Silent Updates (No User Prompt)

```javascript
autoUpdater.autoDownload = true;  // Auto-download updates
autoUpdater.autoInstallOnAppQuit = true;  // Auto-install on quit
```

### Manual Update Check Button

Add to your React UI:

```javascript
// In renderer process
window.electron.checkForUpdates();
```

Then in `preload.js`:
```javascript
ipcRenderer.on('update-available', (event, info) => {
  console.log('Update available:', info);
});
```

---

## 📞 Support

If you encounter issues:

1. Check logs: `%APPDATA%\IT Script Generator\logs\main.log`
2. Verify GitHub Release has both `.exe` and `latest.yml`
3. Ensure version in `package.json` matches git tag
4. Test with `GH_TOKEN` set correctly

---

## 🎉 Summary

**One-time setup:**
- Configure `package.json` with your GitHub repo
- Create and set `GH_TOKEN`

**Every release:**
```bash
npm version patch
git push && git push --tags
npm run publish
```

**Users get updates automatically** - no manual downloads needed! 🚀
