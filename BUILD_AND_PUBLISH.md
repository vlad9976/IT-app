# Build & Publish Guide

Complete guide for building and publishing the IT Script Generator with auto-updates.

---

## 🎯 Quick Start

### First Time Setup

```powershell
# 1. Run the setup script
.\setup-github-updates.ps1

# 2. Commit and tag
git add .
git commit -m "Release v1.0.0"
git tag v1.0.0
git push origin main
git push origin v1.0.0

# 3. Publish
npm run publish
```

---

## 📦 Build Commands

### Development

```bash
npm run dev
```

- Runs app in development mode
- Hot reload enabled
- DevTools open by default
- Auto-updates **disabled**

### Production Build (Local)

```bash
npm run build:win
```

**Output:** `dist-electron/IT Script Generator Setup x.x.x.exe`

**Use for:**
- Local testing
- Manual distribution
- Does NOT publish to GitHub

### Production Build + Publish

```bash
npm run publish
```

**This command:**
1. Builds React app (`vite build`)
2. Packages with electron-builder
3. Creates GitHub Release
4. Uploads installer + `latest.yml`

**Requirements:**
- `GH_TOKEN` environment variable set
- Git tag matching version exists
- Committed changes

---

## 🔄 Release Workflow

### Scenario 1: First Release (v1.0.0)

```powershell
# Step 1: Ensure version is set
# Edit package.json → "version": "1.0.0"

# Step 2: Commit everything
git add .
git commit -m "Initial release v1.0.0"

# Step 3: Create and push tag
git tag v1.0.0
git push origin main
git push origin v1.0.0

# Step 4: Publish to GitHub
npm run publish

# Step 5: Download installer from GitHub Releases
# Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/releases
# Download: IT Script Generator Setup 1.0.0.exe

# Step 6: Distribute to team
# Send the .exe file to your team members
# They install it normally (double-click)
```

**What users get:**
- Installed app in `C:\Program Files\IT Script Generator\`
- Desktop shortcut
- Start menu entry
- Auto-update capability built-in

---

### Scenario 2: Bug Fix Release (v1.0.0 → v1.0.1)

```powershell
# Step 1: Fix bugs in code

# Step 2: Bump version
npm version patch
# This updates package.json to 1.0.1 and creates a git commit

# Step 3: Push
git push origin main
git push --tags

# Step 4: Publish
npm run publish
```

**What users see:**
1. App checks for updates (startup or every 4 hours)
2. Dialog: "Update available: v1.0.1"
3. User clicks "Download"
4. Download happens in background (app stays open)
5. Dialog: "Update ready. Restart now?"
6. User clicks "Restart Now"
7. App closes → installer runs → app reopens with v1.0.1

---

### Scenario 3: Feature Release (v1.0.1 → v1.1.0)

```powershell
# Step 1: Add new features

# Step 2: Bump minor version
npm version minor
# This updates package.json to 1.1.0

# Step 3: Push
git push origin main
git push --tags

# Step 4: Publish with release notes
npm run publish

# Step 5: Add release notes on GitHub
# Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/releases
# Edit the v1.1.0 release
# Add description:
#   - New feature: XYZ
#   - Improved: ABC
#   - Fixed: Bug in DEF
```

---

## 🔐 GitHub Token Setup

### Create Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Settings:
   - **Name:** `IT-Toolkit-Publisher`
   - **Expiration:** 90 days (or No expiration)
   - **Scopes:** ✅ `repo` (all sub-scopes)
4. Click **"Generate token"**
5. **COPY THE TOKEN** (starts with `ghp_`)

### Set Token (Windows)

**Method 1: PowerShell (Permanent)**

```powershell
# Run as Administrator
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_YOUR_TOKEN_HERE', 'User')

