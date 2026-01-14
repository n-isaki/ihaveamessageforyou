import React from 'react';
import { Trash2, MessageSquare, Video, Image as ImageIcon } from 'lucide-react';

export default function WizardMessageEditor({ messages, onAdd, onRemove, onUpdate }) {
    // Styles reused from Wizard or passed down? 
    // Copied for simplicity to make component self-contained
    const styles = {
        input: "w-full p-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all resize-none shadow-sm text-stone-700",
        inputSm: "w-full p-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm mb-2",
        btnSmall: "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center"
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold font-serif text-stone-800">Inhalte hinzufügen</h2>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => onAdd('text')} className={styles.btnSmall + " bg-stone-100 text-stone-700 border border-stone-200 hover:bg-white hover:shadow-sm"}>
                    <MessageSquare className="h-4 w-4 mr-1" /> Text
                </button>
                <button onClick={() => onAdd('video')} className={styles.btnSmall + " bg-stone-100 text-stone-700 border border-stone-200 hover:bg-white hover:shadow-sm"}>
                    <Video className="h-4 w-4 mr-1" /> Video
                </button>
                <button onClick={() => onAdd('image')} className={styles.btnSmall + " bg-stone-100 text-stone-700 border border-stone-200 hover:bg-white hover:shadow-sm"}>
                    <ImageIcon className="h-4 w-4 mr-1" /> Bild
                </button>
            </div>

            <div className="space-y-4 mt-4">
                {messages.map((msg, index) => (
                    <div key={msg.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative group hover:shadow-md transition-shadow">
                        <button
                            onClick={() => onRemove(msg.id)}
                            className="absolute top-2 right-2 p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-red-50 rounded-full"
                            title="Löschen"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="flex justify-between items-center mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${msg.type === 'video' ? 'bg-red-50 text-red-600' :
                                    msg.type === 'image' ? 'bg-blue-50 text-blue-600' :
                                        'bg-stone-100 text-stone-600'
                                }`}>
                                {msg.type === 'video' ? 'Video' : msg.type === 'image' ? 'Bild' : 'Text'}
                            </span>
                        </div>

                        {/* Author Input */}
                        <div className="mb-3">
                            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Von</label>
                            <input
                                type="text"
                                value={msg.author}
                                onChange={(e) => onUpdate(msg.id, 'author', e.target.value)}
                                className={styles.inputSm + " font-medium text-stone-900 border-b border-stone-200 bg-transparent focus:border-rose-500 rounded-none px-0"}
                                placeholder="Name des Absenders"
                            />
                        </div>

                        {/* Content Input */}
                        <div>
                            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">
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
                {messages.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-stone-200 rounded-xl">
                        <MessageSquare className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                        <p className="text-stone-400 text-sm italic">Noch keine Inhalte hinzugefügt.</p>
                        <p className="text-stone-300 text-xs mt-1">Klicke oben auf die Buttons.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
