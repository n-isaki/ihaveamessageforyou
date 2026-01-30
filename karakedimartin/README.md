# Karakedimartin - Gedankenwerkstatt

Persönliche Notiz-App mit öffentlichen und privaten Inhalten.

## 🚀 Setup

1. **Umgebungsvariablen erstellen:**
   ```bash
   cp .env.local.example .env.local
   ```
   Fülle die Firebase-Werte aus (gleiche wie im Hauptprojekt).

2. **Dependencies installieren:**
   ```bash
   npm install
   ```

3. **Development Server starten:**
   ```bash
   npm run dev
   ```

4. **Öffne:** http://localhost:3000

## 📁 Struktur

- `app/` - Next.js App Router
  - `dashboard/` - Private Dashboard
  - `public/` - Public Inhalte
  - `login/` - Login Seite
- `lib/` - Utilities & Firebase Config
- `types/` - TypeScript Types
- `components/` - React Components

## 🔐 Firebase Setup

Nutzt das gleiche Firebase Projekt wie Kamlimos, aber separate Collections:
- `notes` - Notizen
- `links` - Links
- `collections` - Ordner/Sammlungen
