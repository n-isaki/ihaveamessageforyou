import React from 'react';
import { Watch } from 'lucide-react';

export default function CommonFormFields({ 
  formData, 
  onInputChange, 
  showTimeCapsule = true,
  showAccessCode = false,
  showOpeningAnimation = false
}) {
  const generateRandomCode = () => {
    const words = [
      "LUNA", "STAR", "HERZ", "SUN", "MOND", "ROSE", "CODE", "GIFT", "LIEBE", "GLUCK",
    ];
    const year = new Date().getFullYear().toString();
    const roll = Math.random();
    const code =
      roll < 0.4
        ? words[Math.floor(Math.random() * words.length)]
        : roll < 0.7
          ? year
          : Array.from(
            { length: 6 },
            () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
          ).join("");
    return code;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Bestellnummer */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Bestellnummer (Shopify/Etsy)
        </label>
        <input
          type="text"
          name="orderId"
          value={formData.orderId}
          onChange={onInputChange}
          className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
          placeholder="#1001"
        />
      </div>

      {/* Kundeninformationen */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Kunden Name
        </label>
        <input
          type="text"
          name="customerName"
          value={formData.customerName}
          onChange={onInputChange}
          className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Kunden Email
        </label>
        <input
          type="text"
          name="customerEmail"
          value={formData.customerEmail}
          onChange={onInputChange}
          className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
        />
      </div>

      {/* Access Code (für Tassen) */}
      {showAccessCode && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            PIN Code (optional, wird dem Käufer vorausgefüllt)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="accessCode"
              value={formData.accessCode}
              onChange={onInputChange}
              className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
              placeholder="z.B. für Empfänger"
            />
            <button
              type="button"
              onClick={() => {
                const code = generateRandomCode();
                onInputChange({ target: { name: 'accessCode', value: code } });
              }}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-300 transition-colors text-sm font-medium whitespace-nowrap"
              title="Zufälligen PIN generieren (z.B. LUNA, 2025)"
            >
              ✨ Generieren
            </button>
          </div>
        </div>
      )}

      {/* Opening Animation (für Tassen) */}
      {showOpeningAnimation && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Öffnungs-Animation
          </label>
          <select
            name="openingAnimation"
            value={formData.openingAnimation}
            onChange={onInputChange}
            className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
          >
            <option value="none">Keine</option>
            <option value="hearts">Herzen ❤️</option>
            <option value="stars">Sterne ⭐</option>
            <option value="confetti">Konfetti 🎉</option>
          </select>
        </div>
      )}

      {/* Time Capsule */}
      {showTimeCapsule && (
        <div className="col-span-2 md:col-span-2 border-t border-stone-100 pt-4 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <Watch className="h-4 w-4 text-indigo-500" />
            <label className="text-sm font-medium text-stone-700">
              Zeitkapsel (Optional)
            </label>
          </div>
          <p className="text-xs text-stone-500 mb-2">
            Wenn gesetzt, ist das Geschenk bis zu diesem
            Zeitpunkt gesperrt (Countdown).
          </p>
          <input
            type="datetime-local"
            name="unlockDate"
            value={formData.unlockDate || ""}
            onChange={onInputChange}
            className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
          />
        </div>
      )}
    </div>
  );
}
