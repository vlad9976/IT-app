# Project Structure

Complete file structure for the IT Script Generator with auto-update support.

---

## 📁 Directory Tree

```
script-generator/
│
├── 📂 electron/                          # Electron main process
│   ├── main.js                          # Main process + auto-updater logic ⭐
│   └── preload.js                       # IPC bridge for updates
│
├── 📂 src/                               # React application
│   ├── 📂 components/
│   │   ├── Sidebar.jsx                  # Script navigation + search
│   │   ├── ScriptPanel.jsx              # Main content area
│   │   ├── InputField.jsx               # Dynamic form inputs
│   │   ├── ScriptPreview.jsx            # Script display with syntax
│   │   ├── UpdateNotification.jsx       # Update status UI ⭐ NEW
│   │   ├── EventDocsModal.jsx           # Event ID documentation
│   │   ├── ServiceDocsModal.jsx         # Service documentation
│   │   ├── PortDocsModal.jsx            # Port documentation
│   │   └── M365LicenseDocsModal.jsx     # M365 license info
│   │
│   ├── 📂 data/
│   │   ├── scripts.json                 # All script templates
│   │   ├── eventDocs.js                 # Event ID reference
│   │   ├── serviceDocs.js               # Windows services reference
│   │   ├── portDocs.js                  # Network ports reference
│   │   └── m365LicenseDocs.js           # M365 licensing guide
│   │
│   ├── App.jsx                          # Root component
│   ├── main.jsx                         # React entry point
│   └── index.css                        # Global styles + Tailwind
│
├── 📂 build/                             # Build assets
│   ├── icon.ico                         # Windows icon (256x256)
│   └── icon.png                         # App icon
│
├── 📂 dist/                              # Vite build output (gitignored)
│   └── (React build files)
│
├── 📂 dist-electron/                     # Electron build output (gitignored)
│   ├── IT Script Generator Setup 1.0.0.exe  # Installer ⭐
│   ├── latest.yml                       # Update metadata ⭐
│   └── win-unpacked/                    # Unpacked app
│
├── 📄 package.json                       # Dependencies + build config ⭐
├── 📄 vite.config.js                     # Vite configuration
├── 📄 tailwind.config.js                 # Tailwind theme
├── 📄 postcss.config.js                  # PostCSS config
├── 📄 index.html                         # HTML entry point
├── 📄 .gitignore                         # Git ignore rules ⭐
│
├── 📄 AUTO_UPDATE_GUIDE.md               # Complete update guide ⭐ NEW
├── 📄 BUILD_AND_PUBLISH.md               # Build instructions ⭐ NEW
├── 📄 UPDATE_FLOW.md                     # Visual diagrams ⭐ NEW
├── 📄 QUICK_REFERENCE.md                 # Command cheat sheet ⭐ NEW
├── 📄 PROJECT_STRUCTURE.md               # This file ⭐ NEW
├── 📄 setup-github-updates.ps1           # Interactive setup ⭐ NEW
├── 📄 dev-app-update.yml                 # Dev update config ⭐ NEW
└── 📄 README.md                          # Project overview

⭐ = Modified or new for auto-update support
```

---

## 🔑 Key Files Explained

### `package.json`

**Purpose:** Project configuration, dependencies, build settings

**Key sections:**
```json
{
  "version": "1.0.0",           // ← Increment for each release
  "scripts": {
    "publish": "..."            // ← Builds and publishes to GitHub
  },
  "build": {
    "publish": [{
      "provider": "github",     // ← Auto-update via GitHub
      "owner": "YOUR_USERNAME", // ← Change this
      "repo": "YOUR_REPO"       // ← Change this
    }]
  },
  "dependencies": {
    "electron-updater": "^6.1.8" // ← Auto-update library
  }
}
```

---

### `electron/main.js`

**Purpose:** Electron main process + auto-updater logic

**Key functions:**
- `createWindow()` - Creates app window
- `initAutoUpdater()` - Configures update checks ⭐ NEW
- Event handlers for all update states ⭐ NEW

**Auto-update events:**
```javascript
autoUpdater.on('checking-for-update', ...)
autoUpdater.on('update-available', ...)
autoUpdater.on('update-not-available', ...)
autoUpdater.on('download-progress', ...)
autoUpdater.on('update-downloaded', ...)
autoUpdater.on('error', ...)
```

---

### `electron/preload.js`

**Purpose:** Secure IPC bridge between main and renderer

**Exposed APIs:**
```javascript
window.electron = {
  platform: 'win32',
  version: '...',
  onUpdateLog: (callback) => {...},  // ⭐ NEW
  checkForUpdates: () => {...}       // ⭐ NEW
}
```

---

### `src/components/UpdateNotification.jsx`

**Purpose:** Shows update status in UI ⭐ NEW

**States:**
- `checking` - Checking for updates
- `available` - Update found
- `downloading` - Download in progress
- `ready` - Ready to install
- `up-to-date` - No updates
- `error` - Check failed

---

### `src/data/scripts.json`

**Purpose:** All script templates and configurations

**Structure:**
```json
{
  "active_directory": [...],    // AD user management + DC hardening
  "local_users": [...],         // Local user management + PC hardening
  "m365": [...],                // Microsoft 365 scripts
  "system_maintenance": [...],  // System optimization
  "network_tools": [...],       // Network diagnostics
  "security": [...],            // Security tools
  "browser_tools": [...],       // Browser management
  "troubleshooting": [...]      // Troubleshooting utilities
}
```