# Restart terminal/IDE
```

**Method 2: System Properties GUI**

1. Press `Win + R`
2. Type: `sysdm.cpl` → Enter
3. Go to "Advanced" tab
4. Click "Environment Variables"
5. Under "User variables" → Click "New"
6. Variable name: `GH_TOKEN`
7. Variable value: `ghp_YOUR_TOKEN_HERE`
8. Click OK
9. **Restart terminal/IDE**

**Method 3: Session-only (Temporary)**

```powershell
$env:GH_TOKEN = "ghp_YOUR_TOKEN_HERE"
npm run publish
```

⚠️ **Note:** This only works for the current PowerShell session.

### Verify Token

```powershell
# Check if set
echo $env:GH_TOKEN

# Should output: ghp_...
```

---

## 📁 Build Output

After running `npm run publish`, you'll get:

```
dist-electron/
├── IT Script Generator Setup 1.0.0.exe    ← Installer (users download this)
├── latest.yml                             ← Update metadata (required!)
├── win-unpacked/                          ← Unpacked app files
└── builder-debug.yml                      ← Build configuration
```

**Important Files:**
- **`.exe`** - Full installer for new users
- **`latest.yml`** - Tells existing users where to download updates

Both files are automatically uploaded to GitHub Releases.

---

## 🌐 GitHub Release Structure

After publishing, your GitHub Release will look like:

```
Release: v1.0.0
├── IT Script Generator Setup 1.0.0.exe (120 MB)
├── latest.yml (500 bytes)
└── Release notes (optional)
```

**What each file does:**
- **`.exe`**: Full installer for first-time installation
- **`latest.yml`**: Contains update metadata (version, download URL, checksums)

---

## 🧪 Testing Auto-Update

### Test Plan

1. **Build v1.0.0:**
   ```powershell
   # Set version to 1.0.0 in package.json
   git add .
   git commit -m "Test v1.0.0"
   git tag v1.0.0
   git push origin main --tags
   npm run publish
   ```

2. **Install v1.0.0:**
   - Download from GitHub Releases
   - Install on test machine
   - Open app → should say "v1.0.0" in title or about

3. **Build v1.0.1:**
   ```powershell
   # Set version to 1.0.1 in package.json
   git add .
   git commit -m "Test v1.0.1"
   git tag v1.0.1
   git push origin main --tags
   npm run publish
   ```

4. **Test update:**
   - Open v1.0.0 app on test machine
   - Wait 10-30 seconds
   - Should see: "Update available: v1.0.1"
   - Click "Download"
   - Wait for download
   - Click "Restart Now"
   - App should reopen as v1.0.1

---

## ⚠️ Common Issues

### Issue: "GH_TOKEN is not set"

**Error:**
```
Error: GitHub token is not set
```

**Solution:**
```powershell
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_YOUR_TOKEN', 'User')
# Restart terminal
```

---

### Issue: "Cannot publish, tag already exists"

**Error:**
```
Error: Release v1.0.0 already exists
```

**Solution:**

Either bump version:
```powershell
npm version patch  # 1.0.0 → 1.0.1
npm run publish
```

Or delete the existing release on GitHub and re-publish.

---

### Issue: "Update not detected by users"

**Checklist:**
- [ ] Did you increment version in `package.json`?
- [ ] Did you create a git tag matching the version?
- [ ] Did you push the tag to GitHub?
- [ ] Does the GitHub Release contain `latest.yml`?
- [ ] Is the release marked as "Latest" (not draft or pre-release)?
- [ ] Are users running the installed app (not dev mode)?

---

### Issue: "latest.yml missing from release"

**Cause:** Build failed or was interrupted

**Solution:**
```powershell
# Clean and rebuild
Remove-Item dist-electron -Recurse -Force -ErrorAction SilentlyContinue
npm run publish
```

---

### Issue: "Update downloads but doesn't install"

**Possible causes:**
- User doesn't have admin rights
- Antivirus blocking the installer
- App is running from a restricted location

**Solution:**
- Run app as Administrator
- Add exception to antivirus
- Install to `C:\Program Files\` (default location)

---

## 🎯 Version Numbering

Use semantic versioning: `MAJOR.MINOR.PATCH`

### When to bump:

**PATCH (1.0.0 → 1.0.1)**
- Bug fixes
- Small tweaks
- No new features

```powershell
npm version patch
```

**MINOR (1.0.1 → 1.1.0)**
- New features
- New scripts added
- UI improvements

```powershell
npm version minor
```

**MAJOR (1.1.0 → 2.0.0)**
- Breaking changes
- Complete redesign
- Major architecture changes

```powershell
npm version major
```

---

## 📊 Update Statistics

### Check Update Logs

**Location:** `%APPDATA%\IT Script Generator\logs\main.log`

**View logs:**
```powershell
notepad "$env:APPDATA\IT Script Generator\logs\main.log"
```

**What to look for:**
- `Checking for updates...`
- `Update available: vX.X.X`
- `Update not available`
- `Download progress: XX%`
- `Update downloaded`
- `Error: ...`

---

## 🚀 CI/CD with GitHub Actions (Optional)

Automate publishing with GitHub Actions:

Create `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build and publish
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run publish
```

**Usage:**
```powershell
git tag v1.0.1
git push origin v1.0.1
# GitHub Actions automatically builds and publishes
```

---

## 📝 Pre-Release Checklist

Before running `npm run publish`:

- [ ] Code changes committed
- [ ] Version bumped in `package.json`
- [ ] Git tag created and pushed
- [ ] `GH_TOKEN` environment variable set
- [ ] Tested locally with `npm run build:win`
- [ ] Release notes prepared (optional)
- [ ] Team notified about upcoming update

---

## 🎉 Success Indicators

After publishing, verify:

1. ✅ GitHub Release created
2. ✅ Release contains `.exe` file
3. ✅ Release contains `latest.yml`
4. ✅ Release is marked as "Latest"
5. ✅ Tag matches version in `package.json`

---

## 💡 Pro Tips

### Tip 1: Test Before Publishing

Always test the build locally first:

```powershell
npm run build:win
# Install the .exe from dist-electron/
# Test all features
# Then publish
```

### Tip 2: Staged Rollout

For critical updates:
1. Publish as "Pre-release" first
2. Test with a small group
3. Mark as "Latest release" when confirmed stable

### Tip 3: Rollback Strategy

If an update has issues:
1. Delete the problematic release on GitHub
2. The previous version becomes "latest"
3. Users won't get the bad update

### Tip 4: Update Frequency

Recommended:
- **Bug fixes:** As needed (immediate)
- **Features:** Weekly or bi-weekly
- **Major versions:** Monthly or quarterly

Don't update too frequently - users may get "update fatigue".

---

## 📞 Support

If something goes wrong:

1. **Check logs:** `%APPDATA%\IT Script Generator\logs\main.log`
2. **Verify token:** `echo $env:GH_TOKEN`
3. **Check GitHub:** Releases page for your repo
4. **Test locally:** `npm run build:win` first

---

## 🎬 Complete Example

```powershell
# Starting from v1.0.0, releasing v1.0.1

# 1. Make code changes
# ... edit files ...

# 2. Bump version and commit
npm version patch
# This creates commit: "1.0.1" and tag: "v1.0.1"

# 3. Push
git push origin main
git push --tags

# 4. Publish
npm run publish

# Wait 2-5 minutes for build to complete

# 5. Verify on GitHub
# https://github.com/YOUR_USERNAME/YOUR_REPO/releases
# Should see v1.0.1 with .exe and latest.yml

# 6. Test update
# Open v1.0.0 app on another machine
# Should see update notification within 30 seconds
```

---

## 🏁 Summary

**One-time setup:**
1. Configure GitHub repo in `package.json`
2. Create and set `GH_TOKEN`
3. Run `npm install`

**Every release:**
1. `npm version patch/minor/major`
2. `git push && git push --tags`
3. `npm run publish`

**Users experience:**
- Automatic update notifications
- Background downloads
- One-click installation
- Zero manual downloads after first install

🎉 **That's it!** Your app now has professional auto-update capabilities.
