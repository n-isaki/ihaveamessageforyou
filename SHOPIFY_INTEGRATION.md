# Shopify Integration Plan

## Ziel
Integration der "Anima" Personalisierung (Nachrichten, Gravur, Medien) direkt in die Shopify Produktseite. Ersetzt externe Apps durch eine maßgeschneiderte Eigenlösung.

## Architektur: "Embedded Widget"

Wir bauen ein **React Widget**, das in die Shopify-Seite injiziert wird.

### 1. Das Frontend-Widget (React)
Ein neues Modul in diesem Projekt (`src/embed/`).
*   **Funktionen:**
    *   Auswahl der Geschenkeigenschaften (falls nicht über Shopify Varianten gelöst).
    *   Eingabefelder für Gravur.
    *   Upload/Eingabe von Nachrichten (Text, Bild, Video).
    *   Live-Vorschau (optional).
*   **Design:** Passt sich nahtlos an das Shopify Theme an (CSS Variablen, Schriftarten).

### 2. Der Checkout-Flow
1.  Kunde wählt Optionen im Widget.
2.  Kunde klickt "Speichern" oder das Widget speichert automatisch.
3.  Die Daten werden in unserer Firebase Datenbank gespeichert (`gift_orders`-Collection mit Status `pending`).
4.  Wir erhalten eine **Gift ID** (z.B. `12345`).
5.  Das Widget schreibt diese ID in ein verstecktes Formularfeld (`properties[_giftId]`) im Shopify "Add to Cart" Formular.
6.  Beim Klick auf den Shopify "In den Warenkorb"-Button wird die ID mitbestellt.

### 3. Integration in Shopify
Wir nutzen einen "Custom Liquid" Block im Produkt-Template. Erstellte diesen Block dort, wo die Konfiguration erscheinen soll:

```html
<link rel="stylesheet" href="https://admin.kamlimos.com/widget/widget.css?v=13">
<script src="https://admin.kamlimos.com/widget/widget.js?v=13" async></script>

<!-- WICHTIG: style sorgt für volle Breite im Theme -->
<div id="anima-configurator" 
     data-product-id="{{ product.id }}"
     style="width: 100%; display: block;">
</div>
```

## Vorteile
*   **Keine monatlichen App-Gebühren:** Es läuft alles über dein eigenes Firebase.
*   **Volle Kontrolle:** Wir bestimmen Design und Ablauf zu 100%.
*   **Performance:** Lädt asynchron, bremst die Seite nicht aus.

## Nächste Schritte
1.  `ProductConfigurator` Komponente erstellen (Vereinfachter Wizard).
2.  Build-Prozess anpassen, um eine `widget.js` zu erzeugen.
3.  In Shopify einfügen und testen.
