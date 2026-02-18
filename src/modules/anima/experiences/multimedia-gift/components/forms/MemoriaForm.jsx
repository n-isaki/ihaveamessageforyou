import React from 'react';
import AudioUpload from '../AudioUpload';
import CommonFormFields from '../CommonFormFields';

export default function MemoriaForm({ formData, onInputChange, uploadingRecitation, onAudioUpload }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Name des Verstorbenen
          </label>
          <input
            type="text"
            name="deceasedName"
            value={formData.deceasedName}
            onChange={onInputChange}
            className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
            placeholder="z.B. Opa Hans"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Lebensdaten (Jahr - Jahr)
          </label>
          <input
            type="text"
            name="lifeDates"
            value={formData.lifeDates}
            onChange={onInputChange}
            className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
            placeholder="1950 - 2024"
          />
        </div>
      </div>

      {/* AUDIO (Recitation slot reused as Main Audio) */}
      <AudioUpload
        label="Audio Geschichte/Musik (Suno)"
        uploading={uploadingRecitation}
        audioUrl={formData.audioUrl}
        onUpload={(e) => onAudioUpload(e, "recitation")}
      />

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Geschichte / Text (Markdown)
        </label>
        <textarea
          name="meaningText"
          value={formData.meaningText}
          onChange={onInputChange}
          rows="8"
          className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm font-mono"
          placeholder="Hier die Geschichte des Verstorbenen schreiben..."
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

      {/* Gravierbild (vom Kunden im Setup hochgeladen) */}
      {formData.designImage && (
        <div className="pt-4 border-t border-stone-100">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Gravierbild (vom Kunden)
          </label>
          <div className="mt-2 flex items-center gap-4">
            <img
              src={formData.designImage}
              alt="Gravur"
              className="h-24 w-24 rounded-lg object-cover border border-stone-200"
            />
            <span className="text-sm text-stone-500">
              Wird für Gravur verwendet
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
