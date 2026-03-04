# Staging-Site einrichten

Aktuell zeigen **production** und **staging** beide auf dieselbe Firebase Hosting Site (`gift-shop-app-7bbd3`). Dadurch gibt es keine separate Staging-URL zum Testen.

## Lösung: Staging-Site anlegen

### 1. Staging-Site in Firebase erstellen

```bash
firebase hosting:sites:create gift-shop-app-staging
```

Die Site erhält die URL: **https://gift-shop-app-staging.web.app**

### 2. Target mit der neuen Site verknüpfen

```bash
firebase target:apply hosting staging gift-shop-app-staging
```

Damit wird `.firebaserc` aktualisiert.

### 3. Deploy prüfen

```bash
# Von dev-Branch aus:
git checkout dev
npm run build:all
firebase deploy --only hosting:staging
```

Staging ist dann unter **https://gift-shop-app-staging.web.app** erreichbar.

---

## Nach dem Setup

- **dev** → Deploy auf `hosting:staging` → https://gift-shop-app-staging.web.app
- **main** → Deploy auf `hosting:production` → https://gift-shop-app-7bbd3.web.app
