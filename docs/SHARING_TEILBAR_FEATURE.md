# Social Gifting / „Teilbar“ – Produktregel

## Vor dem Deploy beachten

**„Freunde einladen“ (Contribution-Link) darf nicht für alle Geschenke sichtbar sein.**

- Das Teilen soll als **Extra** verkauft werden (Creator/Käufer entscheidet oder kauft Option).
- Entweder:
  - **Nur Admin** kann pro Geschenk festlegen, ob es teilbar ist, **oder**
  - **Nur der Käufer** kann es aktivieren (z. B. als kostenpflichtiges Add-on „Teilbar“).

## Technische Umsetzung (Stand)

- Neues Geschenke haben `allowContributions: false` (Standard).
- Der Block **„Freunde einladen“** in CustomerSetup wird nur angezeigt, wenn  
  `gift.contributionToken && gift.allowContributions === true`.
- Die Cloud Function **getGiftByContributionToken** liefert nur Daten, wenn  
  `allowContributions !== false` (ansonsten „Geschenk nicht gefunden“).
- **Admin:** Kann in Firestore oder über Admin-Dashboard `allowContributions: true` setzen.
- **Käufer:** Kann im Setup (mit gültigem securityToken) `allowContributions` auf `true` setzen – z. B. wenn das Add-on „Teilbar“ gekauft wurde (Shopify/Etsy Tag oder eigenes UI-Toggle).

## Nächste Schritte (Produkt)

1. **Admin-UI:** In Admin-Dashboard pro Geschenk ein Feld „Teilbar“ (allowContributions) anzeigen und editierbar machen.
2. **Käufer-Opt-in:** Entweder Toggle im CustomerSetup („Freunde einladen aktivieren“), nur anzeigen wenn z. B. Order-Tag „teilbar“ gesetzt ist, oder separates Add-on-Produkt das das Flag setzt.
