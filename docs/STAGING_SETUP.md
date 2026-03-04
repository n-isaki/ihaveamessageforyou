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

---

## Functions manuell deployen

Der CI-Deploy enthält keine Functions (Service Account braucht `iam.serviceaccounts.actAs`). Bei Änderungen an `functions/`:

```bash
cd functions && npm ci && firebase deploy --only functions --project gift-shop-app-7bbd3
```

**IAM-Fix** (falls Functions wieder in CI sollen): Dem Service Account `roles/iam.serviceAccountUser` auf der Compute-Service-Account geben – siehe [Firebase Docs](https://firebase.google.com/docs/functions/deploy#required_iam_permissions).
