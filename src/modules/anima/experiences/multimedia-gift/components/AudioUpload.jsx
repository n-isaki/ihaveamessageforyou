import React from 'react';
import { Loader, UploadCloud, FileAudio } from 'lucide-react';

export default function AudioUpload({ 
  label, 
  description, 
  uploading, 
  audioUrl, 
  onUpload, 
  accept = 'audio/*',
  bgColor = 'bg-stone-50',
  borderColor = 'border-stone-200',
  textColor = 'text-stone-700'
}) {
  return (
    <div className={`${bgColor} p-6 rounded-xl border ${borderColor}`}>
      <label className="block text-sm font-medium text-stone-700 mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-stone-500 mb-2">{description}</p>
      )}
      <div className="mt-2 flex items-center space-x-4">
        <label className="cursor-pointer flex items-center px-4 py-2 border border-stone-300 rounded-lg shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50">
          {uploading ? (
            <Loader className="animate-spin h-5 w-5" />
          ) : (
            <UploadCloud className="h-5 w-5 mr-2" />
          )}
          {uploading ? 'Lädt hoch...' : 'Datei wählen'}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={onUpload}
            disabled={uploading}
          />
        </label>

        {audioUrl ? (
          <div className={`flex items-center ${textColor} text-sm`}>
            <FileAudio className="h-5 w-5 mr-2" />
            <span>Vorhanden ✅</span>
            <audio
              src={audioUrl}
              controls
              className="ml-4 h-8"
            />
          </div>
        ) : (
          <span className="text-sm text-stone-400">
            Keine Datei ausgewählt
          </span>
        )}
      </div>
    </div>
  );
}
