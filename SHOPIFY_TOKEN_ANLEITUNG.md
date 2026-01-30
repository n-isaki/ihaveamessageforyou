# Shopify Theme Development - Admin API Token einrichten

## Problem
Du loggst dich mit Gmail ein, hast also kein Store-Passwort. Shopify CLI fragt aber trotzdem nach einem Passwort.

## Lösung: Admin API Token erstellen

### Schritt 1: Custom App erstellen

1. **Gehe zu:** https://admin.shopify.com/store/luluzin-2/settings/apps
2. **Scrolle nach unten** zu "Develop apps"
3. **Klicke auf:** "Create an app"
4. **Name:** z.B. "Theme Development CLI"
5. **Klicke auf:** "Create app"

### Schritt 2: Berechtigungen setzen

1. **Klicke auf:** "Configuration" (links)
2. **Gehe zu:** "Admin API integration scopes"
3. **Aktiviere:**
   - ✅ `read_themes`
   - ✅ `write_themes`
4. **Klicke auf:** "Save"

### Schritt 3: App installieren und Token kopieren

1. **Klicke auf:** "API credentials" (links)
2. **Klicke auf:** "Install app" (oben rechts)
3. **Bestätige** die Installation
4. **WICHTIG:** Kopiere den **"Admin API access token"** (beginnt mit `shpat_...`)
   - **NICHT** den Storefront Token (`shpss_...`)
   - **NUR** der Admin API Token funktioniert!

### Schritt 4: Token speichern

```bash
cd shopify-theme
echo "SHOPIFY_CLI_PASSWORD=shpat_dein_admin_token_hier" > .env
```

**Wichtig:** Der Token muss mit `shpat_` beginnen, nicht `shpss_`!

### Schritt 5: Development Server starten

```bash
npm run shopify:dev
```

Jetzt sollte es ohne Passwort-Abfrage funktionieren! 🎉
