import React from 'react';
import AudioUpload from '../AudioUpload';
import CommonFormFields from '../CommonFormFields';

export default function AudioForm({ formData, onInputChange, uploadingRecitation, onAudioUpload }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Titel (Headline)
        </label>
        <input
          type="text"
          name="headline"
          value={formData.headline}
          onChange={onInputChange}
          className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="z.B. Eine Nachricht für dich"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Nachricht (Text)
        </label>
        <textarea
          name="meaningText"
          value={formData.meaningText}
          onChange={onInputChange}
          rows="5"
          className="block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Hier können Sie eine kurze Nachricht oder Beschreibung hinterlassen..."
        />
      </div>

      {/* AUDIO */}
      <AudioUpload
        label="Audio Datei (MP3/WAV)"
        uploading={uploadingRecitation}
        audioUrl={formData.audioUrl}
        onUpload={(e) => onAudioUpload(e, "recitation")}
      />

      {/* Basic Metadata (hidden or simple) */}
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
