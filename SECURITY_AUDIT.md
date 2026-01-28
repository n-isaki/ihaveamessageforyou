# 🔒 Security Audit Report

**Datum:** 2026-01-28  
**Status:** ⚠️ KRITISCHE SCHWACHSTELLEN GEFUNDEN

---

## 🚨 KRITISCHE SCHWACHSTELLEN (Sofort beheben!)

### 1. Firestore Rules: Öffentlicher Lesezugriff auf ALLE Daten

**Problem:**
```javascript
allow read: if true;  // ❌ JEDER kann ALLE Aufträge lesen!
```

**Angriff:**
- Angreifer kann alle `gift_orders` auslesen
- Erhält: `customerEmail`, `customerName`, `securityToken`, `personalizationText`
- Kann alle Geschenke sehen und manipulieren

**Fix:**
```javascript
// Nur Admin oder mit korrektem Token
allow read: if request.auth != null 
            || (request.query.limit == 1 && 
                resource.data.securityToken == request.query.token);
```

---

### 2. Firestore Rules: Jeder kann Aufträge erstellen

**Problem:**
```javascript
allow create: if true;  // ❌ JEDER kann Aufträge erstellen!
```

**Angriff:**
- Spam-Angriffe: Tausende Fake-Aufträge
- DoS: Datenbank wird überflutet
- Kosten: Firebase-Kosten explodieren

**Fix:**
```javascript
// Nur Admin oder mit Validierung
allow create: if request.auth != null 
              || (request.resource.data.platform == 'shopify' 
                  && request.resource.data.shopifyOrderId != null);
```

---

### 3. Firestore Update Rules: Kann umgangen werden

**Problem:**
```javascript
allow update: if request.auth != null 
            || resource.data.get('locked', false) == false
            || (resource.data.get('locked', false) == true && ...);
```

**Angriff:**
- Wenn `locked` nicht gesetzt ist, kann jeder updaten
- Keine Token-Validierung für Updates
- Kann `securityToken` überschreiben

**Fix:**
```javascript
allow update: if request.auth != null  // Admin
            || (resource.data.get('locked', false) == false 
                && request.resource.data.securityToken == resource.data.securityToken  // Token muss gleich bleiben
                && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['messages', 'headline', 'subheadline', 'locked', 'setupCompletedAt', 'setupStarted', 'setupStartedAt']))  // Nur erlaubte Felder
            || (resource.data.get('locked', false) == true 
                && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewed', 'viewedAt']));
```

---

### 4. Storage Rules: Alle Dateien öffentlich lesbar

**Problem:**
```javascript
allow read: if true;  // ❌ Alle Dateien öffentlich!
```

**Angriff:**
- Angreifer kann alle hochgeladenen Dateien sehen
- Audio, Bilder, Videos sind öffentlich zugänglich
- Keine Zugriffskontrolle

**Fix:**
```javascript
// Nur Dateien mit korrektem Token oder Admin
match /{allPaths=**} {
  allow read: if request.auth != null 
              || resource.metadata.token != null;  // Token in Metadata
  allow write: if request.auth != null;
}
```

---

### 5. Shopify Webhook: Keine HMAC-Verification

**Problem:**
```javascript
exports.shopifyOrderCreate = onRequest({ cors: true }, async (req, res) => {
  const order = req.body;  // ❌ Keine Verifikation!
```

**Angriff:**
- Jeder kann Fake-Webhooks senden
- Kann beliebige Aufträge erstellen/ändern
- Kann `status: 'paid'` setzen ohne echte Bestellung

**Fix:**
```javascript
const crypto = require('crypto');

exports.shopifyOrderCreate = onRequest({ cors: true }, async (req, res) => {
  // HMAC Verification
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('base64');
  
  if (hash !== hmac) {
    res.status(401).send('Unauthorized');
    return;
  }
  
  // ... rest of code
});
```

---

### 6. Token-Validierung: Nur Client-seitig

