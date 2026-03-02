# 📦 Team Distribution Guide

## How to Share IT Script Generator with Your Team

This guide explains how to distribute the app to your team with automatic updates enabled.

---

## 🎯 Method 1: GitHub Releases (Recommended)

**Best for:** Teams that need automatic updates

### Prerequisites

1. **GitHub Personal Access Token**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: `IT-App-Publisher`
   - Select scopes:
     - ✅ `repo` (all)
     - ✅ `write:packages`
   - Copy the token (you'll only see it once!)

2. **Set Environment Variable (Windows)**

```powershell
# Option A: PowerShell (Current Session)
$env:GH_TOKEN = "your_token_here"

# Option B: System-wide (Permanent)
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'your_token_here', 'User')

# Verify it's set
echo $env:GH_TOKEN
```

### Step-by-Step Publishing

#### 1. Commit Your Latest Changes

```powershell
git add .
git commit -m "Add auto-update support"
git push origin main
```

#### 2. Create Version Tag

```powershell
# For first release
git tag v1.0.0
git push origin v1.0.0

# For updates (increment version)
git tag v1.0.1
git push origin v1.0.1
```

#### 3. Build and Publish

```powershell
npm run publish
```

This will:
- ✅ Build the React app
- ✅ Package the Electron app
- ✅ Create Windows installer (`.exe`)
- ✅ Upload to GitHub Releases
- ✅ Generate update metadata (`latest.yml`)

#### 4. Verify Release

1. Go to: https://github.com/vlad9976/IT-app/releases
2. You should see your release (e.g., `v1.0.0`)
3. Files attached:
   - `IT-Script-Generator-Setup-1.0.0.exe` (installer)
   - `latest.yml` (update metadata)

---

## 👥 How Your Team Installs It

### First-Time Installation

**Share this with your team:**

1. **Download the installer:**
   - Go to: https://github.com/vlad9976/IT-app/releases/latest
   - Download `IT-Script-Generator-Setup-X.X.X.exe`

2. **Run the installer:**
   - Double-click the `.exe` file
   - Choose installation directory
   - Click "Install"
   - Launch the app

3. **That's it!**
   - App will auto-update in the background
   - No manual updates needed

### What Users See

**On First Launch:**
```
✅ IT Script Generator is ready to use
```

**When Update Available:**
```
🔄 Checking for updates...
📥 Downloading update... (25%)
✅ Update ready! Restart to install?
   [Restart Now] [Later]
```

**Update happens silently in background** - users just click "Restart Now" when ready.

---

## 🔄 Publishing Updates

### When You Fix a Bug or Add Features

1. **Update version in `package.json`:**

```json
{
  "version": "1.0.1"  // Increment this
}
```

2. **Commit and tag:**

```powershell
git add .
git commit -m "Fix: Bug description"
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

3. **Publish:**

```powershell
npm run publish
```

4. **Your team gets the update automatically!**
   - App checks for updates every 4 hours
   - Downloads in background
   - Prompts user to restart

---

## 📋 Version Numbering Guide

Use semantic versioning: `MAJOR.MINOR.PATCH`

```
v1.0.0 → v1.0.1  (Bug fix)
v1.0.1 → v1.1.0  (New feature)
v1.1.0 → v2.0.0  (Breaking change)
```

**Examples:**
- `v1.0.1` - Fixed script generation bug
- `v1.1.0` - Added new Active Directory scripts
- `v2.0.0` - Complete UI redesign

---

## 🎯 Method 2: Direct File Share (No Auto-Update)

**Best for:** Quick testing or offline environments

### Build the Installer

```powershell
npm run build:win
```

### Share the File

1. **Find the installer:**
   - Location: `dist-electron\IT-Script-Generator-Setup-1.0.0.exe`

2. **Share via:**
   - Network drive
   - Email (if size permits)
   - USB drive
   - Internal file server

3. **Team installs manually:**
   - Run the `.exe` file
   - Follow installation wizard

⚠️ **Downside:** No automatic updates - you must manually share new versions

---

## 🔒 Security Best Practices

### For You (Publisher)

✅ **DO:**
- Keep `GH_TOKEN` secret
- Never commit token to git
- Use environment variables only
- Rotate token periodically

❌ **DON'T:**
- Hardcode token in code
- Share token in chat/email
- Commit `.env` files
- Push token to GitHub

### For Your Team

✅ **Safe:** Users don't need any tokens
✅ **Private:** App stays in your private GitHub repo
✅ **Secure:** Updates are verified with SHA512 checksums

---

## 🎨 Customization Before Sharing

### Update App Branding

**1. Change App Name:**

Edit `package.json`:

```json
{
  "name": "your-company-it-toolkit",
  "productName": "Your Company IT Toolkit"
}
```

**2. Change App Icon:**

- Create `build/icon.ico` (256x256px)
- Update `package.json`:

```json
{
  "build": {
    "win": {
      "icon": "build/icon.ico"
    }
  }
}
```

**3. Update Publisher Name:**

```json
{
  "build": {
    "win": {
      "publisherName": "Your Company IT Department"
    }
  }
}
```

---

## 📊 Monitoring Usage

### See Who Downloaded

1. Go to: https://github.com/vlad9976/IT-app/releases
2. Each release shows download count
3. Track which versions are most used

### GitHub Insights

- **Traffic:** See repo views
- **Releases:** Download statistics
- **Issues:** Team can report bugs

---

## 🆘 Troubleshooting

### Publishing Issues

**Error: `GH_TOKEN not set`**

```powershell
# Set it permanently
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'your_token_here', 'User')

# Restart PowerShell
```

**Error: `Permission denied`**

- Check token has `repo` scope
- Verify you own the repository
- Try regenerating token

**Build fails:**

```powershell
# Clean and rebuild
Remove-Item -Recurse -Force dist, dist-electron, node_modules
npm install
npm run publish
```

### User Installation Issues

**"Windows protected your PC"**

- Click "More info"
- Click "Run anyway"
- (This happens because app isn't code-signed)

**Update not working:**

- Check internet connection
- Verify GitHub repo is accessible
- Check `latest.yml` exists in release

---

## 🚀 Quick Start Checklist

- [ ] Set `GH_TOKEN` environment variable
- [ ] Update `package.json` version
- [ ] Commit all changes
- [ ] Create git tag
- [ ] Run `npm run publish`
- [ ] Verify release on GitHub
- [ ] Share download link with team
- [ ] Test installation on another PC

---

## 📞 Team Support Template

**Share this message with your team:**

```
Hi Team,

I've built a new IT Script Generator tool for our department.

🔗 Download: https://github.com/vlad9976/IT-app/releases/latest

📥 Installation:
1. Download the .exe file
2. Run the installer
3. Launch the app

✨ Features:
- Generate PowerShell scripts
- Active Directory tools
- Browser management
- System hardening scripts
- Auto-updates (no manual updates needed!)

❓ Issues? Contact me or create an issue on GitHub.

Thanks!
```

---

## 📚 Additional Resources

- **Setup Guide:** `AUTO_UPDATE_GUIDE.md`
- **Build Instructions:** `BUILD_AND_PUBLISH.md`
- **Update Flow:** `UPDATE_FLOW.md`
- **Quick Reference:** `QUICK_REFERENCE.md`

---

**Repository:** https://github.com/vlad9976/IT-app

**Current Version:** 1.0.0

**Last Updated:** March 2, 2026