---

### `dist-electron/latest.yml`

**Purpose:** Update metadata file ⭐ CRITICAL

**Generated automatically by electron-builder**

**Example content:**
```yaml
version: 1.0.1
files:
  - url: IT-Script-Generator-Setup-1.0.1.exe
    sha512: abc123...
    size: 125829120
path: IT-Script-Generator-Setup-1.0.1.exe
sha512: abc123...
releaseDate: '2026-03-01T12:00:00.000Z'
```

**Used by:** `electron-updater` to check for new versions

---

## 📚 Documentation Files

### User-Facing Docs

| File | Purpose | Audience |
|------|---------|----------|
| `README.md` | Project overview | Developers + Users |
| `QUICK_REFERENCE.md` | Command cheat sheet | Developers |

### Setup & Configuration

| File | Purpose | When to Use |
|------|---------|-------------|
| `AUTO_UPDATE_GUIDE.md` | Complete setup guide | First time setup |
| `setup-github-updates.ps1` | Interactive setup | First time setup |

### Build & Release

| File | Purpose | When to Use |
|------|---------|-------------|
| `BUILD_AND_PUBLISH.md` | Build instructions | Every release |
| `UPDATE_FLOW.md` | Visual diagrams | Understanding flow |

---

## 🔄 Update Flow Files

### On Developer Machine

```
package.json         → Defines version (1.0.1)
     ↓
npm run publish      → Triggers build
     ↓
electron-builder     → Creates .exe + latest.yml
     ↓
GitHub Release       → Hosts files
```

### On User Machine

```
App launches         → Checks GitHub
     ↓
latest.yml           → Downloaded and parsed
     ↓
Version comparison   → 1.0.0 < 1.0.1?
     ↓
Download .exe        → From GitHub Release
     ↓
Install update       → Replace old files
```

---

## 🎯 Critical Files for Auto-Update

**Must exist for updates to work:**

1. ✅ `package.json` - Version and GitHub config
2. ✅ `electron/main.js` - Auto-updater logic
3. ✅ `electron/preload.js` - IPC bridge
4. ✅ `dist-electron/latest.yml` - Update metadata (generated)
5. ✅ GitHub Release with `.exe` and `latest.yml`

**If any are missing:** Updates will fail silently

---

## 🔐 Security Files

**Never commit these:**
- `.env` - Environment variables
- `*.token` - Token files
- `GH_TOKEN.txt` - Token storage

**Already in `.gitignore`** ✅

---

## 📊 File Sizes (Approximate)

| File | Size | Purpose |
|------|------|---------|
| `IT Script Generator Setup.exe` | ~120 MB | Full installer |
| `latest.yml` | ~500 bytes | Update metadata |
| `main.log` | ~50 KB | Update logs |
| `scripts.json` | ~150 KB | All script templates |

---

## 🛠️ Build Artifacts

### After `npm run build:win`

```
dist-electron/
├── IT Script Generator Setup 1.0.0.exe    # Installer
├── IT Script Generator Setup 1.0.0.exe.blockmap  # Update diff
├── latest.yml                             # Update metadata
├── win-unpacked/                          # Unpacked app
│   ├── IT Script Generator.exe
│   ├── resources/
│   │   └── app.asar                       # Packed app code
│   └── (other electron files)
└── builder-debug.yml                      # Build config
```

**What to distribute:**
- **First install:** `IT Script Generator Setup 1.0.0.exe`
- **Updates:** Automatic via `latest.yml`

---

## 🎬 Complete Example

### Release v1.0.0 → v1.0.1

```powershell
# Current state: v1.0.0 released and installed by users

# 1. Fix a bug
# Edit: src/components/ScriptPanel.jsx

# 2. Test locally
npm run dev
# ... test the fix ...

# 3. Bump version
npm version patch
# Output: v1.0.1

# 4. Push
git push origin main
git push --tags

# 5. Publish
npm run publish

# Output:
# ✔ Building React app...
# ✔ Packaging Electron app...
# ✔ Creating installer...
# ✔ Uploading to GitHub...
# ✔ Release v1.0.1 created!

# 6. Verify on GitHub
# https://github.com/YOUR_USERNAME/YOUR_REPO/releases/tag/v1.0.1
# Should see:
#   - IT Script Generator Setup 1.0.1.exe
#   - latest.yml

# 7. User experience
# User opens app (v1.0.0)
# → Sees: "Update available: v1.0.1"
# → Clicks: "Download"
# → Waits: 2-3 minutes
# → Clicks: "Restart Now"
# → App updates to v1.0.1 ✅
```

---

## 💡 Pro Tips

1. **Always test locally first:** `npm run build:win` before `npm run publish`
2. **Use meaningful commit messages:** They appear in git history
3. **Write release notes:** Help users understand what changed
4. **Monitor logs:** Check `main.log` for update issues
5. **Keep token secure:** Never commit `GH_TOKEN`

---

## 🎉 You're Ready!

All files are configured for production-ready auto-updates.

**Next step:** Run `.\setup-github-updates.ps1` to begin!
