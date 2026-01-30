# Deployment Guide für karakedimartin.com

## 🚀 Option 1: Vercel (Empfohlen für Next.js)

Vercel ist die einfachste Option für Next.js Apps.

### 1. Vercel Account erstellen

1. Gehe zu [vercel.com](https://vercel.com)
2. Melde dich mit GitHub an
3. Importiere das Repository

### 2. Projekt importieren

1. Klicke auf "Add New Project"
2. Wähle das Repository aus
3. **Wichtig**: Setze "Root Directory" auf `karakedimartin`
4. Klicke auf "Deploy"

### 3. Environment Variables setzen

In Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=dein-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dein-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dein-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dein-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=dein-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=dein-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=dein-measurement-id
```

### 4. Domain verbinden

1. Gehe zu Vercel Dashboard → Settings → Domains
2. Füge `karakedimartin.com` hinzu
3. Folge den DNS-Anweisungen:
   - Erstelle einen CNAME-Record bei deinem Domain-Provider
   - Name: `@` oder `karakedimartin.com`
   - Value: `cname.vercel-dns.com`

### 5. Automatisches Deployment

- Jeder Push zu `main` → automatisches Deployment
- Jeder Push zu anderen Branches → Preview-Deployment

---

## 🔥 Option 2: Firebase Hosting (Alternative)

### 1. Firebase Hosting Setup

```bash
cd karakedimartin
npm install -g firebase-tools
firebase login
firebase init hosting
```

### 2. Build & Deploy

```bash
npm run build
firebase deploy --only hosting
```

### 3. Domain verbinden

1. Firebase Console → Hosting → Add custom domain
2. Füge `karakedimartin.com` hinzu
3. Folge den DNS-Anweisungen

---

## 📝 Lokales Testen vor Deployment

```bash
cd karakedimartin
npm run build
npm start
```

Öffne http://localhost:3000

---

## 🔐 Production Environment Variables

Stelle sicher, dass alle Firebase-Credentials in Production gesetzt sind!

---

## ✅ Checkliste vor Deployment

- [ ] `.env.local` existiert mit allen Firebase-Credentials
- [ ] `npm run build` funktioniert ohne Fehler
- [ ] Lokaler Test (`npm start`) funktioniert
- [ ] Firebase Security Rules sind korrekt
- [ ] Domain DNS ist konfiguriert
