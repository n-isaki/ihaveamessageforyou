# Manueller End-to-End Testplan (MVP) - mit Wizard

Dieser Testplan fokussiert sich rein auf den **Wizard ("Neuer Auftrag")**, da wir darüber sowohl "Shopify Bestellungen" als auch "Manuelle Aufträge" simulieren können.

## Voraussetzungen
1. Stelle sicher, dass der Dev-Server läuft: `npm run dev`
2. Öffne `http://localhost:5173`
3. Logge dich als Admin ein.
   - Email: `nazif.isaki@gmail.com`
   - Password: `Dalinsko32910!!`

---

## Szenario A: Multimedia Tasse

### 1. Auftrag manuell anlegen (Shopify Simulation)
1. Klicke im Dashboard oben rechts auf **"Neuer Auftrag"**.
2. **Schritt 1 (Produkt):** Wähle "Multimedia Tasse". Klicke "Weiter".
3. **Schritt 2 (Details):** 
   - Fülle Empfänger/Absender aus (z.B. "Max" an "Erika").
   - **Design:** Nutze einen der kleinen Buttons (z.B. "Strand"), um schnell eine Bild-URL zu setzen.
   - **PIN:** Wähle z.B. `1234`.
   - **Animation:** Wähle "Konfetti".
   - Klicke "Weiter".
4. **Schritt 3 (Inhalte):**
   - Füge eine Text-Nachricht hinzu.
   - Klicke "Weiter".
5. **Schritt 4 (Review):**
   - Prüfe die Zusammenfassung.
   - Klicke **"Speichern"**.

### 2. Erlebnis testen (Viewer)
1. Zurück im Dashboard, klicke auf das **Auge-Icon** der neuen Karte.
2. *Erwartung:* 
   - PIN-Abfrage erscheint.
   - Nach PIN-Eingabe (`1234`) siehst du das Strandbild, Konfetti und deine Nachricht.

---

## Szenario B: Ritual Armband

### 1. Auftrag manuell anlegen
1. Klicke im Dashboard auf **"Neuer Auftrag"**.
2. **Schritt 1 (Produkt):** Wähle "Ritual Armband". Klicke "Weiter".
3. **Schritt 2 (Details):** 
   - Beachte: PIN und Animation sind WEG.
   - Fülle Empfänger/Absender aus.
   - **Gravur Text (Manuell):** Hier simulierst du nun das Ergebnis des Rituals (oder was Shopify schicken würde).
     - Gib ein: *"Ich halte dich nicht fest, ich halte zu dir."*
     - *(Wenn du das Feld leer lässt, würdest du den Status simulieren, bevor der Kunde das Ritual gemacht hat).*
   - Klicke "Weiter".
4. **Schritt 3 (Review):**
   - Prüfe, ob der Gravur-Text angezeigt wird.
   - Klicke **"Speichern"**.

### 2. Erlebnis testen (Story Card)
1. Klicke auf das **Auge-Icon** im Dashboard für das Armband.
2. *Erwartung:* 
   - **Keine PIN-Abfrage.**
   - Die dunkle Story Card öffnet sich direkt.
   - Der Text *"Ich halte dich nicht fest..."* steht elegant in der Mitte.

---

## Zusatz: Ritual Chat testen (Optional)
Wenn du beim Armband das Feld "Gravur Text" **LEER** gelassen hast:
1. Öffne die Story Card (Auge-Icon).
2. Da kein Text da ist (oder wenn du die URL manipulierst zu `/ritual/:id`), könntest du den Chat starten.
3. *Hinweis:* Aktuell zeigt die Story Card einfach einen Platzhalter, wenn kein Text da ist. Der Chat-Link für den Kunden wäre `/ritual/[ID]`.
