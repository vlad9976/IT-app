# Quick Reference Card

Essential commands for building and publishing the IT Script Generator.

---

## 🚀 Common Commands

### Development

```bash
npm run dev              # Start dev server with hot reload
```

### Building

```bash
npm run build:win        # Build .exe (local, no publish)
npm run publish          # Build + publish to GitHub
```

### Version Bumping

```bash
npm version patch        # 1.0.0 → 1.0.1 (bug fixes)
npm version minor        # 1.0.0 → 1.1.0 (new features)
npm version major        # 1.0.0 → 2.0.0 (breaking changes)
```

---

## 📤 Publishing Workflow

```powershell
# 1. Make changes
# ... edit code ...

# 2. Bump version
npm version patch

# 3. Push
git push origin main
git push --tags

# 4. Publish
npm run publish
```

---

## 🔧 Setup Commands

### First Time Setup

```powershell
# Run interactive setup
.\setup-github-updates.ps1
```

### Manual Token Setup

```powershell
# Set GH_TOKEN (permanent)
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_YOUR_TOKEN', 'User')

# Verify
echo $env:GH_TOKEN
```

---

## 🐛 Troubleshooting

### Check Token

```powershell
echo $env:GH_TOKEN
# Should output: ghp_...
```

### View Logs

```powershell
notepad "$env:APPDATA\IT Script Generator\logs\main.log"
```

### Clean Build

```powershell
Remove-Item dist-electron -Recurse -Force
Remove-Item dist -Recurse -Force
npm run publish
```

### Reinstall Dependencies

```bash
Remove-Item node_modules -Recurse -Force
npm install
```

---

## 📋 Pre-Publish Checklist

- [ ] Code tested locally
- [ ] Version bumped
- [ ] Changes committed
- [ ] Git tag created
- [ ] Tag pushed to GitHub
- [ ] `GH_TOKEN` is set
- [ ] Ready to run `npm run publish`

---

## 🔗 Important Links

- **GitHub Releases:** `https://github.com/YOUR_USERNAME/YOUR_REPO/releases`
- **Create Token:** `https://github.com/settings/tokens`
- **Logs Location:** `%APPDATA%\IT Script Generator\logs\`

---

## 📞 Quick Help

| Problem | Solution |
|---------|----------|
| Token not set | `$env:GH_TOKEN = "ghp_..."` |
| Update not working | Check `latest.yml` exists in release |
| Build fails | `npm install` then retry |
| Can't publish | Verify tag exists: `git tag` |

---

## 🎯 Version Strategy

| Change Type | Command | Example |
|-------------|---------|---------|
| Bug fix | `npm version patch` | 1.0.0 → 1.0.1 |
| New feature | `npm version minor` | 1.0.1 → 1.1.0 |
| Breaking change | `npm version major` | 1.1.0 → 2.0.0 |

---

## ⚡ Power User Tips

### Publish in One Command

```powershell
npm version patch && git push && git push --tags && npm run publish
```

### Check Current Version

```powershell
node -p "require('./package.json').version"
```

### List All Tags

```powershell
git tag -l
```

### Delete Tag (if mistake)

```powershell
git tag -d v1.0.0              # Delete locally
git push origin :refs/tags/v1.0.0  # Delete on GitHub
```

---

## 📚 Documentation Files

- `README.md` - This file (overview)
- `AUTO_UPDATE_GUIDE.md` - Complete auto-update setup
- `BUILD_AND_PUBLISH.md` - Detailed build instructions
- `UPDATE_FLOW.md` - Visual flow diagrams
- `QUICK_REFERENCE.md` - This quick reference

---

**Need more details?** → Read `AUTO_UPDATE_GUIDE.md`

**Ready to publish?** → Run `.\setup-github-updates.ps1`