**Problem:**
```javascript
// CustomerSetup.jsx
if (data.securityToken && data.securityToken !== token) {
  setAccessDenied(true);  // ❌ Nur UI, nicht serverseitig!
}
```

**Angriff:**
- Client-seitige Validierung kann umgangen werden
- Direkte API-Calls ignorieren die Validierung
- Firestore Rules prüfen Token nicht

**Fix:**
- Token-Validierung in Firestore Rules (siehe Fix #3)
- Backend-Validierung in Cloud Functions

---

### 7. Keine Rate Limiting

**Problem:**
- Kein Rate Limiting für Setup-Links
- Kein Rate Limiting für PIN-Eingabe
- Kein Rate Limiting für Token-Guessing

**Angriff:**
- Brute-Force auf Tokens (UUIDs sind zwar schwer, aber möglich)
- Brute-Force auf PINs (4-6 Zeichen)
- DoS durch viele Requests

**Fix:**
```javascript
// In Cloud Functions oder Firestore Rules
// Rate Limiting implementieren
// z.B. max 5 Versuche pro IP/Stunde
```

---

### 8. PIN-Code im Klartext

**Problem:**
```javascript
accessCode: '1234AB'  // ❌ Im Klartext gespeichert!
```

**Angriff:**
- Wenn Datenbank kompromittiert, sind alle PINs sichtbar
- Kann für andere Geschenke verwendet werden

**Fix:**
```javascript
// Hash PIN mit bcrypt
const bcrypt = require('bcrypt');
const pinHash = await bcrypt.hash(accessCode, 10);
// Speichere pinHash statt accessCode
```

---

### 9. Keine Input-Sanitization

**Problem:**
- User-Input wird direkt gespeichert
- Keine XSS-Schutz
- Keine Längenlimits

**Angriff:**
- XSS-Angriffe in Nachrichten
- SQL-Injection (nicht relevant bei Firestore)
- Extrem lange Strings können System überlasten

**Fix:**
```javascript
// Input-Sanitization Funktion
function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Remove scripts
    .trim();
}
```

---

### 10. Storage: Keine Dateityp-Validierung

**Problem:**
- Jeder kann beliebige Dateien hochladen
- Keine Größenlimits
- Keine Typ-Validierung

**Angriff:**
- Malware-Upload
- Extrem große Dateien (DoS)
- Falsche Dateitypen

**Fix:**
```javascript
// In Storage Rules oder Upload-Funktion
allow write: if request.auth != null
              && request.resource.size < 10 * 1024 * 1024  // Max 10MB
              && request.resource.contentType.matches('(audio|image|video)/.*');
```

---

## ⚠️ MITTLERE SCHWACHSTELLEN

### 11. Keine CSRF-Schutz
- Formulare können von anderen Domains ausgelöst werden
- **Fix:** CSRF-Tokens implementieren

### 12. Sensible Daten in Logs
- `console.log` enthält sensible Daten
- **Fix:** Logs sanitizen, keine Tokens/PINs loggen

### 13. Keine Content Security Policy (CSP)
- XSS-Schutz fehlt
- **Fix:** CSP Headers setzen

---

## ✅ WAS GUT IST

1. ✅ Token-Generierung mit `crypto.randomUUID()` (sicher)
2. ✅ Admin-Auth mit Firebase Auth
3. ✅ Lock-Mechanismus verhindert Änderungen nach Versiegelung
4. ✅ Separate Collections für verschiedene Daten

---

## 📋 PRIORITÄTEN

### Sofort (P0):
1. Firestore Rules: Read/Write einschränken
2. Storage Rules: Zugriff einschränken
3. Shopify Webhook: HMAC-Verification

### Bald (P1):
4. Token-Validierung serverseitig
5. Rate Limiting
6. Input-Sanitization

### Später (P2):
7. PIN-Hashing
8. CSP Headers
9. CSRF-Schutz

---

## 🔧 NÄCHSTE SCHRITTE

1. Firestore Rules überarbeiten
2. Storage Rules überarbeiten
3. Cloud Functions absichern
4. Input-Validierung implementieren
5. Rate Limiting hinzufügen
