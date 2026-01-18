import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getGiftById, updateGift, markSetupAsStarted } from '../services/gifts';
import WizardMessageEditor from '../modules/anima/experiences/multimedia-gift/components/WizardMessageEditor';
import { Loader, Lock, CheckCircle, Save, Info, ShieldAlert, X, HelpCircle, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerSetup() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const navigate = useNavigate();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [saving, setSaving] = useState(false);
    const [locked, setLocked] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const data = await getGiftById(id);
                if (data) {
                    // Security Check
                    if (data.productType !== 'bracelet' && data.securityToken && data.securityToken !== token) {
                        setAccessDenied(true);
                        setLoading(false);
                        return;
                    }

                    setGift(data);
                    setMessages(data.messages || []);
                    setLocked(!!data.locked);

                    // Track that customer opened the link
                    if (!data.setupStarted && !data.locked) {
                        markSetupAsStarted(id);
                    }
                }
            } catch (err) {
                console.error("Failed to load gift", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id, token]);

    const handleAddMessage = (type) => {
        if (locked) return;
        setMessages([...messages, {
            id: uuidv4(),
            type,
            content: '',
            author: gift.senderName || ''
        }]);
    };

    const handleRemoveMessage = (msgId) => {
        if (locked) return;
        setMessages(messages.filter(m => m.id !== msgId));
    };

    const handleUpdateMessage = (msgId, field, value) => {
        if (locked) return;
        setMessages(messages.map(m => m.id === msgId ? { ...m, [field]: value } : m));
    };

    const handleSaveAndLockClick = () => {
        setShowConfirmModal(true);
    };

    const confirmSave = async () => {
        setSaving(true);
        setShowConfirmModal(false); // Close modal, start saving spinner
        try {
            await updateGift(id, {
                messages,
                locked: true,
                setupCompletedAt: new Date()
            });
            setLocked(true);
            setGift(prev => ({ ...prev, locked: true }));
        } catch (err) {
            console.error("Failed to save", err);
            // Permissions error handling improved by rules update
            alert("Fehler beim Speichern. Bitte überprüfe deine Internetverbindung.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-stone-950"><Loader className="animate-spin text-stone-500" /></div>;
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-stone-900 rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-red-900/50">
                    <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-serif font-bold text-stone-100">Zugriff verweigert</h1>
                    <p className="text-stone-400">
                        Der Link ist ungültig oder unvollständig.
                    </p>
                </div>
            </div>
        );
    }

    if (!gift) {
        return <div className="min-h-screen flex items-center justify-center p-8 bg-stone-950 text-stone-500">Geschenk nicht gefunden.</div>;
    }

    // LOCKED VIEW
    if (locked) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-stone-900/50 backdrop-blur-md rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-stone-800">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Vielen Dank!</h1>
                        <p className="text-stone-400 leading-relaxed">
                            Deine Inhalte wurden erfolgreich gespeichert.<br />
                            Wir beginnen nun mit der Veredelung deines Geschenks.
                        </p>
                    </div>
                    <div className="bg-stone-950/50 p-4 rounded-xl border border-stone-800 text-sm text-stone-500">
                        <p>Status: <span className="font-bold text-stone-300">In Produktion</span></p>
                    </div>
                </div>
            </div>
        );
    }

    // EDITING VIEW - DARK LUXURY MODE
    return (
        <div className="min-h-screen bg-stone-950 text-stone-200 pb-32 font-sans selection:bg-rose-500/30">
            {/* Header */}
            <div className="bg-stone-950/80 backdrop-blur-md border-b border-stone-800 sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
                <div className="mx-auto">
                    <span className="font-serif text-2xl tracking-widest text-white uppercase">Kamlimos</span>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-6 space-y-8 mt-4">

                {/* Greeting Card */}
                <div className="bg-gradient-to-br from-stone-900 to-stone-900/50 p-8 rounded-3xl shadow-xl border border-stone-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                    <h1 className="text-3xl font-serif font-bold mb-3 text-white">Hallo {gift.customerName || gift.senderName || 'Gast'},</h1>
                    <p className="text-stone-400 leading-relaxed">
                        Hier kannst du deinem Geschenk <strong>"{gift.personalizationText || 'Unvergesslich'}"</strong> Leben einhauchen.
                        Füge persönliche Videos, Bilder oder Texte hinzu, die beim Scannen erscheinen sollen.
                    </p>

                    {gift.personalizationText && (
                        <div className="mt-6 p-4 bg-stone-950/50 rounded-xl text-sm border border-stone-800 flex items-start gap-3">
                            <Info className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
                            <div>
                                <span className="block font-bold text-stone-500 text-xs uppercase tracking-wider mb-1">Etsy Gravur/Text</span>
                                <span className="text-stone-200 font-medium text-base font-serif italic">"{gift.personalizationText}"</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Editor */}
                <div className="bg-stone-900 p-1 rounded-3xl shadow-xl border border-stone-800">
                    <div className="bg-stone-950/50 p-6 rounded-[20px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold font-serif text-white">Deine Inhalte</h2>
                            <div className="flex items-center text-xs text-stone-500 bg-stone-900 px-3 py-1 rounded-full border border-stone-800">
                                <HelpCircle className="w-3 h-3 mr-1.5" />
                                <span>Multimedia Inhalte</span>
                            </div>
                        </div>

                        <WizardMessageEditor
                            messages={messages}
                            onAdd={handleAddMessage}
                            onRemove={handleRemoveMessage}
                            onUpdate={handleUpdateMessage}
                            widgetMode={false}
                            darkMode={true}
                        />
                    </div>
                </div>

                <div className="text-center text-xs text-stone-600 pb-20 px-10 leading-relaxed">
                    <Lock className="inline h-3 w-3 mr-1 mb-0.5" />
                    <span>Nach dem Absenden wird das Geschenk finalisiert und kann nicht mehr bearbeitet werden.</span>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-stone-950/90 backdrop-blur-xl border-t border-stone-800 flex justify-center z-30">
                <button
                    onClick={handleSaveAndLockClick}
                    disabled={saving || messages.length === 0}
                    className={`
                        w-full max-w-md flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all
                        ${messages.length === 0
                            ? 'bg-stone-900 text-stone-600 cursor-not-allowed border border-stone-800'
                            : 'bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white shadow-rose-900/20 border border-rose-500/20'
                        }
                    `}
                >
                    {saving ? (
                        <Loader className="h-6 w-6 animate-spin text-white/50" />
                    ) : (
                        <>
                            <span>Geschenk Versiegeln</span>
                            <Save className="h-5 w-5 opacity-80" />
                        </>
                    )}
                </button>
            </div>

            {/* Elegant Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-stone-900 rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-stone-800 relative overflow-hidden"
                        >
                            {/* Ambient Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-rose-600/10 blur-[50px] pointer-events-none"></div>

                            <button onClick={() => setShowConfirmModal(false)} className="absolute top-4 right-4 text-stone-600 hover:text-white transition-colors">
                                <X className="h-6 w-6" />
                            </button>

                            <div className="relative text-center space-y-6">
                                <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto ring-1 ring-white/10">
                                    <Lock className="h-7 w-7 text-rose-500" />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-serif font-bold text-white mb-2">Bist du fertig?</h3>
                                    <p className="text-stone-400 text-sm leading-relaxed">
                                        Wenn du jetzt speicherst, wird dein Geschenk <strong>versiegelt</strong>. Änderungen sind danach nicht mehr möglich.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        onClick={confirmSave}
                                        className="w-full py-3.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/20"
                                    >
                                        Ja, jetzt versiegeln
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmModal(false)}
                                        className="w-full py-3.5 bg-transparent border border-stone-800 text-stone-400 font-medium rounded-xl hover:bg-stone-800 hover:text-white transition-colors"
                                    >
                                        Noch bearbeiten
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
