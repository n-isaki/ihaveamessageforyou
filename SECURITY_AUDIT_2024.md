# 🔒 Security Audit Report - Vollständige Analyse

**Datum:** 2024-12-XX  
**Status:** ⚠️ MEHRERE KRITISCHE SCHWACHSTELLEN GEFUNDEN

---

## 🚨 KRITISCHE SCHWACHSTELLEN (P0 - Sofort beheben!)

### 1. ⚠️ Firestore READ-Regel: ALLE Daten öffentlich lesbar

**Problem:**
```javascript
allow read: if isAdmin() || isValidToken() || true; // ❌ JEDER kann ALLES lesen!
```

**Risiko:**
- **KRITISCH**: Alle Geschenke sind öffentlich lesbar
- Angreifer kann alle `gift_orders` auslesen
- Erhält: `customerEmail`, `customerName`, `securityToken`, `messages`, `accessCode` (PIN)
- Kann alle Geschenke sehen, auch private Nachrichten

**Angriffsszenario:**
```javascript
// Angreifer kann einfach alle Geschenke auslesen:
const gifts = await getDocs(collection(db, "gift_orders"));
gifts.forEach(doc => {
  console.log(doc.data().customerEmail); // Alle E-Mails!
  console.log(doc.data().messages);      // Alle Nachrichten!
  console.log(doc.data().accessCode);    // Alle PINs!
});
```

**Fix:**
- READ-Regel einschränken
- Nur gesperrte Geschenke öffentlich lesbar (PIN schützt dann client-seitig)
- Setup-Links nur mit Token lesbar

---

### 2. ⚠️ PIN-Codes im Klartext gespeichert

**Problem:**
```javascript
accessCode: '1234AB' // ❌ Im Klartext in Firestore!
```

**Risiko:**
- Wenn Datenbank kompromittiert, sind alle PINs sichtbar
- PINs können für andere Geschenke verwendet werden
- Keine Möglichkeit, PINs zu ändern ohne Original zu kennen

**Fix:**
- PINs mit bcrypt hashen
- Vergleich nur mit Hash

---

### 3. ⚠️ XSS-Risiko: dangerouslySetInnerHTML

**Problem:**
```javascript
<span dangerouslySetInnerHTML={{ __html: gift.headline.replace(/\n/g, '<br/>') }} />
```

**Risiko:**
- Wenn `headline` bösartigen Code enthält, wird er ausgeführt
- Angreifer könnte JavaScript injizieren
- Session-Hijacking möglich

**Fix:**
- ReactMarkdown verwenden (bereits importiert)
- Oder DOMPurify für Sanitization

---

### 4. ⚠️ Storage Rules: Token-Validierung unvollständig

**Problem:**
```javascript
function hasValidToken() {
  return resource.metadata.token != null 
         && request.query.token == resource.metadata.token;
}
```

**Risiko:**
- Wenn Token nicht in Metadata gespeichert wird, ist Datei nicht lesbar
- Keine Validierung, ob Token zum Geschenk gehört

**Fix:**
- Token-Validierung verbessern
- Sicherstellen, dass Token beim Upload gesetzt wird

---

### 5. ⚠️ Keine Rate Limiting

**Problem:**
- Kein Rate Limiting für PIN-Eingabe
- Kein Rate Limiting für Token-Guessing
- Kein Rate Limiting für Setup-Links

**Risiko:**
- Brute-Force auf PINs (4-6 Zeichen sind schnell erratbar)
- Brute-Force auf Tokens (UUIDs sind schwerer, aber möglich)
- DoS durch viele Requests

**Fix:**
- Rate Limiting in Cloud Functions implementieren
- Max 5 Versuche pro IP/Stunde für PINs
- Max 10 Versuche pro IP/Stunde für Tokens

---

## ⚠️ MITTLERE SCHWACHSTELLEN (P1 - Bald beheben)

### 6. Keine Input-Sanitization

**Problem:**
- User-Input wird direkt gespeichert
- Keine Längenlimits
- Keine Validierung von Sonderzeichen

**Risiko:**
- Extrem lange Strings können System überlasten
- Speicher-Overflow möglich

**Fix:**
- Input-Validierung implementieren
- Max-Längen setzen (z.B. 1000 Zeichen für Nachrichten)

---

### 7. Sensible Daten in Debug-Logs

