# Deployment Guide

## 🏗️ Environment Setup

- **Production**: `main` branch → `gift-shop-app-7bbd3` (https://gift-shop-app-7bbd3.web.app)
- **Staging**: `dev` branch → `gift-shop-app-staging` (https://gift-shop-app-staging.web.app)

## 📋 Workflow für neue Features

### 1. Feature entwickeln (auf `dev` Branch)

```bash
# Auf dev Branch wechseln
git checkout dev

# Neues Feature entwickeln
# ... code changes ...

# Committen
git add .
git commit -m "Add new feature X"

# Pushen
git push origin dev
```

### 2. Auf Staging testen

```bash
# Automatisch builden und zu Staging deployen
npm run deploy:staging

# Oder manuell:
npm run build:all
firebase deploy --only hosting:staging
```

**Staging URL**: https://gift-shop-app-staging.web.app

### 3. Testen auf Staging

- ✅ Funktionen testen
- ✅ UI/UX prüfen
- ✅ Edge Cases durchgehen
- ✅ Mit Testdaten arbeiten

### 4. Nach Production deployen (wenn alles OK)

```bash
# Auf main Branch wechseln
git checkout main

# dev Branch mergen
git merge dev

# Pushen
git push origin main

# Zu Production deployen
npm run deploy:production

# Oder manuell:
npm run build:all
firebase deploy --only hosting:production
```

**Production URL**: https://gift-shop-app-7bbd3.web.app

## 🚨 Wichtige Regeln

1. **NIE direkt auf `main` entwickeln** - immer erst auf `dev`
2. **Immer erst auf Staging testen** - bevor Production-Deployment
3. **Production-Deployment nur von `main` Branch** - Script prüft das automatisch

## 🔧 Manuelle Deployment-Befehle

### Staging
```bash
firebase deploy --only hosting:staging
```

### Production
```bash
firebase deploy --only hosting:production
```

### Beide (nicht empfohlen)
```bash
firebase deploy --only hosting
```

## 📝 NPM Scripts

- `npm run deploy:staging` - Build + Deploy zu Staging
- `npm run deploy:production` - Build + Deploy zu Production
- `npm run build:all` - Build App + Widget
