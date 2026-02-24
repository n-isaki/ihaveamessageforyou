# React + Vite

## Deploy (GitHub Actions)

Staging (Branch `dev`) und Production (Branch `main`) werden per GitHub Actions gebaut und nach Firebase Hosting deployed. Dafür muss einmalig ein **Firebase CI Token** gesetzt werden:

1. Lokal: `npx firebase login:ci` ausführen, im Browser anmelden.
2. Den ausgegebenen Token in GitHub eintragen: **Repo → Settings → Secrets and variables → Actions → New repository secret** → Name: `FIREBASE_TOKEN`, Value: (Token einfügen).

Danach bei Push auf `dev` bzw. `main` Deploy auslösen. Die App nutzt die hardcodierte Firebase-Config in `src/firebase.js` (kein Dummy-Key in Production).

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
