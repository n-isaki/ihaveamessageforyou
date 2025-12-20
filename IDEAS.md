# 🏗️ Architektur-Blueprint: "Connected Gifts Platform"

Dieses Dokument beschreibt die technische Vision für eine zentrale Plattform, die physische Produkte (Gravur/Druck) mit digitalen Erlebnissen (Webseiten) verknüpft und Bestellungen aus verschiedenen Shops (Shopify, Etsy) bündelt.

## 1. Das Kern-Konzept: "Hybrid Experiences"
Jedes verkaufte Produkt ist nicht nur ein Gegenstand, sondern eine "Experience" bestehend aus zwei Teilen:

1.  **Physischer Teil (Production Data):**
    *   Was muss gelasert/gedruckt werden? (z.B. der KI-generierte Satz, der Name, der QR-Code).
    *   Wichtig für den Admin/Produzenten.
2.  **Digitaler Teil (Digital Twin):**
    *   Was passiert, wenn der QR-Code gescannt wird?
    *   Wichtig für den Empfänger (Landing Page).

### Datenmodell (Unified Schema)
Egal ob Armband oder Tasse, alle landen in **einer** Datenbank mit unterschiedlichen Typen:

```json
{
  "id": "exp_ORDER123",
  "source": "shopify" | "etsy",
  "productType": "bracelet_ritual" | "video_mug",
  "status": "pending_creation" | "ready_for_production" | "shipped",
  "physical": {
    "engravingText": "In der Stille liegt die Kraft", // Für Laser
    "qrCodeUrl": "https://deinemarke.de/v/exp_ORDER123" // Für Laser
  },
  "digital": {
    "template": "ritual_card" | "video_vault",
    "content": { ... }, // Text, Video-URL, Audio
    "security": { "pin": "1234", "locked": true }
  }
}
```

---

## 2. Die Eingangs-Kanäle (Multi-Channel Import)
Ziel: **Zentraler Rechnungseingang.** Egal wo verkauft wird, es landet im selben Dashboard.

### A. Shopify Integration (Webhook)
*   **Trigger:** Bestellung bezahlt (`orders/paid`).
*   **Logik:** Webhook sendet Daten an Firebase. System erkennt anhand der SKU/Artikelnummer: "Aha, das ist ein Armband".
*   **Action:** Legt Experience in DB an -> Sendet Link an Kunden ("Bitte personalisiere jetzt dein Armband").

### B. Etsy Integration (Polling/API)
*   **Trigger:** Neuer Auftrag in Etsy.
*   **Logik:** Ein Skript prüft alle 10 Min auf neue Bestellungen (Polling) oder nutzt Etsy Webhooks.
*   **Action:** Importiert Bestellung in dieselbe DB -> Sendet E-Mail/Etsy-Nachricht an Kunden mit dem Link zum Wizard.

---

## 3. Die "Creation Wizards" (Kunden-Frontend)
Der Kunde klickt auf den Link aus der Mail und landet – je nach Produkt – in einem anderen **Wizard**:

*   **Wizard A: "Der Archivar" (für Armbänder)**
    *   Mystischer Chat-Bot (KI).
    *   Stellt Fragen -> Generiert tiefgründigen Satz.
    *   Speichert Satz in `physical.engravingText` UND `digital.content`.
*   **Wizard B: "Gift Studio" (für Tassen/Karten)**
    *   Multimedia Upload (Video, Audio, Text).
    *   Setzt PIN-Code.
    *   Speichert Medien in `digital.content`.

---

## 4. Die "Produktions-Werkstatt" (Dein Admin Panel)
Das Dashboard für dich am Laser.

*   **Barcode-Scan:** Du scannst den Lieferschein (Order-ID).
*   **Smart View:** Das System zeigt dir genau das, was du jetzt brauchst:
    *   *Bei Armband:* Groß den **Gravur-Text** + Button "QR-Code für Verpackung drucken".
    *   *Bei Tasse:* Button "**QR-Code für Tassenboden laden**" (Vektor-Datei).

---

## 5. Das Erlebnis (Empfänger-Frontend)
Der "Smart Router". Ein QR-Code-System für alles.
URL: `deinemarke.de/v/{id}`

Das System prüft den Typ und lädt das passende Template:

*   **Template "Ritual" (Armband):**
    *   Design: Edel, Text-Fokus, Papier-Textur.
    *   Inhalt: Zeigt den gravierten Satz groß + "Die Geschichte dahinter" (KI generiert).
    *   Kein Login nötig.
*   **Template "Tresor" (Tasse/Karte):**
    *   Design: Festlich, Party, Interaktiv.
    *   Aktion: PIN-Eingabe -> Video-Player öffnet sich -> Konfetti fliegt.

---

## Nächste Schritte (Roadmap)
1.  **Phase 1:** Bestehendes "Opa Hans" System stabilisieren (Done ✅).
2.  **Phase 2:** "Archivar" (KI Chat) als Prototyp bauen.
3.  **Phase 3:** Shopify/Etsy Dummy-Import bauen (manuell simulieren, dann automatisieren).
4.  **Phase 4:** Admin-Dashboard erweitern für "Hybrid-View" (Laser-Daten anzeigen).
