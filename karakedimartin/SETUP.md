# 🚀 Setup Anleitung

## 1. Firebase Config erstellen

Erstelle `.env.local` im `karakedimartin/` Ordner:

```bash
cd karakedimartin
cp .env.local.example .env.local
```

**Dann die Firebase-Werte eintragen:**

Die Werte findest du im Hauptprojekt `.env` Datei. Kopiere sie und ändere das Prefix:

**Hauptprojekt (.env):**
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
```

**Karakedimartin (.env.local):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=...    # Gleicher Wert wie VITE_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=... # Gleicher Wert wie VITE_FIREBASE_AUTH_DOMAIN
```

**Alle Werte:**
- `NEXT_PUBLIC_FIREBASE_API_KEY` = Wert aus `VITE_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = Wert aus `VITE_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = Wert aus `VITE_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = Wert aus `VITE_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = Wert aus `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID` = Wert aus `VITE_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` = Wert aus `VITE_FIREBASE_MEASUREMENT_ID`

## 2. Development Server starten

```bash
npm run dev
```

Öffne: http://localhost:3000

## 3. Login

Nutze die gleichen Login-Daten wie für Kamlimos Admin Dashboard.

---

## ⚠️ Wichtig:

- `.env.local` ist bereits in `.gitignore` (wird nicht committed)
- Nutze die **gleichen Firebase-Werte** wie im Hauptprojekt
- Nur das Prefix ändert sich: `VITE_` → `NEXT_PUBLIC_`
