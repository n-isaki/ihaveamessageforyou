import React, { useState, useRef, useEffect } from "react";
import {
  Trash2,
  MessageSquare,
  Video,
  Image as ImageIcon,
  Plus,
} from "lucide-react";

export default function WizardMessageEditor({
  messages,
  onAdd,
  onRemove,
  onUpdate,
  widgetMode,
  darkMode = false,
}) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setAddMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const theme = {
    bg: darkMode ? "bg-stone-900" : "bg-white",
    cardBg: darkMode ? "bg-stone-900/50" : "bg-white",
    border: darkMode ? "border-stone-800" : "border-stone-200",
    text: darkMode ? "text-stone-200" : "text-stone-800",
    subText: darkMode ? "text-stone-500" : "text-stone-400",
    input: darkMode
      ? "bg-stone-950 border-stone-800 text-stone-200 focus:bg-stone-900"
      : "bg-white border-stone-200 text-stone-700 focus:bg-white",
    btnSecondary: darkMode
      ? "bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white"
      : "bg-stone-100 text-stone-700 border-stone-200 hover:bg-white hover:shadow-sm",
  };

  const styles = {
    input: `w-full p-3 sm:p-4 rounded-xl border focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/40 outline-none transition-all resize-none text-base leading-relaxed ${theme.input} ${theme.border}`,
    inputSm: `w-full p-2.5 rounded-lg border focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-base mb-2 leading-relaxed ${theme.input} ${theme.border}`,
  };

  const iconOnlyMode = !widgetMode && darkMode;
  const addOptions = [
    { type: "text", label: "Text", Icon: MessageSquare },
    { type: "video", label: "Video", Icon: Video },
    { type: "image", label: "Bild", Icon: ImageIcon },
  ];

  const handleAdd = (type) => {
    onAdd(type);
    setAddMenuOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Add row: icon-only (CustomerSetup) or classic (Wizard/widget) */}
      <div className="flex flex-wrap items-center gap-2">
        {iconOnlyMode ? (
          <>
            <div className="flex items-center gap-1.5">
              {/* eslint-disable-next-line no-unused-vars -- Icon used in JSX */}
              {addOptions.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAdd(type)}
                  className="flex items-center justify-center w-11 h-11 rounded-xl border border-stone-700 bg-stone-800/80 text-stone-400 hover:bg-stone-700 hover:text-white hover:border-stone-600 transition-all touch-manipulation"
                  title={label + " hinzufügen"}
                  aria-label={label + " hinzufügen"}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-[8px]" />
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setAddMenuOpen((o) => !o)}
                className="flex items-center justify-center w-11 h-11 rounded-xl border border-stone-600 bg-stone-800 text-rose-400/90 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400 transition-all touch-manipulation"
                title="Inhalt hinzufügen"
                aria-label="Inhalt hinzufügen"
                aria-expanded={addMenuOpen}
              >
                <Plus className="w-5 h-5" />
              </button>
              {addMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 py-1.5 min-w-[160px] rounded-xl border border-stone-700 bg-stone-900 shadow-xl z-20">
                  {/* eslint-disable-next-line no-unused-vars -- Icon used in JSX below */}
                  {addOptions.map(({ type, label, Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleAdd(type)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-base text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                    >
                      <Icon className="w-4 h-4 text-stone-500" />
                      {label} hinzufügen
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {!widgetMode && (
              <h2 className={`text-xl font-bold ${theme.text}`}>
                Inhalte hinzufügen
              </h2>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onAdd("text")}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${theme.btnSecondary} border ${theme.border}`}
              >
                <MessageSquare className="h-4 w-4" /> Text
              </button>
              <button
                onClick={() => onAdd("video")}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${theme.btnSecondary} border ${theme.border}`}
              >
                <Video className="h-4 w-4" /> Video
              </button>
              <button
                onClick={() => onAdd("image")}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${theme.btnSecondary} border ${theme.border}`}
              >
                <ImageIcon className="h-4 w-4" /> Bild
              </button>
            </div>
          </>
        )}
      </div>

      <div className="space-y-4 mt-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${theme.cardBg} p-4 sm:p-5 rounded-2xl border ${theme.border} relative group transition-shadow`}
          >
            <button
              onClick={() => onRemove(msg.id)}
              className="absolute top-3 right-3 p-1.5 text-stone-300 hover:text-red-400 opacity-100 transition-all z-10 hover:bg-red-500/10 rounded-lg"
              title="Löschen"
              aria-label="Löschen"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <div className="flex justify-between items-center mb-3">
              <span
                className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg ${msg.type === "video"
                    ? "bg-red-500/10 text-red-400"
                    : msg.type === "image"
                      ? "bg-blue-500/10 text-blue-400"
                      : darkMode
                        ? "bg-stone-800 text-stone-400"
                        : "bg-stone-100 text-stone-600"
                  }`}
              >
                {msg.type === "video"
                  ? "Video"
                  : msg.type === "image"
                    ? "Bild"
                    : "Text"}
              </span>
            </div>

            <div className="mb-3">
              <label
                className={`block text-sm font-medium ${theme.subText} mb-1.5`}
              >
                Von
              </label>
              <input
                type="text"
                value={msg.author}
                onChange={(e) => onUpdate(msg.id, "author", e.target.value)}
                className={
                  styles.inputSm +
                  " border-b border-t-0 border-x-0 rounded-none px-0 " +
                  theme.border
                }
                placeholder="Name des Absenders"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.subText} mb-1.5`}
              >
                {msg.type === "video"
                  ? "YouTube / Video-Link"
                  : msg.type === "image"
                    ? "Bild-URL"
                    : msg.type === "link"
                      ? "Link"
                      : "Nachricht"}
              </label>
              {msg.type === "text" ? (
                <textarea
                  value={msg.content}
                  onChange={(e) => onUpdate(msg.id, "content", e.target.value)}
                  className={styles.input}
                  rows={3}
                  placeholder="Nachricht eingeben..."
                />
              ) : (
                <input
                  type="text"
                  value={msg.content}
                  onChange={(e) => onUpdate(msg.id, "content", e.target.value)}
                  className={styles.input}
                  placeholder={
                    msg.type === "video"
                      ? "https://youtube.com/..."
                      : "https://..."
                  }
                />
              )}
            </div>
          </div>
        ))}
        {!widgetMode && messages.length === 0 && (
          <div
            className={`text-center py-10 border border-dashed ${theme.border} rounded-2xl`}
          >
            <MessageSquare
              className={`h-10 w-10 ${theme.subText} mx-auto mb-3 opacity-60`}
            />
            <p className={`${theme.subText} text-base`}>Noch keine Inhalte.</p>
            <p className={`${theme.subText} text-sm mt-1 opacity-80`}>
              Tippe auf die Symbole oben oder auf + um hinzuzufügen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
