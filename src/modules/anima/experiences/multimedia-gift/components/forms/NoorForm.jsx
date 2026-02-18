import React from 'react';
import AudioUpload from '../AudioUpload';
import CommonFormFields from '../CommonFormFields';

export default function NoorForm({ formData, onInputChange, uploadingRecitation, uploadingMeaning, onAudioUpload }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Titel des Bittgebets (z.B. Für Erfolg)
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={onInputChange}
          className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
          placeholder="Titel..."
        />
      </div>

      {/* AUDIO 1: RECITATION */}
      <AudioUpload
        label="1. Audio: Rezitation (Arabisch)"
        uploading={uploadingRecitation}
        audioUrl={formData.audioUrl}
        onUpload={(e) => onAudioUpload(e, "recitation")}
        bgColor="bg-emerald-50"
        borderColor="border-emerald-100"
        textColor="text-emerald-700"
      />

      {/* AUDIO 2: MEANING */}
      <AudioUpload
        label="2. Audio: Bedeutung/Story (Deutsch)"
        description="Optional: Läuft im Abschnitt der Bedeutung."
        uploading={uploadingMeaning}
        audioUrl={formData.meaningAudioUrl}
        onUpload={(e) => onAudioUpload(e, "meaning")}
      />

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Bedeutung Text (Markdown)
        </label>
        <textarea
          name="meaningText"
          value={formData.meaningText}
          onChange={onInputChange}
          rows="5"
          className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm font-mono"
          placeholder="Erklärung hier..."
        />
      </div>

      {/* Basic Metadata */}
      <CommonFormFields 
        formData={formData} 
        onInputChange={onInputChange}
        showTimeCapsule={false}
        showAccessCode={false}
        showOpeningAnimation={false}
      />
    </div>
  );
}
