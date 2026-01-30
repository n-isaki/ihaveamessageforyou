#!/bin/bash

# Shopify Theme Local Development
# Startet einen lokalen Development-Server der Änderungen live synchronisiert

set -e

echo "🚀 Starting Shopify Theme Development Server..."
echo ""
echo "📝 Was passiert:"
echo "  1. Erstellt ein Development Theme auf Shopify (falls nicht vorhanden)"
echo "  2. Synchronisiert deine lokalen Dateien"
echo "  3. Änderungen werden automatisch hochgeladen wenn du speicherst"
echo "  4. Du bekommst eine Preview-URL zum Testen"
echo ""
echo "⚠️  Wichtig:"
echo "  - Das Development Theme ist NICHT öffentlich sichtbar"
echo "  - Nur du kannst es über die Preview-URL sehen"
echo "  - Änderungen werden automatisch synchronisiert"
echo ""

cd shopify-theme

# Prüfe ob Store als Parameter übergeben wurde
if [ -n "$1" ]; then
    STORE="$1"
else
    # Standard Store: luluzin-2
    STORE="luluzin-2"
fi

echo "📦 Verwende Store: $STORE"
echo ""

# Prüfe ob .env Datei existiert und Token lädt
if [ -f ".env" ]; then
    echo "✅ Lade Admin API Token aus .env..."
    set -a
    source .env 2>/dev/null || true
    set +a
    
    if [ -n "$SHOPIFY_CLI_PASSWORD" ]; then
        echo "✅ Token gefunden, starte Development Server..."
        shopify theme dev --store="$STORE" --password="$SHOPIFY_CLI_PASSWORD"
    else
        echo "⚠️  Kein SHOPIFY_CLI_PASSWORD in .env gefunden"
        echo ""
        echo "💡 Lösung: Admin API Token erstellen"
        echo "   1. Gehe zu: https://admin.shopify.com/store/luluzin-2/settings/apps"
        echo "   2. Erstelle eine Custom App"
        echo "   3. Aktiviere 'read_themes' und 'write_themes'"
        echo "   4. Installiere die App und kopiere den Admin API Token (shpat_...)"
        echo "   5. Speichere: echo 'SHOPIFY_CLI_PASSWORD=shpat_dein_token' > .env"
        echo ""
        echo "📖 Siehe SHOPIFY_TOKEN_ANLEITUNG.md für Details"
        echo ""
        echo "🔄 Versuche es ohne Token (wird nach Passwort fragen)..."
        shopify theme dev --store="$STORE"
    fi
else
    echo "⚠️  Keine .env Datei gefunden"
    echo ""
    echo "💡 Lösung: Admin API Token erstellen"
    echo "   Siehe SHOPIFY_TOKEN_ANLEITUNG.md für Anleitung"
    echo ""
    echo "🔄 Versuche es ohne Token (wird nach Passwort fragen)..."
    shopify theme dev --store="$STORE"
fi
