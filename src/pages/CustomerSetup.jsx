
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getGiftById, updateGift, markSetupAsStarted } from '../services/gifts';
import WizardMessageEditor from '../modules/anima/experiences/multimedia-gift/components/WizardMessageEditor';
import { Loader, Lock, CheckCircle, Save, Info, ShieldAlert, X, HelpCircle, Eye, Edit2, Upload, User, Calendar, FileText } from 'lucide-react';
import MugViewer from '../modules/anima/experiences/multimedia-gift/pages/Viewer';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebase";
import { signInAnonymously } from "firebase/auth";

export default function CustomerSetup() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [saving, setSaving] = useState(false);
    const [locked, setLocked] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [headline, setHeadline] = useState('');
    const [subheadline, setSubheadline] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Memoria Specific State
    const [memoriaData, setMemoriaData] = useState({
        deceasedName: '',
        lifeDates: '',
        meaningText: '',
        imageFile: null,
        imagePreview: null
    });

    useEffect(() => {
        const init = async () => {
            try {
                await signInAnonymously(auth); // Auth needed for Storage
                const data = await getGiftById(id);
                if (data) {
                    if (data.productType !== 'bracelet' && data.securityToken && data.securityToken !== token) {
                        setAccessDenied(true);
                        setLoading(false);
                        return;
                    }

                    setGift(data);
                    setMessages(data.messages || []);
                    setLocked(!!data.locked);
                    setHeadline(data.headline || '');
                    setSubheadline(data.subheadline || '');

                    // Memoria Init
                    if (data.project === 'memoria') {
                        setMemoriaData({
                            deceasedName: data.deceasedName || '',
                            lifeDates: data.lifeDates || '',
                            meaningText: data.meaningText || '',
                            imagePreview: data.deceasedImage || null,
                            imageFile: null
                        });
                    }

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

    const handleMemoriaImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMemoriaData({
                ...memoriaData,
                imageFile: file,
                imagePreview: URL.createObjectURL(file)
            });
        }
    };

    const handleSaveAndLockClick = () => {
        setShowConfirmModal(true);
    };

    const confirmSave = async () => {
        setSaving(true);
        setShowConfirmModal(false);
        try {
            const updates = {
                locked: true,
                setupCompletedAt: new Date()
            };

            if (gift.project === 'memoria') {
                updates.deceasedName = memoriaData.deceasedName;
                updates.lifeDates = memoriaData.lifeDates;
                updates.meaningText = memoriaData.meaningText;

                if (memoriaData.imageFile) {
                    const storageRef = ref(storage, `memoria/${id}/${Date.now()}_${memoriaData.imageFile.name}`);
                    await uploadBytes(storageRef, memoriaData.imageFile);
                    updates.deceasedImage = await getDownloadURL(storageRef);
                }
            } else {
                updates.messages = messages;
                updates.headline = headline;
                updates.subheadline = subheadline;
            }

            await updateGift(id, updates);
            setLocked(true);
            setGift(prev => ({ ...prev, locked: true }));
        } catch (err) {
            console.error("Failed to save", err);
            alert("Fehler beim Speichern. Bitte überprüfe deine Internetverbindung.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-950"><Loader className="animate-spin text-stone-500" /></div>;

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-stone-900 rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-red-900/50">
                    <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
                    <h1 className="text-xl font-serif font-bold text-stone-100">Zugriff verweigert</h1>
                    <p className="text-stone-400">Der Link ist ungültig.</p>
                </div>
            </div>
        );
    }

    if (!gift) return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-500">Geschenk nicht gefunden.</div>;

    if (locked) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-stone-900/50 backdrop-blur-md rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-stone-800">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Vielen Dank!</h1>
                        <p className="text-stone-400 leading-relaxed">Wir beginnen nun mit der Veredelung deines Geschenks.</p>
                    </div>
                </div>
            </div>
        );
    }

    // MEMORIA SETUP
    if (gift.project === 'memoria') {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-200 pb-32 font-sans">
                <div className="bg-stone-950/80 backdrop-blur-md border-b border-stone-800 sticky top-0 z-20 px-6 py-4">
                    <span className="font-serif text-2xl tracking-widest text-white uppercase">Memoria</span>
                </div>

                <div className="max-w-xl mx-auto p-6 space-y-8 mt-4">
                    <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-6">
                        <h2 className="text-xl font-bold font-serif text-white mb-4">Erinnerung teilen</h2>

                        <div>
                            <label className="block text-xs uppercase font-bold text-stone-500 mb-2 flex items-center"><User className="w-4 h-4 mr-2" /> Name des Verstorbenen</label>
                            <input
                                type="text"
                                value={memoriaData.deceasedName}
                                onChange={e => setMemoriaData({ ...memoriaData, deceasedName: e.target.value })}
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-stone-600 outline-none"
                                placeholder="Vorname Nachname"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase font-bold text-stone-500 mb-2 flex items-center"><Calendar className="w-4 h-4 mr-2" /> Lebensdaten</label>
                            <input
                                type="text"
                                value={memoriaData.lifeDates}
                                onChange={e => setMemoriaData({ ...memoriaData, lifeDates: e.target.value })}
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-stone-600 outline-none"
                                placeholder="geb. 01.01.1950 - gest. 10.12.2024"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase font-bold text-stone-500 mb-2 flex items-center"><FileText className="w-4 h-4 mr-2" /> Deine Geschichte (für Audio & Text)</label>
                            <textarea
                                rows={6}
                                value={memoriaData.meaningText}
                                onChange={e => setMemoriaData({ ...memoriaData, meaningText: e.target.value })}
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-stone-600 outline-none"
                                placeholder="Erzähle uns etwas über die Person..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase font-bold text-stone-500 mb-2 flex items-center"><Upload className="w-4 h-4 mr-2" /> Foto (für Gravur)</label>
                            <div className="border-2 border-dashed border-stone-800 rounded-xl p-6 text-center hover:border-stone-600 transition-colors cursor-pointer relative">
                                <input type="file" onChange={handleMemoriaImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                {memoriaData.imagePreview ? (
                                    <div className="relative h-40 w-full">
                                        <img src={memoriaData.imagePreview} className="h-full w-full object-contain rounded-lg" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                            <span className="text-white text-sm font-bold">Ändern</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="bg-stone-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                            <Upload className="w-6 h-6 text-stone-400" />
                                        </div>
                                        <p className="text-sm text-stone-400">Bild hochladen</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-6 bg-stone-950/90 backdrop-blur-xl border-t border-stone-800 flex justify-center z-30">
                    <button
                        onClick={handleSaveAndLockClick}
                        disabled={saving}
                        className="w-full max-w-md flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-bold text-lg bg-stone-100 text-stone-900 hover:bg-white transition-colors"
                    >
                        {saving ? <Loader className="animate-spin" /> : <span>Absenden & Versiegeln</span>}
                    </button>
                </div>

                <AnimatePresence>
                    {showConfirmModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-stone-900 rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-stone-800 relative overflow-hidden"
                            >
                                <button onClick={() => setShowConfirmModal(false)} className="absolute top-4 right-4 text-stone-600 hover:text-white transition-colors">
                                    <X className="h-6 w-6" />
                                </button>
                                <div className="text-center space-y-6">
                                    <Lock className="h-10 w-10 text-stone-100 mx-auto" />
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold text-white mb-2">Versiegeln?</h3>
                                        <p className="text-stone-400 text-sm">Änderungen sind danach nicht mehr möglich.</p>
                                    </div>
                                    <button onClick={confirmSave} className="w-full py-3.5 bg-stone-100 text-stone-900 font-bold rounded-xl hover:bg-white">Ja, Versiegeln</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ORIGINAL MUG SETUP VIEW (Fallback)
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
                {/* Intro Screen Editor */}
                <div className="bg-gradient-to-br from-stone-900 to-stone-900/50 p-8 rounded-3xl shadow-xl border border-stone-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold font-serif text-white flex items-center">
                            <Edit2 className="w-5 h-5 mr-2 text-rose-500" />
                            1. Start-Bildschirm
                        </h2>
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex items-center px-4 py-2 bg-stone-800 hover:bg-rose-600 rounded-lg text-sm font-medium text-white transition-colors shadow-lg border border-stone-700 group"
                        >
                            <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                            Live Vorschau
                        </button>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2 block flex items-center">
                                Titel (z.B. Von Herzen)
                                <Info className="h-3 w-3 ml-2 text-stone-600" />
                            </label>
                            <input
                                type="text"
                                value={headline}
                                onChange={e => setHeadline(e.target.value)}
                                placeholder="Von Herzen für dich"
                                className="w-full bg-stone-950/50 border border-stone-800 rounded-xl p-4 text-2xl font-serif text-white placeholder-stone-700 focus:ring-2 focus:ring-rose-500/50 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2 block">Untertitel / Absender</label>
                            <input
                                type="text"
                                value={subheadline}
                                onChange={e => setSubheadline(e.target.value)}
                                placeholder={`Eine Botschaft von ${gift.senderName || gift.customerName}`}
                                className="w-full bg-stone-950/50 border border-stone-800 rounded-xl p-4 text-base text-stone-300 placeholder-stone-700 focus:ring-2 focus:ring-rose-500/50 outline-none transition-all"
                            />
                        </div>

                        {gift.personalizationText && (
                            <div className="mt-4 p-4 bg-stone-950/50 rounded-xl text-sm border border-stone-800 flex items-start gap-3">
                                <Info className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="block font-bold text-stone-500 text-xs uppercase tracking-wider mb-1">Deine Etsy Gravur</span>
                                    <span className="text-stone-200 font-medium text-base font-serif italic">"{gift.personalizationText}"</span>
                                </div>
                            </div>
                        )}
                    </div>
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

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <div className="fixed inset-0 z-[100] bg-black">
                        <button
                            onClick={() => setShowPreview(false)}
                            className="fixed top-6 right-6 z-[110] bg-stone-900/80 backdrop-blur text-white p-3 rounded-full hover:bg-rose-600 transition-colors border border-stone-700 hover:scale-110 shadow-xl"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <div className="h-full w-full overflow-y-auto">
                            <MugViewer initialData={{ ...gift, headline, subheadline, messages }} />
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
