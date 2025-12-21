# ANIMA Phase 2: Shopify Integration & Architektur

Dieses Dokument beschreibt die Architektur für die Verknüpfung von Shopify (Sales) mit der Anima Plattform (Experience/Production) sowie den professionellen Dev-Workflow.

## 1. System-Architektur (The Big Picture)

Wir trennen "Verkauf" und "Erlebnis" sauber.

### A. Die Komponenten
1.  **Sales Frontend (Shopify):**
    *   Hier kauft der Kunde.
    *   Edles Design ("Premium"), optimiert auf Conversion.
    *   Produkte: "Multimedia Tasse", "Ritual Armband".
    *   Inputs im Warenkorb: Name des Empfängers, ggf. erster Grußtext (als "Line Item Properties").
2.  **The Bridge (Middleware via Firebase Functions):**
    *   Verbindet Shopify mit Anima.
    *   Hört auf Shopify Webhooks (z.B. `orders/paid`).
    *   Transformiert Shopify-Daten in das Anima-Format.
3.  **Anima Core (Deine React App):**
    *   **Admin:** Produktion sieht den Auftrag, druckt QR-Codes.
    *   **Customer:** Kunde nutzt Anima, um Inhalte hochzuladen (für Tasse) oder Ritual zu machen (für Armband).
    *   **Recipient:** Empfänger erlebt das Geschenk (Viewer).

### B. Datenfluss (Der "Happy Path")
1.  **Kauf:** Kunde kauft Tasse im Shopify Store -> Bestellung #1001.
2.  **Trigger:** Shopify sendet Webhook `orders/paid` an unsere Firebase Cloud Function.
3.  **Security Check:** Funktion prüft "HMAC Signature" (stellt sicher, dass Daten wirklich von Shopify kommen und nicht von Hackern).
4.  **Creation:** Funktion erstellt Eintrag in `gift_orders` Firestore DB (Status: `OPEN`).
5.  **Produktion:** Im Anima Admin Dashboard taucht Bestellung #1001 auf.
6.  **Fulfillment:** Du druckst den QR-Code via Dashboard und versendest die Tasse.

---

## 2. Design & Branding Strategie

Um das "schick edle Design" durchzuziehen, müssen Shopify und Anima wie aus einem Guss wirken.

*   **Farbpalette:** Wir übertragen dein Stone/Rose/Emerald Schema exakt in das Shopify Theme.
*   **Theme Wahl:** Ich empfehle das kostenlose Shopify Theme **"Dawn"** oder **"Sense"** als Basis. Wir passen es per CSS ("Liquid") an, damit es nicht mehr nach Standard aussieht.
*   **Asset-Abgleich:** Die Schriftarten und Button-Styles (abgerundete Ecken, Schatten) aus Anima werden 1:1 in Shopify kopiert.

---

## 3. Development Workflow (CI/CD)

Wie testen wir neue Features, ohne den Live-Shop zu zerschießen?

### Das 2-Umgebungen-Prinzip

1.  **Production (Live)**
    *   URL: `ihmfy.app` (Beispiel)
    *   Shopify: Dein echter Shop.
    *   Datenbank: Echte Kundendaten.
    *   Branch: `main`.
    *   *Regel:* Hier wird NIE direkt codiert. Nur gesicherte Merges.

2.  **Staging (Test-Labor)**
    *   URL: `staging.ihmfy.app` (oder lokale Simulation).
    *   Shopify: Ein "Development Store" (kostenlos bei Shopify Partners) oder der "Test Mode" im echten Shop.
    *   Datenbank: `ihmfy-dev` (Leere Test-DB).
    *   Branch: `dev`.
    *   *Zweck:* Hier testen wir neue Features (z.B. neues KI-Ritual).

### Der Prozess für neue Features
1.  Du sagst: "Wir brauchen Feature X".
2.  Ich code es auf dem `dev` Branch.
3.  Wir testen es lokal oder auf Staging.
4.  Wenn alles klappt -> Merge in `main` -> Automatisches Deploy (das richten wir noch ein).

---

## 4. Security Maßnahmen

1.  **Webhook Secrets:** Nur Shopify kennt das Geheimnis, um Bestellungen in unser System zu schießen.
2.  **Rate Limiting:** Wir schützen die PIN-Eingabe (bei Tassen), damit niemand PINs raten kann.
3.  **One-Time-Links (für Armbänder):** Das Ritual darf pro QR-Code nur 1x durchgeführt werden (Schreibschutz danach).

---

## Nächste Schritte (Action Plan)

1.  **Shopify:** Wähle ein Theme (wir nehmen erst mal ein Free Theme) und gib mir Zugriff (oder wir machen es blind via Code-Snippets).
2.  **Firebase Functions:** Wir müssen das "Blaze" Plan Upgrade in Firebase aktivieren (nötig für externe Webhooks), aber es bleibt meist kostenlos im Rahmen der Free-Tier.
3.  **Webhook Bauen:** Ich schreibe den Code, der Shopify-Daten annimmt.
