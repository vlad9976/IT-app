# Getting Started with Auto-Updates

Step-by-step guide to get your IT Script Generator app published with auto-updates in under 15 minutes.

---

## ⏱️ 15-Minute Setup

### Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

This installs:
- `electron-updater` - Auto-update functionality
- `electron-log` - Update logging
- All other dependencies

---

### Step 2: Create GitHub Repository (3 minutes)

1. Go to: https://github.com/new
2. Repository name: `IT-Script-Generator` (or your choice)
3. Visibility: **Private** (recommended) or Public
4. Click **"Create repository"**
5. Copy the repository URL

**Initialize git (if not already):**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/IT-Script-Generator.git
git push -u origin main
```

---

### Step 3: Create GitHub Token (2 minutes)

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `IT-Toolkit-Publisher`
4. Expiration: **90 days** (or No expiration)
5. Select scope: ✅ **`repo`** (check the box)
6. Click **"Generate token"**
7. **COPY THE TOKEN** (starts with `ghp_`)

---

### Step 4: Run Setup Script (3 minutes)

```powershell
.\setup-github-updates.ps1
```

**The script will ask:**

1. **GitHub username:** Enter your username (e.g., `vlad9976`)
2. **Repository name:** Enter repo name (e.g., `IT-Script-Generator`)
3. **GitHub token:** Paste the token from Step 3

**Script will:**
- Update `package.json` with your repo info
- Save `GH_TOKEN` as environment variable
- Install dependencies (if needed)

---

### Step 5: Publish First Release (5 minutes)

```powershell
# Tag the current version
git tag v1.0.0
git push origin main
git push origin v1.0.0

# Build and publish
npm run publish
```

**Wait 2-5 minutes for build to complete.**

**You'll see:**
```
✔ Building React app...
✔ Packaging Electron app...
✔ Creating NSIS installer...
✔ Uploading to GitHub...
✔ Release v1.0.0 created!
```

---

### Step 6: Download and Test (2 minutes)

1. Go to: `https://github.com/YOUR_USERNAME/IT-Script-Generator/releases`
2. Download: `IT Script Generator Setup 1.0.0.exe`
3. Run the installer
4. App opens ✅

---

## ✅ You're Done!

Your app is now published with auto-update support.

---

## 🔄 Publishing Updates

### Quick Update (30 seconds)

```powershell
# Make code changes, then:
npm version patch && git push && git push --tags && npm run publish
```

**That's it!** Users will get the update automatically.

---

## 🧪 Testing Auto-Update

### Test the Update Flow

1. **Publish v1.0.1:**
   ```powershell
   npm version patch  # → 1.0.1
   git push && git push --tags
   npm run publish
   ```

2. **Open v1.0.0 app** on another machine

3. **Wait 10-30 seconds**

4. **You should see:**
   - Dialog: "Update available: v1.0.1"
   - Click "Download"
   - Wait for download
   - Dialog: "Update ready. Restart now?"
   - Click "Restart Now"
   - App updates to v1.0.1 ✅

---

## 🎯 Daily Workflow

### Making Changes

```powershell
# 1. Edit code
# ... make changes ...

# 2. Test locally
npm run dev

# 3. When ready to release
npm version patch  # or minor/major
git push && git push --tags
npm run publish

# Done! Users get update automatically.
```

---

## 🐛 Common Issues

### "GH_TOKEN is not set"

**Fix:**
```powershell
.\setup-github-updates.ps1
# Or manually:
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_YOUR_TOKEN', 'User')
# Restart terminal
```

---

### "Cannot find module 'electron-updater'"

**Fix:**
```bash
npm install
```

---

### "Update not detected"

**Checklist:**
- [ ] Version bumped in `package.json`?
- [ ] Git tag created and pushed?
- [ ] `npm run publish` completed successfully?
- [ ] GitHub Release contains `latest.yml`?
- [ ] Testing with installed app (not dev mode)?

---

## 📚 Documentation

**Quick help:**
- `QUICK_REFERENCE.md` - Command cheat sheet

**Detailed guides:**
- `AUTO_UPDATE_GUIDE.md` - Complete setup
- `BUILD_AND_PUBLISH.md` - Build workflow
- `UPDATE_FLOW.md` - Visual diagrams

**Validation:**
```powershell
.\validate-setup.ps1  # Check if everything is configured
```

---

## 🎊 Success Indicators

You're successful when:

1. ✅ `npm run publish` creates GitHub Release
2. ✅ Release has `.exe` and `latest.yml`
3. ✅ Users can install from `.exe`
4. ✅ App shows update notification when new version available
5. ✅ Update downloads and installs successfully

---

## 💡 Pro Tips

1. **Test locally first:** Always run `npm run build:win` before publishing
2. **Write release notes:** Help users understand changes
3. **Use semantic versioning:** Patch for bugs, minor for features
4. **Check logs:** `%APPDATA%\IT Script Generator\logs\main.log`
5. **Keep token secure:** Never commit to git

---

## 🚀 You're Ready!

**Start here:**
```powershell
.\setup-github-updates.ps1
```

**Then publish:**
```powershell
git tag v1.0.0
git push origin main --tags
npm run publish
```

**That's it!** 🎉

Your app now has professional auto-update capabilities.

---

## 📞 Need Help?

1. **Validate setup:** `.\validate-setup.ps1`
2. **Read guide:** `AUTO_UPDATE_GUIDE.md`
3. **Check logs:** `notepad "$env:APPDATA\IT Script Generator\logs\main.log"`

---

**Time to first release:** ~15 minutes

**Time to publish updates:** ~30 seconds

**User experience:** Seamless automatic updates ✨
