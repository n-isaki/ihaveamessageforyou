# Security-Kurzbewertung (Stand vor Prod-Deploy)

## Bereits gut umgesetzt

- **Setup-Link (getGiftBySetupToken):** Token-Validierung nur serverseitig (Cloud Function). Kein Zugriff ohne gültiges `securityToken`. Token ist UUID, nicht ratbar.
- **Firestore Rules:** Lese-Zugriff für unversiegelte Geschenke oder mit Token (über Cloud Function). Updates nur mit `hasValidTokenInUpdate` (securityToken im Update-Payload) oder Admin. Contributions nur mit `contributionToken`.
- **PIN:** Wird nur serverseitig gehasht (`hashPin` Cloud Function). Client sendet PIN, erhält Hash, speichert `accessCodeHash` in Firestore. Kein Klartext-PIN in der DB.
- **Input:** `sanitizeInput` (XSS), `isValidMessage` (Länge, Typ) vor Persistenz.
- **Sensible Daten in Logs:** `accessCode` und `securityToken` werden in Debug-Logs gekürzt/redacted.

## Bekannte Einschränkungen

- **Rate Limiting:** Nur clientseitig (localStorage). Für harte Absicherung wäre serverseitiges Rate Limiting (z. B. in Cloud Functions) nötig.
- **Firestore `isValidToken()`:** Regel nutzt `request.query`; bei `getDoc()` gibt es kein Query. Setup-Zugriff läuft daher über die Cloud Function `getGiftBySetupToken` – korrekt so.

## Empfehlung

Für den aktuellen Prod-Deploy: **Security-Stand ist ausreichend.** Setup-Links sind tokenbasiert und serverseitig geprüft; PIN-Handling und Firestore-Regeln sind konsistent umgesetzt.
