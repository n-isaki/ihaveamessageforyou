import React from 'react';
import { User, Users, MessageSquare, Settings } from 'lucide-react';
import CommonFormFields from '../CommonFormFields';
import SocialGiftingToggle from '../SocialGiftingToggle';
import FormSection from '../FormSection';
import SmartInput from '../SmartInput';

export default function KamlimosForm({ 
  formData, 
  onInputChange, 
  isBracelet = false,
  onSocialGiftingChange,
  contributions = []
}) {
  return (
    <div className="space-y-6">
      {/* Haupt-Informationen */}
      <FormSection 
        title="Geschenk-Details" 
        description="Wer schenkt was wem?"
        badge="Wichtig"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SmartInput
            label="Titel"
            description="Erste Zeile auf dem Cover"
            icon={<MessageSquare className="w-4 h-4" />}
          >
            <input
              type="text"
              name="headline"
              value={formData.headline}
              onChange={onInputChange}
              className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
              placeholder="Für die beste Mama"
            />
          </SmartInput>

          <SmartInput
            label="Empfänger"
            description="Wer beschenkt wird?"
            icon={<User className="w-4 h-4" />}
          >
            <input
              type="text"
              name="recipientName"
              value={formData.recipientName}
              onChange={onInputChange}
              className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
              placeholder="Mama"
            />
          </SmartInput>

          <SmartInput
            label="Absender"
            description="Wer schenkt?"
            icon={<User className="w-4 h-4" />}
          >
            <input
              type="text"
              name="senderName"
              value={formData.senderName}
              onChange={onInputChange}
              className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
              placeholder="Dein Name"
            />
          </SmartInput>

          <SmartInput
            label="Untertitel"
            description="Zweite Zeile auf dem Cover"
            icon={<MessageSquare className="w-4 h-4" />}
          >
            <input
              type="text"
              name="subheadline"
              value={formData.subheadline}
              onChange={onInputChange}
              className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
              placeholder="Zu deinem Geburtstag"
            />
          </SmartInput>
        </div>
      </FormSection>

      {/* Produkt-spezifische Optionen */}
      {isBracelet ? (
        <FormSection 
          title="Armband-Personalisierung" 
          description="Text und Bedeutung für das Armband"
          badge="Personalisiert"
        >
          <div className="space-y-4">
            <SmartInput
              label="Gravur Text"
              description="Max. 30 Zeichen für die Gravur"
              icon={<MessageSquare className="w-4 h-4" />}
            >
              <input
                type="text"
                name="engravingText"
                value={formData.engravingText}
                onChange={onInputChange}
                className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                placeholder="In der Stille liegt die Kraft"
                maxLength={30}
              />
            </SmartInput>

            <SmartInput
              label="Bedeutung (Markdown)"
              description="Die Geschichte hinter dem Text"
              icon={<MessageSquare className="w-4 h-4" />}
            >
              <textarea
                name="meaningText"
                value={formData.meaningText}
                onChange={onInputChange}
                rows="5"
                className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm font-mono"
                placeholder="Dieser Spruch erinnert daran..."
              />
            </SmartInput>
          </div>
        </FormSection>
      ) : (
        /* Tassen-spezifische Optionen */
        <FormSection 
          title="Tassen-Optionen" 
          description="PIN-Code und Animation für die Tasse"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SmartInput
              label="PIN Code"
              description="Optional: Wird dem Käufer vorausgefüllt"
              icon={<Settings className="w-4 h-4" />}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  name="accessCode"
                  value={formData.accessCode}
                  onChange={onInputChange}
                  className="block flex-1 border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                  placeholder="z.B. LUNA"
                />
                <button
                  type="button"
                  onClick={() => {
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
                    onInputChange({ target: { name: 'accessCode', value: code } });
                  }}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-300 transition-colors text-sm font-medium whitespace-nowrap"
                  title="Zufälligen PIN generieren"
                >
                  ✨ Generieren
                </button>
              </div>
            </SmartInput>

            <SmartInput
              label="Öffnungs-Animation"
              description="Effekt beim Öffnen des Geschenks"
              icon={<Settings className="w-4 h-4" />}
            >
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
            </SmartInput>
          </div>
        </FormSection>
      )}

      {/* Erweiterte Optionen */}
      <FormSection 
        title="Erweiterte Optionen" 
        description="Zusätzliche Features und Einstellungen"
        defaultOpen={false}
      >
        {/* Customer Engraving Toggle - Only for Mugs */}
        {!isBracelet && (
          <div className="mb-6">
            <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <input
                type="checkbox"
                id="allowCustomerEngraving"
                name="allowCustomerEngraving"
                checked={formData.allowCustomerEngraving}
                onChange={(e) =>
                  onInputChange({
                    target: {
                      name: 'allowCustomerEngraving',
                      value: e.target.checked,
                    },
                  })
                }
                className="h-5 w-5 text-rose-600 rounded focus:ring-rose-500 border-gray-300"
              />
              <div>
                <label
                  htmlFor="allowCustomerEngraving"
                  className="font-medium text-stone-900 block cursor-pointer"
                >
                  Gravurtext vom Kunden erlauben
                </label>
                <p className="text-xs text-stone-500 leading-relaxed mt-1">
                  Wenn aktiv, sieht der Käufer im Setup ein Feld für Gravurtext (z.B. Tassenboden). 
                  Dein Eintrag dient als Vorgabe; der Kunde kann ihn ändern.
                </p>
              </div>
            </div>

            {/* Admin Engraving Text – nur sichtbar wenn Checkbox aktiv */}
            {formData.allowCustomerEngraving && (
              <div className="mt-4">
                <SmartInput
                  label="Gravur Text (Vorgabe)"
                  description="Dein Vorschlag für den Kunden"
                  icon={<MessageSquare className="w-4 h-4" />}
                >
                  <input
                    type="text"
                    name="engravingText"
                    value={formData.engravingText || ""}
                    onChange={onInputChange}
                    className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                    placeholder="Für die beste Oma"
                    maxLength={30}
                  />
                </SmartInput>
              </div>
            )}
          </div>
        )}

        {/* Social Gifting */}
        <SocialGiftingToggle
          checked={formData.allowContributions}
          onChange={(e) => onSocialGiftingChange(e.target.checked)}
          contributions={contributions}
          showContributions={formData.allowContributions}
        />
      </FormSection>

      {/* Bestell-Informationen */}
      <FormSection 
        title="Bestell-Informationen" 
        description="Kunden- und Bestelldaten für die Abwicklung"
        icon={<Users className="w-4 h-4" />}
      >
        <CommonFormFields 
          formData={formData} 
          onInputChange={onInputChange}
          showTimeCapsule={true}
          showAccessCode={false}
          showOpeningAnimation={false}
        />
      </FormSection>
    </div>
  );
}
