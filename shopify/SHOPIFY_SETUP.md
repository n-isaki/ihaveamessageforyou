# Shopify Setup Anleitung - Bedingte Anzeige

## 🎯 Ziel
Produkte zeigen nur relevante Felder:
- **Nur Gravur**: Zeigt nur Gravur-Feld
- **Gravur + Digitale Botschaft**: Zeigt Gravur + Multimedia-Felder
- **Nur Digitale Botschaft**: Zeigt nur Multimedia-Felder

---

## 📋 Schritt 1: Theme herunterladen

```bash
cd /Users/nazifisaki/Projekte/ihmfy
shopify theme pull
```

Oder manuell:
1. Shopify Admin → Online Store → Themes
2. "Code bearbeiten" klicken
3. Dateien herunterladen

---

## 📋 Schritt 2: Template hochladen

### Option A: Via Shopify CLI

```bash
cd shopify-theme
shopify theme push
```

### Option B: Manuell

1. Shopify Admin → Online Store → Themes → Code bearbeiten
2. Sections → "Add section"
3. Code aus `anima-product-wizard-conditional.liquid` kopieren
4. Speichern

---

## 📋 Schritt 3: Produkt-Tags setzen

### Für "Nur Gravur" Produkt:
1. Shopify Admin → Products → [Dein Produkt]
2. Tags hinzufügen: `nur-gravur` oder `only-engraving`
3. Speichern

### Für "Gravur + Digitale Botschaft":
1. Tags hinzufügen: `gravur-plus-digital` oder `engraving-plus-digital`
2. Speichern

### Für "Nur Digitale Botschaft":
1. Tags hinzufügen: `nur-digital` oder `only-digital`
2. Speichern

---

## 📋 Schritt 4: Template zuweisen

1. Shopify Admin → Products → [Dein Produkt]
2. Scroll zu "Theme templates"
3. Wähle "Anima Product Wizard (Conditional)"
4. Speichern

---

## 🔧 Alternative: Via Varianten-Titel

Wenn du keine Tags verwenden willst, kannst du auch Varianten-Titel nutzen:

- Variante: "Gravur" → Zeigt nur Gravur
- Variante: "Gravur + Digital" → Zeigt beides
- Variante: "Digital" → Zeigt nur Multimedia

---

## ✅ Testen

1. Produktseite öffnen
2. Prüfen welche Felder angezeigt werden
3. Formular ausfüllen und testen

---

## 🐛 Troubleshooting

**Problem:** Alle Felder werden angezeigt
- Lösung: Prüfe ob Produkt-Tags korrekt gesetzt sind
- Lösung: Prüfe ob Template korrekt zugewiesen ist

**Problem:** Widget lädt nicht
- Lösung: Prüfe ob `widget.js` und `widget.css` erreichbar sind
- Lösung: Browser-Konsole auf Fehler prüfen
