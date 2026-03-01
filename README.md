# IT Administrator Script Generator

A modern Windows desktop application built with Electron, React, and Tailwind CSS for generating PowerShell and CMD scripts with dynamic input fields.

## Features

- 🎨 Modern dark IT admin-style UI
- 📁 Organized script categories (User Management, System Maintenance, Network Tools, Security)
- 🔧 Dynamic input fields based on script definitions
- 🔒 Password field support with show/hide toggle
- 📋 One-click copy to clipboard
- ⚡ Real-time script generation with variable replacement
- 🖥️ Native Windows desktop application

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

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
# Build the React app
npm run build

# Build Windows executable
npm run build:win
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
