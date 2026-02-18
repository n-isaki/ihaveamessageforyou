import React from 'react';

export default function SocialGiftingToggle({ 
  checked, 
  onChange, 
  contributions = [],
  showContributions = false 
}) {
  return (
    <>
      {/* Social Gifting Toggle */}
      <div className="col-span-2 md:col-span-2 border-t border-stone-100 pt-4 mt-2">
        <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
          <input
            type="checkbox"
            id="allowContributions"
            name="allowContributions"
            checked={checked}
            onChange={onChange}
            className="h-5 w-5 text-rose-600 rounded focus:ring-rose-500 border-gray-300"
          />
          <div>
            <label
              htmlFor="allowContributions"
              className="font-medium text-stone-900 block cursor-pointer"
            >
              Social Gifting aktivieren (Freunde einladen)
            </label>
            <p className="text-xs text-stone-500 leading-relaxed mt-1">
              Wenn aktiv, kann der Käufer einen Link teilen,
              über den Freunde Nachrichten hinterlassen
              können. Diese Nachrichten erscheinen dann
              zusammen mit dem Hauptgeschenk, wenn der
              Empfänger den Code scannt.
            </p>
          </div>
        </div>
      </div>

      {/* Eingegangene Beiträge */}
      {showContributions && contributions.length > 0 && (
        <div className="col-span-2 md:col-span-2 border-t border-stone-100 pt-4 mt-2">
          <h4 className="text-sm font-medium text-stone-700 mb-2">
            Eingegangene Nachrichten ({contributions.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50 p-3">
            {contributions.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-stone-200 rounded-lg p-3 text-sm"
              >
                <div className="font-medium text-stone-800">{c.author || "Gast"}</div>
                <p className="text-stone-600 mt-0.5">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
