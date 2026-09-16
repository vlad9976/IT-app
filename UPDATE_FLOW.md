# Auto-Update Flow Diagram

Visual representation of how the auto-update system works.

---

## 🔄 Complete Update Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPER WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

    Developer makes changes
            ↓
    npm version patch (1.0.0 → 1.0.1)
            ↓
    git push && git push --tags
            ↓
    npm run publish
            ↓
    ┌───────────────────────────────┐
    │   electron-builder runs       │
    │   - Builds React app          │
    │   - Packages Electron app     │
    │   - Creates .exe installer    │
    │   - Generates latest.yml      │
    └───────────────────────────────┘
            ↓
    ┌───────────────────────────────┐
    │   Uploads to GitHub           │
    │   - Creates Release v1.0.1    │
    │   - Uploads .exe              │
    │   - Uploads latest.yml        │
    └───────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      USER WORKFLOW                              │
└─────────────────────────────────────────────────────────────────┘

    User opens app (v1.0.0)
            ↓
    ┌───────────────────────────────┐
    │   autoUpdater.checkForUpdates │
    │   - Fetches latest.yml        │
    │   - Compares versions         │
    └───────────────────────────────┘
            ↓
    ┌─────────────┬─────────────────┐
    │ No Update   │ Update Found    │
    │ (v1.0.0)    │ (v1.0.1)        │
    └─────────────┴─────────────────┘
                        ↓
            ┌───────────────────────┐
            │  Dialog: "Update      │
            │  available: v1.0.1"   │
            │  [Download] [Later]   │
            └───────────────────────┘
                        ↓
                User clicks "Download"
                        ↓
            ┌───────────────────────┐
            │  Background download  │
            │  - Fetches .exe       │
            │  - Shows progress     │
            │  - App stays open     │
            └───────────────────────┘
                        ↓
            ┌───────────────────────┐
            │  Dialog: "Update      │
            │  ready. Restart?"     │
            │  [Restart] [Later]    │
            └───────────────────────┘
                        ↓
                User clicks "Restart"
                        ↓
            ┌───────────────────────┐
            │  App closes           │
            │  Installer runs       │
            │  (silent update)      │
            │  App reopens          │
            └───────────────────────┘
                        ↓
            User now has v1.0.1 ✅
```

---

## 📋 Detailed Event Flow

### On App Startup (Production Mode)

```javascript
app.whenReady()
    ↓
initAutoUpdater()
    ↓
autoUpdater.checkForUpdatesAndNotify()
    ↓
Event: 'checking-for-update'
    → Log: "Checking for updates..."
    → Fetch: https://api.github.com/repos/OWNER/REPO/releases/latest
    ↓
┌─────────────────────────┬─────────────────────────┐
│ Event: update-available │ Event: update-not-avail │
│ (newer version found)   │ (current is latest)     │
└─────────────────────────┴─────────────────────────┘
            ↓                           ↓
    Show dialog                  Log: "Up to date"
    User clicks "Download"       Continue normally
            ↓
    autoUpdater.downloadUpdate()
            ↓
    Event: 'download-progress'
    → Log: "Download: 45% (54MB/120MB)"
    → Update UI notification
            ↓
    Event: 'update-downloaded'
    → Show "Restart?" dialog
            ↓
    User clicks "Restart Now"
            ↓
    autoUpdater.quitAndInstall()
    → App closes
    → NSIS installer runs
    → Replaces old files
    → App reopens
            ↓
    ✅ Updated successfully
```

---

## 🕐 Update Check Schedule

```
App Launch
    ↓
Immediate check
    ↓
    ├─ Check every 4 hours
    ├─ Check every 4 hours
    ├─ Check every 4 hours
    └─ ... (continues while app is open)

App Close
    ↓
If update pending → Install automatically
```

**Configurable in `electron/main.js`:**

```javascript
// Check every 2 hours instead
setInterval(() => {
  autoUpdater.checkForUpdatesAndNotify();
}, 2 * 60 * 60 * 1000);
```

---

## 🔒 Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY MEASURES                            │
└─────────────────────────────────────────────────────────────────┘

    GH_TOKEN stored in environment
            ↓
    Never committed to git
            ↓
    Used only during 'npm run publish'
            ↓
    ┌───────────────────────────────┐
    │   electron-builder            │
    │   - Authenticates with GitHub │
    │   - Uploads via HTTPS         │
    │   - Uses GitHub API           │
    └───────────────────────────────┘
            ↓
    Files uploaded to GitHub Release
            ↓
    ┌───────────────────────────────┐
    │   User's app checks update    │
    │   - Fetches latest.yml        │
    │   - Verifies checksums        │
    │   - Downloads via HTTPS       │
    └───────────────────────────────┘
            ↓
    Update installed securely
```

**Security features:**
- ✅ HTTPS for all downloads
- ✅ SHA512 checksum verification
- ✅ No token in app binary
- ✅ Private repo support
- ✅ Signed updates (if code signing enabled)

---

## 📈 Rollout Strategy

### Conservative Approach

```
v1.0.0 (Stable)
    ↓
v1.0.1-beta (Pre-release)
    ↓ (test with 5 users)
    ↓
v1.0.1 (Release)
    ↓ (all users get update)
```

**How to create pre-release:**

```powershell
# Publish as pre-release
npm version prerelease --preid=beta
# Creates: 1.0.1-beta.0

npm run publish

# On GitHub, mark release as "Pre-release"
```

### Aggressive Approach

```
v1.0.0
    ↓
v1.0.1 (immediate release)
    ↓ (all users get update)
```

Use for:
- Critical security fixes
- Major bug fixes
- Stable features

---

## 🎯 Real-World Scenarios

### Scenario: Emergency Hotfix

```powershell
# Critical bug found in v1.0.0

# 1. Fix the bug
# ... edit code ...

# 2. Quick release
npm version patch  # → 1.0.1
git push && git push --tags
npm run publish

# 3. Notify team
# "Critical update available - please restart app"

# 4. Users get update within 4 hours (or on next app launch)
```

**Timeline:**
- 0 min: Bug discovered
- 5 min: Fix implemented
- 10 min: Published to GitHub
- 15 min: First users see update notification
- 20 min: Users install update
- ✅ Bug fixed for everyone

---

### Scenario: Feature Release

```powershell
# New feature: M365 management scripts

# 1. Develop feature (takes 2 days)
# ... add scripts ...

# 2. Test thoroughly
npm run dev
# ... test all features ...

# 3. Build locally first
npm run build:win
# Install and test the .exe

# 4. Release
npm version minor  # → 1.1.0
git push && git push --tags
npm run publish

# 5. Add release notes on GitHub
# Describe new features

# 6. Announce to team
# "New version available with M365 scripts!"
```

---

## 📊 Update Metrics

Track update adoption:

```powershell
# Check GitHub Release download stats
# Go to: https://github.com/OWNER/REPO/releases
# Each release shows download count

# Example:
# v1.0.1 - 45 downloads
# v1.0.0 - 50 downloads
# → 90% adoption rate
```

---

## ✨ Best Practices Summary

1. **Always test locally** before publishing
2. **Use semantic versioning** consistently
3. **Write clear release notes** for each version
4. **Keep GH_TOKEN secure** (never commit)
5. **Tag every release** (matches version)
6. **Monitor logs** for update issues
7. **Communicate updates** to your team
8. **Have a rollback plan** for bad releases

---

🚀 **You're now ready to ship production-grade auto-updating Windows apps!**
