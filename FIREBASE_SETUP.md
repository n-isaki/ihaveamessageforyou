# 🔥 Firebase Setup - Karakedimartin

## ✅ Entscheidung: **Gleiches Projekt, separate Collections**

### Warum?
- ✅ Einfacher zu managen
- ✅ Gleiche Auth (ein Login)
- ✅ Kosteneffizienter
- ✅ Getrennt durch Collections

---

## 📊 Datenbank-Struktur:

```
Firebase Projekt: gift-shop-app-7bbd3
│
├── 📁 gift_orders          # Kamlimos (bestehend)
│   └── {giftId}
│
├── 📁 karakedimartin_notes      # Karakedimartin Notizen
│   └── {noteId}
│       ├── title: string
│       ├── content: string (Markdown)
│       ├── isPublic: boolean
│       ├── slug: string (für Public URLs)
│       ├── tags: string[]
│       ├── createdAt: Timestamp
│       └── authorId: string
│
├── 📁 karakedimartin_links      # Karakedimartin Links
│   └── {linkId}
│       ├── url: string
│       ├── title: string
│       ├── description: string
│       ├── isPublic: boolean
│       ├── slug: string
│       ├── tags: string[]
│       ├── createdAt: Timestamp
│       └── authorId: string
│
└── 📁 karakedimartin_collections # Karakedimartin Collections
    └── {collectionId}
```

**Vorteil:** Komplett getrennt durch `karakedimartin/` Prefix!

---

## 🔐 Firestore Rules:

**Bereits erweitert!** Die Rules sind jetzt in `firestore.rules`:

- ✅ `gift_orders` - Kamlimos (bestehend)
- ✅ `notes` - Karakedimartin (NEU)
- ✅ `links` - Karakedimartin (NEU)
- ✅ `collections` - Karakedimartin (NEU)

**Regeln:**
- Public Inhalte: Lesbar für alle
- Private Inhalte: Nur du (isAdmin)
- Erstellen/Bearbeiten/Löschen: Nur du

---

## 🚀 Nächste Schritte:

1. **Firestore Rules deployen:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Firebase Config in karakedimartin:**
   - Erstelle `.env.local` mit gleichen Werten wie Hauptprojekt
   - Gleiche Firebase Config nutzen

3. **Collections werden automatisch erstellt:**
   - Beim ersten Create werden Collections angelegt
   - Kein manuelles Setup nötig

---

## 🆚 Alternative: Separates Projekt

**Wenn du komplett getrennt willst:**

### Vorteile:
- ✅ Komplett isoliert
- ✅ Separate Billing
- ✅ Separate Auth

### Nachteile:
- ⚠️ Zwei Firebase Projekte verwalten
- ⚠️ Zwei Logins nötig
- ⚠️ Höhere Kosten

**Empfehlung:** Bleib beim gleichen Projekt! ✅
