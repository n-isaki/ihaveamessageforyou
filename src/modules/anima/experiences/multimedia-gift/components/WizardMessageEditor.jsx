import React from 'react';
import { Trash2, MessageSquare, Video, Image as ImageIcon } from 'lucide-react';

export default function WizardMessageEditor({ messages, onAdd, onRemove, onUpdate, widgetMode, darkMode = false }) {

    const theme = {
        bg: darkMode ? 'bg-stone-900' : 'bg-white',
        cardBg: darkMode ? 'bg-stone-900/50' : 'bg-white',
        border: darkMode ? 'border-stone-800' : 'border-stone-200',
        text: darkMode ? 'text-stone-200' : 'text-stone-800',
        subText: darkMode ? 'text-stone-500' : 'text-stone-400',
        input: darkMode ? 'bg-stone-950 border-stone-800 text-stone-200 focus:bg-stone-900' : 'bg-white border-stone-200 text-stone-700 focus:bg-white',
        btnSecondary: darkMode ? 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800' : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-white hover:shadow-sm',
    };

    const styles = {
        input: `w-full p-3 rounded-lg border focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all resize-none shadow-sm ${theme.input} ${theme.border}`,
        inputSm: `w-full p-2 rounded-lg border focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm mb-2 ${theme.input} ${theme.border}`,
        btnSmall: "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center"
    };

    return (
        <div className="space-y-4">
            {!widgetMode && <h2 className={`text-2xl font-bold font-serif ${theme.text}`}>Inhalte hinzufügen</h2>}
            <div className="flex flex-wrap gap-2">
                <button onClick={() => onAdd('text')} className={`${styles.btnSmall} ${theme.btnSecondary}`}>
                    <MessageSquare className="h-4 w-4 mr-1" /> Text
                </button>
                <button onClick={() => onAdd('video')} className={`${styles.btnSmall} ${theme.btnSecondary}`}>
                    <Video className="h-4 w-4 mr-1" /> Video
                </button>
                <button onClick={() => onAdd('image')} className={`${styles.btnSmall} ${theme.btnSecondary}`}>
                    <ImageIcon className="h-4 w-4 mr-1" /> Bild
                </button>
            </div>

            <div className="space-y-4 mt-4">
                {messages.map((msg, index) => (
                    <div key={msg.id} className={`${theme.cardBg} p-4 rounded-xl border ${theme.border} shadow-sm relative group hover:shadow-md transition-shadow`}>
                        <button
                            onClick={() => onRemove(msg.id)}
                            className="absolute top-2 right-2 p-1 text-stone-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-red-500/10 rounded-full"
                            title="Löschen"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="flex justify-between items-center mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${msg.type === 'video' ? 'bg-red-500/10 text-red-500' :
                                msg.type === 'image' ? 'bg-blue-500/10 text-blue-500' :
                                    darkMode ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-600'
                                }`}>
                                {msg.type === 'video' ? 'Video' : msg.type === 'image' ? 'Bild' : 'Text'}
                            </span>
                        </div>

                        {/* Author Input */}
                        <div className="mb-3">
                            <label className={`block text-xs font-bold ${theme.subText} uppercase mb-1`}>Von</label>
                            <input
                                type="text"
                                value={msg.author}
                                onChange={(e) => onUpdate(msg.id, 'author', e.target.value)}
                                className={styles.inputSm + " border-b border-t-0 border-x-0 rounded-none px-0 " + theme.border}
                                placeholder="Name des Absenders"
                            />
                        </div>

                        {/* Content Input */}
                        <div>
                            <label className={`block text-xs font-bold ${theme.subText} uppercase mb-1`}>
                                {msg.type === 'video' ? 'YouTube / Video Link' :
                                    msg.type === 'image' ? 'Bild URL' :
                                        msg.type === 'link' ? 'Link URL' : 'Nachricht'}
                            </label>
                            {msg.type === 'text' ? (
                                <textarea
                                    value={msg.content}
                                    onChange={(e) => onUpdate(msg.id, 'content', e.target.value)}
                                    className={styles.input}
                                    rows="3"
                                    placeholder="Nachricht eingeben..."
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={msg.content}
                                    onChange={(e) => onUpdate(msg.id, 'content', e.target.value)}
                                    className={styles.input}
                                    placeholder={msg.type === 'video' ? 'https://youtube.com/...' : 'https://...'}
                                />
                            )}
                        </div>
                    </div>
                ))}
                {!widgetMode && messages.length === 0 && (
                    <div className={`text-center py-8 border-2 border-dashed ${theme.border} rounded-xl`}>
                        <MessageSquare className={`h-8 w-8 ${theme.subText} mx-auto mb-2`} />
                        <p className={`${theme.subText} text-sm italic`}>Noch keine Inhalte hinzugefügt.</p>
                        <p className={`${theme.subText} text-xs mt-1 opacity-70`}>Klicke oben auf die Buttons.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
