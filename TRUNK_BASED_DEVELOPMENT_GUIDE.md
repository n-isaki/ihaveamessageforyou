# 🚀 Trunk-Based Development - Complete Setup Guide

## 📋 Übersicht

Dieses Dokument erklärt das komplette Trunk-Based Development Setup für das IHMFY Projekt.

## 🌳 Branch-Strategie

```
main     ← Production (Live-Website)
  ↑
dev       ← Staging (Test-Environment)
  ↑
feature/* ← Feature-Branches (optional)
```

### **Workflow:**
- **`dev`** = Haupt-Entwicklungsbranch (Trunk)
- **`main`** = Production-Branch
- **Push auf `dev`** → Deploy zu Staging
- **Push auf `main`** → Deploy zu Production

---

## 🔧 CI/CD Pipeline

### **Automatisierte Schritte bei jedem Push:**

#### **1. Test-Job** (immer)
```bash
- Code checkout
- Node.js Setup (v20)
- Dependencies installieren (npm ci)
- Linting (npm run lint)
- Tests (npm run test:ci)
- Build (npm run build:all)
```

#### **2. Deploy-Staging** (nur bei `dev` Push)
```bash
- Firebase CLI installieren
- Firebase Authentication (FIREBASE_TOKEN)
- Deploy zu Firebase Staging
```

#### **3. Deploy-Production** (nur bei `main` Push)
```bash
- Gleiche Schritte wie Staging
- Deploy zu Firebase Production
```

---

## 🛠️ Wichtige Konfigurationsdateien

### **1. GitHub Actions Workflow**
**Datei:** `.github/workflows/trunk-based.yml`
- **Trigger:** `main` + `dev` Branches
- **Jobs:** `test`, `deploy-staging`, `deploy-production`

### **2. Firebase Konfiguration**
**Datei:** `firebase.json`
```json
{
  "hosting": [
    {
      "target": "production",
      "public": "dist"
    },
    {
      "target": "staging", 
      "public": "dist"
    }
  ]
}
```

**Datei:** `.firebaserc`
```json
{
  "projects": {
    "default": "gift-shop-app-7bbd3"
  }
}
```

### **3. Build Optimierung**
**Datei:** `vite.config.js`
- **Manual Chunks:** Vendor-Bibliotheken getrennt
- **Feature Chunks:** Nach Funktionalität gruppiert
- **Performance:** Besseres Caching und Ladezeiten

---

## 🔑 GitHub Secrets

### **Erforderliche Secrets:**
```
Name: FIREBASE_TOKEN
Wert: Firebase CI Token (firebase login:ci)
```

### **Token erstellen:**
```bash
firebase login:ci
# Token kopieren und in GitHub Secret einfügen
```

---

## 🧪 Test-Setup

### **CI-kompatible Tests:**
- **Datei:** `jest.config.ci.js`
- **Test-Dateien:** `src/**/*.ci.test.js`
- **Environment:** Node.js + JSDOM
- **Feature Flags:** Sicher für CI/CD

### **Linting:**
- **Konfiguration:** `.eslintrc.js`
- **Ignoriert:** Test-Dateien, Config-Dateien
- **Fokus:** Nur `src` Verzeichnis

---

## 📦 Performance-Optimierung

### **Bundle-Strategie:**
```
vendor-react.js      → React Core
vendor-firebase.js   → Firebase Module
vendor-ui.js         → UI Bibliotheken
admin-core.js        → Admin Funktionen
experience-viewer.js → Viewer Komponenten
wizard-core.js       → Wizard Flow
services.js          → API Services
```

### **Vorteile:**
- ✅ **Besseres Caching:** Vendor-Chunks ändern selten
- ✅ **Schnellere Ladezeiten:** Parallele Downloads
- ✅ **Keine Warnungen:** Optimiertes Code-Splitting

---

## 🚀 Deployment URLs

### **Staging (dev Branch):**
```
https://gift-shop-app-7bbd3.web.app
```

### **Production (main Branch):**
```
https://gift-shop-app-7bbd3.firebaseapp.com
```

---

## 🔄 Täglicher Workflow

### **Für Entwickler:**

#### **Neue Features entwickeln:**
```bash
# 1. Auf dev bleiben oder Feature-Branch erstellen
git checkout dev
# oder
git checkout -b feature/neue-funktion

# 2. Code entwickeln
# ...

# 3. Auf dev pushen (automatisch zu Staging)
git add .
git commit -m "Feature: Beschreibung"
git push origin dev
```

#### **Nach Staging-Test:**
```bash
# 1. Auf main mergen
git checkout main
git merge dev

# 2. Nach Production pushen
git push origin main
```

---

## 🐛 Fehlerbehebung

### **Häufige Probleme:**

#### **1. Firebase Authentication Failed**
```bash
# Lösung: FIREBASE_TOKEN Secret prüfen
# Token neu erstellen: firebase login:ci
```

#### **2. Build Fehler**
```bash
# Lösung: Lokal testen
npm run build:all
```

#### **3. Test Fehler**
```bash
# Lösung: CI-kompatible Tests prüfen
npm run test:ci
```

---

## 📊 Monitoring

### **GitHub Actions:**
```
https://github.com/n-isaki/ihaveamessageforyou/actions
```

### **Firebase Console:**
```
https://console.firebase.google.com/project/gift-shop-app-7bbd3
```

---

## 🎯 Best Practices

### **Do's:**
- ✅ **Immer auf dev entwickeln**
- ✅ **Kleine, häufige Commits**
- ✅ **CI/CD Status prüfen**
- ✅ **Staging vor Production testen**

### **Don'ts:**
- ❌ **Direkt auf main pushen**
- ❌ **Ohne Tests committen**
- ❌ **Secrets im Code speichern**
- ❌ **Große Commits ohne Tests**

---

## 🆘 Hilfe & Support

### **Bei Problemen:**
1. **GitHub Actions Log prüfen**
2. **Lokal testen** (`npm run lint && npm run test:ci && npm run build:all`)
3. **Firebase Status prüfen**
4. **Team kontaktieren**

---

## 📝 Änderungen-Log

### **Initial Setup (24.02.2026):**
- ✅ Trunk-Based Development implementiert
- ✅ CI/CD Pipeline eingerichtet
- ✅ Firebase Authentication konfiguriert
- ✅ Performance-Optimierung完成
- ✅ Test-Setup stabilisiert
- ✅ Linting konfiguriert

---

**🎉 Das Trunk-Based Development ist voll funktionsfähig und bereit für neue Entwickler!**
