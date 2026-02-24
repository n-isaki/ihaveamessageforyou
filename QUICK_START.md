# 🚀 Quick Start für neue Entwickler

## ⚡ 5 Minuten zum loslegen

### **1. Repository klonen**
```bash
git clone https://github.com/n-isaki/ihaveamessageforyou.git
cd ihaveamessageforyou
```

### **2. Dependencies installieren**
```bash
npm install
```

### **3. Entwicklung starten**
```bash
npm run dev
```
🎉 **App läuft:** http://localhost:5173

---

## 🔧 Wichtige Befehle

### **Entwicklung:**
```bash
npm run dev          # Development Server
npm run build        # Production Build
npm run lint         # Code-Qualität prüfen
npm run test:ci      # CI-kompatible Tests
```

### **Deployment:**
```bash
git push origin dev     # Zu Staging deployen
git push origin main    # Zu Production deployen
```

---

## 🌳 Branch-Strategie (Einfach)

```
dev     ← Hier arbeiten (automatisch zu Staging)
main    ← Live (automatisch zu Production)
```

### **Dein Workflow:**
1. **Auf `dev` entwickeln**
2. **Committen und pushen**
3. **Staging prüfen:** https://gift-shop-app-7bbd3.web.app
4. **Wenn fertig:** Auf `main` mergen

---

## 📁 Wichtige Dateien

| Datei | Zweck |
|--------|--------|
| `src/` | Dein Code |
| `vite.config.js` | Build-Konfiguration |
| `.github/workflows/trunk-based.yml` | CI/CD Pipeline |
| `firebase.json` | Firebase Hosting Setup |

---

## 🐛 Schnelle Hilfe

### **Build fehlschlagen?**
```bash
npm run lint && npm run test:ci && npm run build:all
```

### **Tests fehlschlagen?**
```bash
npm run test:ci
```

### **Deployment fehlschlagen?**
1. GitHub Actions prüfen: https://github.com/n-isaki/ihaveamessageforyou/actions
2. Lokal testen

---

## 📚 Mehr Infos

- **Komplette Anleitung:** `TRUNK_BASED_DEVELOPMENT_GUIDE.md`
- **Feature Flags:** `src/utils/featureFlags.js`
- **Firebase:** `firebase.json` und `.firebaserc`

---

**🎯 Du bist bereit! Viel Spaß beim Entwickeln!**
