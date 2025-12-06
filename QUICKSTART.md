# 🎁 Projekt Dokumentation & Quickstart

## 🌟 Features
*   **Admin Dashboard:** Geschenke erstellen, bearbeiten, löschen, Status einsehen.
*   **QR-Code Generator:** Erstellt automatisch QR-Codes für jedes Geschenk.
*   **Geschenk-Ansicht:** Animierte Enthüllung mit PIN-Schutz für den Empfänger.
*   **E-Mail Benachrichtigung:** Automatische Info an den Käufer, wenn das Geschenk geöffnet wird.
*   **Bestellnummer-Tracking:** Zuordnung von Geschenken zu Shop-Bestellungen.

## 🚀 Lokal Starten (Entwicklung)
1.  **Repository klonen:**
    ```bash
    git clone https://github.com/n-isaki/ihaveamessageforyou.git
    cd ihaveamessageforyou
    ```
2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```
3.  **Umgebungsvariablen (.env) erstellen:**
    Erstelle eine `.env` Datei im Hauptverzeichnis mit deinen Keys (siehe unten).
4.  **Server starten:**
    ```bash
    npm run dev
    ```
    Öffne `http://localhost:5173` im Browser.

## 🌍 Deployen (Live schalten)
Wir nutzen Firebase Hosting.

1.  **Einmaliges Setup (falls noch nicht passiert):**
    ```bash
    npm install -g firebase-tools
    firebase login
    firebase init hosting
    ```
2.  **Änderungen hochladen:**
    ```bash
    npm run build       # Baut die optimierte Version
    firebase deploy     # Lädt den 'dist' Ordner zu Firebase hoch
    ```
    Deine App ist dann unter `https://gift-shop-app-7bbd3.web.app` erreichbar.

## 🔑 Wichtige Zugangsdaten (.env)
Diese Datei darf **nicht** auf GitHub landen!
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
```

## 🛠️ Admin Zugang
*   **URL:** `/admin/login`
*   **User verwalten:** In der [Firebase Console](https://console.firebase.google.com/) unter "Authentication".
