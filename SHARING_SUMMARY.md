# 📤 How to Share with Your Team - Quick Summary

## 🎯 The Simple Way (3 Commands)

### 1️⃣ Set Your GitHub Token (One Time Only)

```powershell
# Get token from: https://github.com/settings/tokens
# Select: repo + write:packages

[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'your_token_here', 'User')
```

**Restart PowerShell after setting token!**

### 2️⃣ Publish First Release

```powershell
.\publish-first-release.ps1
```

This script will:
- ✅ Check everything is ready
- ✅ Create git tag (v1.0.0)
- ✅ Build the app
- ✅ Upload to GitHub Releases
- ✅ Give you a link to share

### 3️⃣ Share with Team

Send them this link:
```
https://github.com/vlad9976/IT-app/releases/latest
```

**That's it!** Your team downloads the `.exe` and installs it.

---

## 📋 What Your Team Does

1. Click the link you sent
2. Download `IT-Script-Generator-Setup-1.0.0.exe`
3. Run the installer
4. Done! App auto-updates forever.

---

## 🔄 Publishing Updates Later

When you add features or fix bugs:

```powershell
# 1. Update version in package.json
# Change "version": "1.0.0" to "1.0.1"

# 2. Commit changes
git add .
git commit -m "Fix: bug description"

# 3. Tag and publish
git tag v1.0.1
git push origin main
git push origin v1.0.1
npm run publish
```

**Your team gets the update automatically!** No need to tell them.

---

## 📁 Files Created for You

| File | Purpose |
|------|---------|
| `TEAM_DISTRIBUTION_GUIDE.md` | Complete guide with all details |
| `INSTALL_INSTRUCTIONS.md` | Simple guide for your team |
| `publish-first-release.ps1` | Automated publishing script |
| `SHARING_SUMMARY.md` | This quick reference |

---

## 🆘 Troubleshooting

### "GH_TOKEN not set"
```powershell
# Set it permanently
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'your_token_here', 'User')

# Restart PowerShell
```

### "Permission denied"
- Check token has `repo` scope
- Verify you're the repo owner
- Try regenerating token

### Build fails
```powershell
# Clean everything
Remove-Item -Recurse -Force dist, dist-electron
npm install
npm run publish
```

---

## 🔗 Important Links

- **Your Repo:** https://github.com/vlad9976/IT-app
- **Create Token:** https://github.com/settings/tokens
- **Releases:** https://github.com/vlad9976/IT-app/releases

---

## ✅ Quick Checklist

Before sharing with team:

- [ ] Set `GH_TOKEN` environment variable
- [ ] Restart PowerShell
- [ ] Run `.\publish-first-release.ps1`
- [ ] Verify release appears on GitHub
- [ ] Download and test the `.exe` yourself
- [ ] Share link with team
- [ ] Celebrate! 🎉

---

**Need more details?** Read `TEAM_DISTRIBUTION_GUIDE.md`

**Questions?** Check `AUTO_UPDATE_GUIDE.md`
