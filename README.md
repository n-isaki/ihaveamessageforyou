# React + Vite

## Deploy (GitHub Actions)

Staging (Branch `dev`) und Production (Branch `main`) werden per GitHub Actions gebaut und nach Firebase Hosting deployed. Dafür wird ein **Service-Account-Key** als Secret gesetzt:

1. Firebase Console → Projekteinstellungen → **Dienstkonten** → „Neuen privaten Schlüssel generieren“ → JSON herunterladen.
2. In GitHub: **Repo → Settings → Secrets and variables → Actions → New repository secret** → Name: `FIREBASE_SERVICE_ACCOUNT`, Value: **kompletter Inhalt** der JSON-Datei (einzeilig oder mit Zeilenumbrüchen, egal).

Danach bei Push auf `dev` bzw. `main` Deploy auslösen (Firebase CLI nutzt `GOOGLE_APPLICATION_CREDENTIALS`).

**Firebase-Config:** Kommt aus Umgebungsvariablen (`VITE_FIREBASE_*`). Lokal: `.env` oder `.env.local` (siehe `.env.example`). In CI werden die Werte aus GitHub Actions Secrets gelesen – dort `VITE_FIREBASE_API_KEY` usw. mit den echten Werten aus der Firebase Console setzen (keine Dummy-Keys).  
**API-Key absichern:** In der [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=gift-shop-app-7bbd3) den Web-API-Key einschränken: „Anwendungseinschränkungen“ → „HTTP-Verweise“ (nur eure Domains, z. B. `*.web.app`, `*.firebaseapp.com`, Custom Domain) und „API-Einschränkungen“ auf die benötigten Firebase-APIs setzen. Dann ist der Key auch bei Nutzung im Frontend besser geschützt.

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
