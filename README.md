# 💎 Diamond Drop

**Diamond Drop** is a powerful Chrome Extension that brings a "Dynamic Island" experience to your browser. Drag and drop selected text to instantly perform actions across your favorite apps—saving you clicks and automating your workflow.

---

## ✨ Features

### 🚀 Drag & Drop Text Actions
Select any text on a webpage and drag it. The **Diamond Drop Island** slides down, offering intelligent shortcuts:

| App | Action |
|-----|--------|
| 🔍 **Search** | Instantly Google search the selected text |
| 🤖 **ChatGPT** | Opens a new chat with your text |
| ✨ **Gemini** | Opens Gemini and *auto-fills* your prompt |
| 📄 **Drive** | Creates a **New Blank Doc** + copies text to clipboard |
| 📝 **Notion** | Opens a **New Page** and auto-types your text |
| 📒 **Keep** | Opens Keep, expands note input, ready to paste |
| ✈️ **Telegram** | Opens Telegram Web with share dialog |
| 💬 **WhatsApp** | Opens WhatsApp Web with pre-filled text |
| 📧 **Gmail** | Composes a new email with text as body |
| 🌍 **Translate** | Opens Google Translate with your text |

### 🎨 Customizable Settings
Click the extension icon to open the settings panel:
*   **Themes**: Light, Dark, or System
*   **Island Size**: Small, Medium, or Large
*   **Icon Shapes**: Circle, Rounded, or Square
*   **Labels**: Show or hide app names

---

## 🛠️ Technology

*   **Pure HTML/CSS/JS** - No build tools, no dependencies
*   **Manifest V3** - Modern Chrome Extension architecture
*   **Chrome Storage API** - Settings sync across devices

---

## 📦 Installation

**Zero dependencies. Zero build steps. Just load and go!**

1.  **Download** or clone this repository
2.  Open Chrome → `chrome://extensions`
3.  Enable **Developer Mode** (top right)
4.  Click **Load unpacked**
5.  Select the project folder (containing `manifest.json`)

🎉 **Done!** The extension is now active.

---

## 🖥️ Usage

1.  **Select** any text on any webpage
2.  **Drag** it — the Diamond Drop Island appears at the top
3.  **Drop** onto an app icon
4.  ✨ Magic happens!

---

## 📁 Project Structure

```
diamond-drop/
├── assets/
│   ├── icons/          # App icons (SVG)
│   └── logo.png        # Extension icon
├── background/
│   └── service-worker.js
├── content/
│   ├── island.js       # Main drag-drop logic
│   └── island.css      # Island styling
├── settings/
│   ├── index.html      # Settings page
│   ├── style.css       # Settings styling
│   └── settings.js     # Settings logic
├── manifest.json
└── README.md
```

---

## 🤝 Contributing

1.  Fork the repository
2.  Create a feature branch (`git checkout -b feature/amazing`)
3.  Commit changes (`git commit -m 'Add amazing feature'`)
4.  Push to branch (`git push origin feature/amazing`)
5.  Open a Pull Request

---

## 📄 License

MIT License - Feel free to use and modify!

---

*Built with ❤️ for productivity*
