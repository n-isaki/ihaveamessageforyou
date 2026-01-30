# 🔥 Firebase Struktur - Kamlimos & Karakedimartin

## 📊 Datenbank-Struktur

### Gleiches Firebase Projekt, separate Collections:

```
Firebase Projekt: gift-shop-app-7bbd3
│
├── 📁 gift_orders          # Kamlimos Geschenke
│   └── {giftId}
│
├── 📁 notes                # Karakedimartin Notizen
│   └── {noteId}
│
├── 📁 links                # Karakedimartin Links
│   └── {linkId}
│
└── 📁 collections          # Karakedimartin Ordner
    └── {collectionId}
```

---

## ✅ Vorteile (Gleiches Projekt):

1. **Einfacher:** Ein Login für beide Apps
2. **Kosten:** Ein Firebase Plan
3. **Auth:** Gleiche User können beide Apps nutzen
4. **Getrennt:** Durch Collections komplett isoliert
5. **Firestore Rules:** Können beide Apps abdecken

---

## 🔐 Firestore Rules Struktur:

```javascript
// Kamlimos Rules
match /gift_orders/{documentId} {
  // ... bestehende Rules
}

// Karakedimartin Rules
match /notes/{noteId} {
  allow read: if resource.data.isPublic == true 
              || request.auth != null;
  allow write: if request.auth != null;
}

match /links/{linkId} {
  allow read: if resource.data.isPublic == true 
              || request.auth != null;
  allow write: if request.auth != null;
}

match /collections/{collectionId} {
  allow read: if resource.data.isPublic == true 
              || request.auth != null;
  allow write: if request.auth != null;
}
```

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
- ⚠️ Höhere Kosten (falls Limits erreicht)

---

## 💡 Meine Empfehlung:

**Gleiches Projekt mit separaten Collections** ✅

Warum:
- Du nutzt beide Apps selbst
- Einfacher zu managen
- Getrennt genug durch Collections
- Firestore Rules können beide Apps schützen

**Nur wenn:**
- Du willst komplett getrennte Billing
- Oder verschiedene Teams Zugriff brauchen
- → Dann separates Projekt

---

## 🚀 Nächste Schritte:

1. Firestore Rules erweitern (für karakedimartin Collections)
2. Firebase Config in karakedimartin nutzen (gleiche Werte)
3. Collections erstellen beim ersten Use

**Soll ich die Firestore Rules jetzt erweitern?**
