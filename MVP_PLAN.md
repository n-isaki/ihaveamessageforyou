# 🚀 MVP Plan: Project ANIMA (Phase 1)

Ziel: Ein funktionierender "End-to-End" Flow für Tassen (Multimedia) und Armbänder (Ritual/Gravur), von der Bestellung bis zur Produktion.

## 📦 Paket 1: Admin Dashboard & Produktion (High Priority)
Damit du arbeiten kannst.
- [ ] **Erweiterte Order-Liste:** Anzeige von Produktbildern (aus Shopify).
- [ ] **Produktions-Ansicht (Armband):**
    - Zeigt den zu gravierenden Text extrem groß an (für Laser).
    - Zeigt Status "Ritual abgeschlossen?".
- [ ] **Produktions-Ansicht (Tasse):**
    - Zeigt das gewählte Design-Bild an.
    - Button "QR-Code herunterladen" (SVG/PNG) für den Laser.

## 📦 Paket 2: Das "Ritual" (Armband Experience)
Damit der Kunde den Text liefert.
- [ ] **Chat-Interface:** Der "Archivar" führt das Gespräch.
- [ ] **Text-Selektion:** Kunde wählt aus 3 Vorschlägen.
- [ ] **Daten-Speicherung:** Text wandert in `engravingText` Feld der Order.

## 📦 Paket 3: Shopify Simulation ("Ingest")
Damit wir testen können ohne echten Shop.
- [ ] **Simulator Page:** `/admin/simulate-order`
- [ ] Formular: Wähle Produkt (Tasse/Armband), lade Design-Bild hoch (Fake), setze Kunden-Email.
- [ ] **Ergebnis:** Erstellt einen Auftrag im System, der im Admin-Dashboard erscheint.

## 📦 Paket 4: Die Public Viewer Pages
Damit der Empfänger strahlt.
- [ ] **Tasse:** Video-Player mit PIN (existiert schon, muss poliert werden).
- [ ] **Armband:** Neue "Story Card" Seite (Text + Hintergrund-Story).

---
**Nächster Schritt:** Wir bauen Paket 3 (Simulator) zuerst, damit wir "Test-Daten" haben. Dann Paket 1 (Admin Panel), damit du siehst, wie es ankommt.
