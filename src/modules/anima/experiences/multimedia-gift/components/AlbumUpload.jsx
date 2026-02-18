import React from 'react';
import { Loader, ImageIcon, X } from 'lucide-react';
import { ALBUM_MAX_FILES } from '@/utils/security';

export default function AlbumUpload({ 
  albumImages = [], 
  uploading, 
  onUpload, 
  onRemoveImage,
  giftId 
}) {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-stone-900 mb-2 flex items-center">
        <ImageIcon className="h-5 w-5 mr-2 text-rose-600" />
        Album (bis zu {ALBUM_MAX_FILES} Bilder)
      </h3>
      <p className="text-sm text-stone-500 mb-4">
        JPG, PNG oder WebP, max. 5 MB pro Bild. Bilder werden
        automatisch verkleinert.
      </p>
      <div className="flex flex-wrap gap-3 items-start">
        {albumImages.map((url, index) => (
          <div key={url} className="relative group">
            <img
              src={url}
              alt=""
              className="w-20 h-20 object-cover rounded-lg border border-stone-300"
            />
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-90 group-hover:opacity-100 shadow"
              aria-label="Bild entfernen"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {albumImages.length < ALBUM_MAX_FILES && (
          <label className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-stone-500 hover:border-rose-400 hover:bg-rose-50/50 cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
            />
            {uploading ? (
              <Loader className="h-6 w-6 animate-spin" />
            ) : (
              <ImageIcon className="h-6 w-6 mb-0.5" />
            )}
            <span className="text-xs">Hinzufügen</span>
          </label>
        )}
      </div>
      {!giftId && albumImages.length === 0 && (
        <p className="text-xs text-stone-400 mt-2">
          Speichern Sie das Geschenk zuerst, dann können Sie
          hier Bilder hochladen.
        </p>
      )}
    </div>
  );
}
