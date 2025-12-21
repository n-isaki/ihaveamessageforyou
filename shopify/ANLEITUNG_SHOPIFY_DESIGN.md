# Anleitung: Shopify Design Integration

Wir nutzen das kostenlose Shopify-Theme **"Dawn"** als Basis und überschreiben dessen Standard-Stil mit unserem **ANIMA Design System**, um den Look & Feel der App zu spiegeln (Premium, Minimalistisch, Stone/Rose Farben).

## Schritt 1: Theme vorbereiten
1.  Logge dich in deinen Shopify Admin Bereich ein.
2.  Gehe zu **Vertriebskanäle > Onlineshop > Themes**.
3.  Falls "Dawn" nicht aktiv ist, scrolle runter und wähle es aus der Bibliothek (Kostenlos).
4.  Klicke beim aktiven Theme auf **"Anpassen"** (Customize).

## Schritt 2: Design System (CSS) anwenden
Du hast zwei Möglichkeiten. **Option A** ist einfacher und sicherer für Anfänger.

### Option A: Via Theme Editor (Empfohlen)
1.  Klicke im Editor links auf das **Zahnrad-Symbol** (Theme-Einstellungen).
2.  Scrolle ganz nach unten zu **"Benutzerdefiniertes CSS"** (Custom CSS).
3.  Kopiere den gesamten Inhalt aus unserer Datei `shopify/ANIMA_DESIGN_SYSTEM.css`.
4.  Füge ihn in das Textfeld ein.
5.  Klicke oben rechts auf **"Speichern"**.

### Option B: Via Code Editor (Für Profis)
1.  Klicke im Shopify Admin bei deinem Theme auf die drei Punkte `...` und dann **"Code bearbeiten"**.
2.  Suche im Ordner `Assets` nach der Datei `base.css`.
3.  Scrolle ganz nach unten ans Ende der Datei.
4.  Füge den Inhalt aus `shopify/ANIMA_DESIGN_SYSTEM.css` dort ein.
5.  Speichern.

## Schritt 3: Einstellungen anpassen (Ohne Code)
Gehe zurück in den visuellen Editor (**Anpassen**) und prüfe diese Einstellungen unter **Theme-Einstellungen (Zahnrad)**:

1.  **Farben:**
    *   Setze *Hintergrund* auf `#fafaf9` (Unser Stone-50).
    *   Setze *Text* auf `#1c1917` (Unser Stone-900).
    *   Setze *Akzent 1* (Buttons) auf `#1c1917`.
    *   Setze *Akzent 2* (Highlights) auf `#e11d48` (Rose-600).

2.  **Typografie:**
    *   Wähle für **Überschriften**: *Playfair Display* (oder eine ähnliche Serif-Schrift für den "Premium"-Look).
    *   Wähle für **Textkörper**: *Inter*, *Assistant* oder *Roboto* (Clean Sans-Serif).

3.  **Buttons:**
    *   Stelle *Eckenradius* auf ca. **12px** (Passt zu unserem CSS).
    *   Stelle *Schatten* auf "Tief" oder "Mittel".

## Schritt 4: Produkte anlegen
Lege deine zwei Hauptprodukte an, damit wir sie sehen können:
1.  **Produkt "Multimedia Tasse"**
2.  **Produkt "Ritual Armband"**

*Tipp: Lade hochwertige Bilder hoch. Unser Design lebt von guten Produktfotos!*
