# IT Administrator Script Generator

A modern Windows desktop application built with Electron, React, and Tailwind CSS for generating PowerShell and CMD scripts with dynamic input fields.

## Features

- 🎨 Modern dark IT admin-style UI
- 📁 Organized script categories (Active Directory, M365, System Maintenance, Network Tools, Security, Hardening)
- 🔧 Dynamic input fields based on script definitions
- 🔒 Password field support with show/hide toggle
- 📋 One-click copy to clipboard + Save to file
- ⚡ Real-time script generation with variable replacement
- 🖥️ Native Windows desktop application
- 🔄 **Automatic updates via GitHub Releases**
- 📚 Built-in documentation for Event IDs, Services, Ports, and M365 Licenses
- 🔍 Search functionality across all scripts

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons
- **electron-updater** - Automatic updates
- **electron-builder** - Application packaging

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run in development mode:
```bash
npm run dev
```

3. Build for Windows:
```bash
npm run build:win
```

The executable will be created in the `dist-electron` folder.

## Project Structure

```
script-generator/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload script
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx       # Category & script navigation
│   │   ├── ScriptPanel.jsx   # Main content area
│   │   ├── InputField.jsx    # Dynamic input component
│   │   └── ScriptPreview.jsx # Script display
│   ├── data/
│   │   └── scripts.json      # Script templates
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Adding New Scripts

Edit `src/data/scripts.json` to add new script templates:

```json
{
  "category_name": [
    {
      "id": "unique-id",
      "name": "Script Name",
      "description": "Script description",
      "type": "powershell",
      "inputs": [
        {
          "variable": "variableName",
          "label": "Display Label",
          "type": "text",
          "placeholder": "Placeholder text",
          "required": true
        }
      ],
      "template": "Your script with {{variableName}} placeholders"
    }
  ]
}
```

## Variable Replacement

Use `{{variableName}}` in your script templates. The app will automatically replace these with user input values.

## Input Field Types

- `text` - Standard text input
- `password` - Password input with show/hide toggle

## Building for Production

```bash
# Build Windows executable (local only)
npm run build:win

# Build and publish to GitHub (with auto-update)
npm run publish
```

**📖 For complete auto-update setup, see:**
- `AUTO_UPDATE_GUIDE.md` - Complete setup instructions
- `BUILD_AND_PUBLISH.md` - Build and release workflow
- `UPDATE_FLOW.md` - Visual diagrams

### Quick Setup for Auto-Updates

```powershell
# 1. Run setup script
.\setup-github-updates.ps1

# 2. Publish first release
npm run publish
```

## Development

```bash
# Start development server
npm run dev
```

This will start:
- Vite dev server on http://localhost:5173
- Electron app with hot reload

## License

MIT
