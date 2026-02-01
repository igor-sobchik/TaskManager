# Vue Task Manager PWA

A mobile-first Task Manager built with **Vue 3** and **Tailwind CSS**.

_<!-- Replace with actual screenshot -->_

## ✨ Features

- **Adaptive Dashboard:** Smart grouping (Overdue, Today, Future), multi-select filters, and mobile-optimized layout (`100dvh`).
- **Smart Tasks:** Support for task types, due times (24h), and markdown descriptions via **CodeMirror**.
- **Intelligent Fields:** Custom fields with auto-detection for links like Zoom, Confluence, or Obsidian.
- **PWA Ready:** Installable as a native-like app with offline capabilities.
    
## 🚀 Quick Start

1. Clone the repo: `git clone https://github.com/yourusername/vue-task-manager.git`
2. Open `index.html` in a browser (or serve via a local server like VS Code Live Server).
    
## ⚙️ Config

Edit the `CONFIG` object in `index.html` to toggle offline mode or set your backend:

```
const CONFIG = {
    useLocalStorage: false, 
    apiBaseUrl: '[https://your-api.com/api](https://your-api.com/api)',
    timezone: 'Asia/Tbilisi',
    // ...
};
```

## 📄 License

MIT License.
