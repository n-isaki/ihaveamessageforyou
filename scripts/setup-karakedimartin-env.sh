#!/bin/bash

# Script zum Kopieren der Firebase Config von Hauptprojekt zu karakedimartin

echo "🔄 Kopiere Firebase Config..."

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo "❌ Fehler: .env Datei nicht gefunden im Hauptprojekt"
    exit 1
fi

# Lese Werte aus .env
API_KEY=$(grep "^VITE_FIREBASE_API_KEY=" .env | cut -d '=' -f2-)
AUTH_DOMAIN=$(grep "^VITE_FIREBASE_AUTH_DOMAIN=" .env | cut -d '=' -f2-)
PROJECT_ID=$(grep "^VITE_FIREBASE_PROJECT_ID=" .env | cut -d '=' -f2-)
STORAGE_BUCKET=$(grep "^VITE_FIREBASE_STORAGE_BUCKET=" .env | cut -d '=' -f2-)
MESSAGING_SENDER_ID=$(grep "^VITE_FIREBASE_MESSAGING_SENDER_ID=" .env | cut -d '=' -f2-)
APP_ID=$(grep "^VITE_FIREBASE_APP_ID=" .env | cut -d '=' -f2-)
MEASUREMENT_ID=$(grep "^VITE_FIREBASE_MEASUREMENT_ID=" .env | cut -d '=' -f2-)

# Prüfe ob Werte gefunden wurden
if [ -z "$API_KEY" ]; then
    echo "❌ Fehler: VITE_FIREBASE_API_KEY nicht gefunden"
    exit 1
fi

# Erstelle .env.local für karakedimartin
cat > karakedimartin/.env.local << EOF
# Firebase Configuration
# Automatisch generiert von scripts/setup-karakedimartin-env.sh

NEXT_PUBLIC_FIREBASE_API_KEY=$API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=$APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$MEASUREMENT_ID
EOF

echo "✅ .env.local erstellt in karakedimartin/"
echo ""
echo "Werte kopiert:"
echo "  - API_KEY: ${API_KEY:0:20}..."
echo "  - PROJECT_ID: $PROJECT_ID"
echo ""
echo "🚀 Starte jetzt: cd karakedimartin && npm run dev"
