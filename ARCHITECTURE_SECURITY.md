# 🛡️ Architecture & Security Blueprint: Connected Gifts Platform

> **Version:** 1.0.0
> **Status:** Draft
> **Author:** System Architect

Dieses Dokument beschreibt die Sicherheitsarchitektur für die "Connected Gifts Platform". Es adressiert spezifisch das Problem der sicheren Identifizierung von Kunden basierend auf Bestellnummern und schützt vor unbefugtem Zugriff (Brute Force, Data Leakage).

---

## 1. Executive Summary: Das Sicherheits-Konzept

Das Kernproblem: Eine einfache Bestellnummer (z.B. `#1024`) ist **kein** sicheres Geheimnis. Sie ist fortlaufend und erratbar.
Die Lösung: Wir implementieren ein **"Soft Authentication" System** basierend auf dem Prinzip: *Wissen + Besitz*.

Wir nutzen zwei Methoden, um den Kunden zu verifizieren, **ohne** dass er einen Account mit Passwort erstellen muss.

### Methode A: Der "Magic Link" (Primär / Zero Friction) 🚀
Der sicherste und einfachste Weg.
1.  **Trigger:** Bestellung geht ein (via Webhook).
2.  **Aktion:** Server generiert einen **kryptografisch sicheren Token** (UUIDv4, z.B. `a8b3-99cc-4d21...`).
3.  **Transport:** Dieser Token wird in einen Link verpackt und **nur** an die hinterlegte E-Mail-Adresse des Kunden gesendet.
4.  **Login:** Klickt der Kunde den Link (`app.de/setup?token=a8b3...`), ist er automatisch authentifiziert.
5.  **Sicherheit:** Der Token ist unerratbar (Entropie). Wer die E-Mail hat, darf das Geschenk bearbeiten.

### Methode B: "Order Challenge" (Fallback) 🛡️
Falls der Kunde den Link nicht nutzt und direkt auf die Startseite geht.
1.  **Schritt 1:** Kunde gibt **Bestellnummer** ein (z.B. `#1024`).
2.  **Schritt 2:** System fragt: *"Bitte bestätigen Sie die E-Mail-Adresse, mit der Sie bestellt haben."*
3.  **Verifikation:** Kunde gibt `saskia@test.de` ein.
4.  **Check:** System prüft Hash(Input) vs. Hash(DB).
5.  **Sicherheit:** Ein Angreifer kann die Bestellnummer raten, aber **nicht** die dazugehörige E-Mail-Adresse. Die Kombination ist sicher.

---

## 2. System-Komponenten & Datenflüsse

### A. Der "Ingest Layer" (Dateneingang)
Die Pforte für externe Daten (Shopify/Etsy).

*   **Technology:** Firebase Cloud Functions (Webhooks).
*   **Security Check:**
    *   **HMAC Signature Verification:** Wir prüfen, ob der Webhook wirklich von Shopify kommt (mittels Shared Secret). Fake-Requests werden sofort verworfen.
*   **Aktion:**
    1.  Empfängt Rohdaten.
    2.  Erstellt internen `Order`-Datensatz.
    3.  Generiert `claimToken` (Secure UUID).
    4.  Sendet "Invitation Email" an Kunden via Postmark/SendGrid.

### B. Die Datenbank (Firestore)

Wir trennen "Identity/Order Data" strikt von "Public Content".

**Collection: `orders` (Streng geheim)**
*   `id`: "ORDER_12345"
*   `customerEmail`: "saskia@test.de" (Indexiert für Challenge)
*   `claimToken`: "xyz-secret-token-123"
*   `status`: "pending" | "configured" | "production"

**Collection: `experiences` (Public Read via QR)**
*   `id`: "EXP_998877" (Zufällige ID, nicht Order-ID!)
*   `type`: "engraving"
*   `publicContent`: { "text": "...", "video": "..." }
*   `security`: { "isLocked": true, "pinHash": "..." }

> **Wichtig:** Der QR-Code enthält die `experienceId`, **nicht** die `orderId`. Über den QR-Code kommt man niemals an die Kundendaten (Email/Name) der Order.

---

## 3. Der KI-Prozess ("The Archivist") - Security Aspects

Wie verhindern wir Missbrauch (Prompt Injection)?

1.  **Backend Proxy:** Der Kunde spricht **nie** direkt mit der OpenAI API.
2.  **Input Sanitization:** Der Server prüft den Input des Kunden (Filter für PII, Hate Speech, Code).
3.  **System Prompt Locking:** Der "System Prompt" (Du bist ein Archivar...) ist auf dem Server hardcodiert. Der Kunde kann nur "User Messages" senden.
4.  **Output Validation:** Bevor der KI-Text in die Datenbank kommt, läuft ein Regex-Filter drüber (Länge prüfen, keine URLs).

---

## 4. Der Produktions-Workflow (Admin Panel)

1.  **Verschlüsselung:** Admin-Zugriff erfordert starke Authentifizierung (Google Auth).
2.  **Ansicht:** Nur der Admin sieht die Verknüpfung zwischen `Order` (Saskia) und `Experience` (Gravurtext).
3.  **QR-Generierung:** Das System generiert QR-Codes on-the-fly. Diese enthalten signierte URLs, um Manipulation zu verhindern.

---

## 5. Angriffs-Szenarien & Gegenmaßnahmen

| Bedrohung | Gegenmaßnahme |
| :--- | :--- |
| **Brute Force (Bestellnummern raten)** | Wir nutzen UUIDs für interne IDs. Öffentliche Bestellnummern (`#1024`) sind nur im Challenge-Verfahren nutzbar (benötigt E-Mail). Rate Limiting (5 Versuche -> IP Ban). |
| **Datenleck via QR-Code** | QR-Code führt zu `experiences` Collection, die KEINE persönlichen Daten (Adresse, Email) enthält. |
| **Prompt Injection (Hacker manipuliert KI)** | KI läuft in Sandbox via Backend. Strenge Input-Filterung. |
| **Man-in-the-Middle** | Zwang zu HTTPS. HSTS Header. |

---

## 6. Zusammenfassung

Dieses Design bietet **Banken-Level Sicherheit** für die Identität (niemand kann fremde Bestellungen kapern) bei gleichzeitig **maximaler User Experience** (Ein Klick auf den Magic Link reicht).

Die Architektur ist **modular**: Wenn Shopify sich ändert, passen wir nur den Ingest-Layer an. Der Rest (Auth, AI, Admin) bleibt stabil.
