# Etsy Open API – Setup für Bestell-Sync / Steuerbereich

## Sicherheit

- **Keystring** und **Shared Secret** niemals ins Git committen.
- Wenn Zugangsdaten je in Chats, Screenshots oder Tickets gelandet sind: In der [Etsy Developer Console](https://www.etsy.com/developers/your-apps) **neue Credentials erzeugen** oder die App rotieren und alte Werte ungültig machen.
- Produktion: Secrets nur über **Google Cloud Secret Manager** / `firebase functions:secrets:set` (siehe unten).

## Was du bereits hast

| Feld | Verwendung |
|------|------------|
| Keystring | OAuth `client_id` |
| Shared Secret | ggf. für serverseitige Token-Aufrufe (je nach Flow; Etsy v3 nutzt stark PKCE + `client_id`) |

## Was noch fehlt (bevor der Code fertig angebunden werden kann)

### 1. Redirect URI (exakt)

- Bei der App unter **Your Apps** eine **HTTPS**-Callback-URL eintragen.
- Muss **bytegenau** mit dem übereinstimmen, was die Cloud Function (oder Route) später verwendet – inkl. Pfad, kein extra `/` am Ende, korrekte Groß-/Kleinschreibung.
- Beispiel-Muster (noch nicht final, bis die Function deployed ist):  
  `https://europe-west1-gift-shop-app-7bbd3.cloudfunctions.net/etsyOAuthCallback`

### 2. Scopes

Für Bestellungen lesen mindestens:

- `shops_r`
- `transactions_r`

(Beim ersten OAuth-Login werden diese Rechte angefragt.)

### 3. Einmaliger OAuth-Login (Refresh Token)

- Du meldest dich als **Shop-Inhaber** an und erlaubst die App.
- Ergebnis: **Access Token** (kurzlebig) + **Refresh Token** (länger gültig).
- Der **Refresh Token** muss **einmalig** sicher gespeichert werden (Secret Manager / Firestore nur verschlüsselt / Admin-only) und von der Function zum Erneuern der Access Tokens genutzt werden.

### 4. Shop-ID

- Nach erfolgreichem OAuth per API abfragen (z. B. Shop des authentifizierten Nutzers) und einmalig speichern – oder bei jedem Sync aus dem Token-Kontext ableiten, je nach gewähltem API-Endpunkt.

### 5. Firebase Secrets (für Functions)

Lokal nicht im Repo; nach Anlage der Function z. B.:

```bash
firebase functions:secrets:set ETSY_CLIENT_ID
firebase functions:secrets:set ETSY_CLIENT_SECRET
firebase functions:secrets:set ETSY_REFRESH_TOKEN   # nach erstem OAuth
```

(Werte jeweils interaktiv einfügen.)

## Nächster Entwicklungsschritt

Implementierung: OAuth-Callback-Function + geplanter Job zum Abruf der Receipts + Mapping in `gift_orders` / Steuer-relevante Felder – siehe Issue oder Agent-Auftrag.