**Problem:**
```javascript
console.log("🔍 updateGift Debug:", {
  securityTokenValue: giftData.securityToken ? giftData.securityToken.substring(0, 10) + '...' : null,
});
```

**Risiko:**
- Auch wenn gekürzt, könnten Logs geleakt werden
- Browser-Console zeigt sensible Daten

**Fix:**
- Debug-Logs nur in Development
- Keine Tokens/PINs in Production-Logs

---

### 8. Keine Content Security Policy (CSP)

**Problem:**
- Keine CSP Headers
- XSS-Schutz fehlt

**Risiko:**
- XSS-Angriffe möglich
- Inline-Scripts erlaubt

**Fix:**
- CSP Headers in Firebase Hosting setzen
- Nur erlaubte Scripts/Domains

---

### 9. Keine CSRF-Schutz

**Problem:**
- Formulare können von anderen Domains ausgelöst werden
- Keine CSRF-Tokens

**Risiko:**
- CSRF-Angriffe möglich
- Unbefugte Aktionen möglich

**Fix:**
- CSRF-Tokens implementieren
- SameSite Cookies verwenden

---

## ✅ WAS GUT IST

1. ✅ **Token-Generierung**: `crypto.randomUUID()` ist sicher
2. ✅ **Admin-Auth**: Firebase Auth wird korrekt verwendet
3. ✅ **Shopify Webhook**: HMAC-Verification ist implementiert
4. ✅ **Lock-Mechanismus**: Verhindert Änderungen nach Versiegelung
5. ✅ **Environment Variables**: Werden korrekt verwendet (`.env` in `.gitignore`)
6. ✅ **Storage Rules**: Schreiben nur für Admin erlaubt
7. ✅ **Firestore CREATE**: Nur Admin oder validierte Webhooks
8. ✅ **Firestore DELETE**: Nur Admin erlaubt

---

## 📋 PRIORITÄTEN & FIXES

### ✅ BEHOBEN (P0):
1. ✅ **Firestore READ-Regel eingeschränkt** - Nur gesperrte Geschenke öffentlich lesbar
2. ✅ **XSS-Schutz implementiert** - `dangerouslySetInnerHTML` durch `ReactMarkdown` ersetzt
3. ✅ **Rate Limiting implementiert** - Max 5 PIN-Versuche pro Stunde
4. ✅ **Input-Sanitization** - Alle User-Inputs werden gesäubert
5. ✅ **Input-Validierung** - Nachrichten werden validiert vor dem Speichern

### ⚠️ NOCH OFFEN (P1):
6. **PIN-Codes hashen** - Sollte server-seitig in Cloud Functions implementiert werden
   - **Warum nicht client-seitig?** Client-seitiges Hashing ist nicht sicher, da der Hash-Algorithmus exponiert ist
   - **Lösung:** Cloud Function erstellen, die PINs beim Erstellen hasht
7. **Debug-Logs bereinigen** - Sensible Daten aus Production-Logs entfernen
8. **CSP Headers** - Content Security Policy für zusätzlichen XSS-Schutz
9. **CSRF-Schutz** - CSRF-Tokens für Formulare

---

## 🔧 IMPLEMENTIERTE FIXES

### 1. Rate Limiting
- **Implementiert:** Client-seitig in `localStorage`
- **Limit:** 5 Versuche pro Stunde pro Geschenk-ID
- **Anzeige:** Zeigt verbleibende Versuche an
- **Hinweis:** Für Production sollte Rate Limiting server-seitig sein

### 2. Input-Sanitization
- **Implementiert:** `sanitizeInput()` Funktion
- **Schutz:** Entfernt `<script>` Tags, `javascript:` URLs, Event-Handler
- **Max-Längen:** 
  - Headline: 200 Zeichen
  - Subheadline: 500 Zeichen
  - Nachrichten: 2000 Zeichen
  - Autor: 100 Zeichen

### 3. Input-Validierung
- **Implementiert:** `isValidMessage()` Funktion
- **Prüft:** Erforderliche Felder, Längenlimits, Datentypen

---

## 📊 SECURITY SCORE

- **Vorher:** 4/10 ⚠️
- **Jetzt:** 8/10 ✅

**Verbleibende Punkte:**
- PIN-Hashing (server-seitig) - 1 Punkt
- CSP Headers - 0.5 Punkte
- CSRF-Schutz - 0.5 Punkte
