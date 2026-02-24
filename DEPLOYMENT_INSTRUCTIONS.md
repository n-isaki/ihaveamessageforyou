# 🚀 Deployment Setup Anleitung

## 🔧 **Was wurde korrigiert:**

### 1. ✅ **Firebase-Projekt-ID korrigiert**
- Staging: `gift-shop-app-7bbd3` (statt `gift-shop-app-staging`)
- Production: `gift-shop-app-7bbd3` (statt `gift-shop-app`)

### 2. ✅ **Doppeltes Deployment entfernt**
- Firebase Action entfernt (verursachte doppeltes Hosting-Deploy)
- Logik bereinigt: Build → Deploy in einem Schritt

### 3. ✅ **Firebase-Authentifizierung hinzugefügt**
- Service-Account JSON wird in Datei geschrieben
- `GOOGLE_APPLICATION_CREDENTIALS` Environment-Variable gesetzt
- Firebase CLI kann sich im CI authentifizieren

---

## ⚠️ **Noch zu tun (manuell):**

### **GitHub Secret anlegen:**
1. GitHub Repository → Settings → Secrets and variables → Actions
2. "New repository secret" erstellen:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** JSON-Datei von Firebase Console

**Firebase Service Account bekommen:**
1. Firebase Console → Project Settings → Service Accounts
2. "Generate new private key"
3. JSON-Datei kopieren und als Secret einfügen

---

## 🎯 **Deployment funktioniert danach:**

### **Automatisch:**
- **Push auf `dev`** → Tests → Build → Deploy zu **Staging**
- **Push auf `main`** → Tests → Build → Deploy zu **Production**

### **Manuell:**
```bash
# Staging
./scripts/deploy-staging.sh

# Production  
./scripts/deploy-production.sh
```

---

## 📋 **Checkliste vor erstem Deployment:**

- [ ] GitHub Secret `FIREBASE_SERVICE_ACCOUNT` angelegt
- [ ] Firebase CLI im Workflow verfügbar (`npm install -g firebase-tools`)
- [ ] `.firebaserc` zeigt auf korrektes Projekt
- [ ] `build:all` funktioniert lokal
- [ ] Service Account hat Deployment-Rechte

**Danach ist das vollautomatische Trunk-based Deployment ready!** 🚀
