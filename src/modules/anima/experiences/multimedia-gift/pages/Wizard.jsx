import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createGift, getGiftById, updateGift } from '@/services/gifts';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Trash2, Video, MessageSquare, ArrowRight, ArrowLeft, Save, Loader, Coffee, Watch, Music, FileAudio, UploadCloud, Zap, Heart, Image as ImageIcon, Menu } from 'lucide-react';
import WizardMessageEditor from '../components/WizardMessageEditor';
import AdminSidebar from '@/components/AdminSidebar';

export default function GiftWizard() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isEditMode = !!id;

    // Determine project mode from URL or default to standard behavior
    // If editing, we will set this based on fetched data
    const urlProjectMode = searchParams.get('project');

    const [step, setStep] = useState(1);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingRecitation, setUploadingRecitation] = useState(false);
    const [uploadingMeaning, setUploadingMeaning] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Common
        project: urlProjectMode || 'kamlimos', // 'kamlimos' | 'noor' | 'memoria' | 'ritual'
        productType: 'mug', // 'mug', 'bracelet', 'noor-audio', 'memory-card'
        recipientName: '',
        senderName: '',
        customerName: '',
        customerEmail: '',
        orderId: '',

        // Kamlimos Specific (Mug/Bracelet)
        accessCode: '',
        openingAnimation: 'none',
        messages: [],
        designImage: '',
        engravingText: '',
        meaningText: '',

        // Noor Specific
        title: '',       // e.g. "Dua für Verzeihung"
        arabicText: '',  // The Arabic script
        audioUrl: '',    // URL to MP3 in Storage (Recitation)
        meaningAudioUrl: '', // URL to MP3 in Storage (Meaning)
        transliteration: '', // Optional phonetic

        // Memoria Specific
        deceasedName: '',
        lifeDates: '', // e.g. "1954 - 2023"
    });

    useEffect(() => {
        if (isEditMode) {
            const fetchGift = async () => {
                try {
                    const data = await getGiftById(id);
                    if (data) {
                        setFormData({
                            project: data.project || 'kamlimos',
                            productType: data.productType || 'mug',
                            recipientName: data.recipientName || '',
                            senderName: data.senderName || '',
                            customerName: data.customerName || '',
                            customerEmail: data.customerEmail || '',
                            orderId: data.orderId || '',
                            accessCode: data.accessCode || '',
                            openingAnimation: data.openingAnimation || 'none',
                            messages: data.messages || [],
                            designImage: data.designImage || '',
                            engravingText: data.engravingText || '',
                            meaningText: data.meaningText || '',
                            // Noor
                            title: data.title || '',
                            arabicText: data.arabicText || '',
                            audioUrl: data.audioUrl || '',
                            meaningAudioUrl: data.meaningAudioUrl || '',
                            transliteration: data.transliteration || '',
                            // Memoria
                            deceasedName: data.deceasedName || '',
                            lifeDates: data.lifeDates || ''
                        });
                    } else {
                        setError("Geschenk nicht gefunden.");
                    }
                } catch (err) {
                    console.error("Failed to fetch gift for editing:", err);
                    setError("Fehler beim Laden des Geschenks.");
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchGift();
        } else {
            // New gift creation with preset project mode
            if (urlProjectMode === 'noor' || urlProjectMode === 'dua') {
                setFormData(prev => ({ ...prev, project: 'noor', productType: 'noor-audio' }));
            } else if (urlProjectMode === 'memoria') {
                setFormData(prev => ({ ...prev, project: 'memoria', productType: 'memory-card' }));
            } else if (urlProjectMode === 'ritual') {
                setFormData(prev => ({ ...prev, project: 'ritual', productType: 'bracelet' }));
            } else if (urlProjectMode === 'tasse') {
                setFormData(prev => ({ ...prev, project: 'kamlimos', productType: 'mug' }));
            }
        }
    }, [id, isEditMode, urlProjectMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAudioUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'recitation') setUploadingRecitation(true);
        else setUploadingMeaning(true);

        try {
            // Create a reference to 'audio/filename_timestamp'
            const storageRef = ref(storage, `noor-audio/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            if (type === 'recitation') {
                setFormData(prev => ({ ...prev, audioUrl: url }));
            } else {
                setFormData(prev => ({ ...prev, meaningAudioUrl: url }));
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert(`Upload Fehler: ${error.message}`);
        } finally {
            if (type === 'recitation') setUploadingRecitation(false);
            else setUploadingMeaning(false);
        }
    };

    const addMessage = (type) => {
        const newMessage = {
            id: Date.now(),
            type,
            author: formData.senderName || formData.customerName,
            content: ''
        };
        setFormData(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage]
        }));
    };

    const updateMessage = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
                msg.id === id ? { ...msg, [field]: value } : msg
            )
        }));
    };

    const removeMessage = (id) => {
        setFormData(prev => ({
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== id)
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            if (isEditMode) {
                await updateGift(id, formData);
            } else {
                const giftId = await createGift(formData);
                console.log("✅ Gift created successfully:", giftId);
                // Wait a bit to ensure Firestore has fully written the document
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            navigate(`/admin/dashboard?tab=${getDashboardTab()}`);
        } catch (err) {
            console.error("Failed to save gift:", err);
            setError(`Fehler: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getDashboardTab = () => {
        if (formData.project === 'noor' || formData.project === 'dua') return 'noor';
        if (formData.project === 'memoria') return 'memoria';
        if (formData.project === 'ritual' || formData.productType === 'bracelet') return 'ritual';
        return 'kamlimos';
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader className="h-8 w-8 animate-spin text-rose-600" />
            </div>
        );
    }

    // Styles
    const styles = {
        label: "block text-sm font-medium text-stone-700 mb-1",
        input: "block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm",
        textArea: "block w-full border border-stone-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm font-mono",
        inputSm: "block w-full border-none p-0 focus:ring-0 text-sm",
        btnPrimary: "inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-stone-900 hover:bg-stone-800 focus:outline-none disabled:bg-stone-300 transition-colors",
        btnSecondary: "inline-flex items-center px-6 py-3 border border-stone-300 shadow-sm text-sm font-medium rounded-xl text-stone-700 bg-white hover:bg-stone-50 focus:outline-none transition-colors",
        btnSmall: "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md hover:bg-stone-50 transition-colors"
    };

    const isNoor = formData.project === 'noor' || formData.project === 'dua';
    const isMemoria = formData.project === 'memoria';
    const isRitual = formData.project === 'ritual' || formData.productType === 'bracelet';
    const isBracelet = isRitual; // Alias for readability in render logic if needed

    return (
        <div className="flex bg-stone-50 min-h-screen font-sans">
            <AdminSidebar
                activeView="edit"
                onViewChange={() => navigate('/admin/dashboard')}
                onRefresh={() => window.location.reload()}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <main className="flex-1 h-screen overflow-y-auto relative py-12 px-4 sm:px-6 lg:px-8">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden absolute top-4 left-4 z-40 p-2 text-stone-600 bg-stone-100/80 backdrop-blur rounded-lg shadow-sm border border-stone-200">
                    <Menu className="h-6 w-6" />
                </button>
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-stone-900">
                            {isEditMode
                                ? 'Auftrag bearbeiten'
                                : isNoor
                                    ? 'Neues Noor'
                                    : isMemoria
                                        ? 'Neues Memoria'
                                        : isBracelet
                                            ? 'Neues Armband'
                                            : 'Neue Tasse'}
                        </h1>
                        <button
                            onClick={() => navigate(`/admin/dashboard?tab=${getDashboardTab()}`)}
                            className="text-stone-500 hover:text-stone-700"
                        >
                            Abbrechen
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-8 flex space-x-2">
                        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? (isNoor ? 'bg-emerald-500' : isMemoria ? 'bg-stone-600' : isRitual ? 'bg-indigo-500' : 'bg-rose-500') : 'bg-stone-200'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? (isNoor ? 'bg-emerald-500' : isMemoria ? 'bg-stone-600' : isRitual ? 'bg-indigo-500' : 'bg-rose-500') : 'bg-stone-200'}`}></div>
                    </div>

                    <div className="bg-white shadow rounded-2xl p-8 border border-stone-100">

                        {/* ---------- STEP 1: DETAILS (Formerly Step 2) ---------- */}
                        {step === 1 && (
                            <div className="space-y-8">
                                <h2 className="text-2xl font-bold text-stone-900">1. Inhalte erfassen</h2>

                                {/* NOOR FORM */}
                                {isNoor ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className={styles.label}>Titel des Bittgebets (z.B. Für Erfolg)</label>
                                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className={styles.input} placeholder="Titel..." />
                                        </div>

                                        {/* AUDIO 1: RECITATION */}
                                        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                                            <label className={styles.label}>1. Audio: Rezitation (Arabisch)</label>
                                            <div className="mt-2 flex items-center space-x-4">
                                                <label className="cursor-pointer flex items-center px-4 py-2 border border-emerald-300 rounded-lg shadow-sm text-sm font-medium text-emerald-700 bg-white hover:bg-emerald-50">
                                                    {uploadingRecitation ? <Loader className="animate-spin h-5 w-5" /> : <UploadCloud className="h-5 w-5 mr-2" />}
                                                    {uploadingRecitation ? 'Lädt hoch...' : 'Datei wählen'}
                                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, 'recitation')} />
                                                </label>

                                                {formData.audioUrl ? (
                                                    <div className="flex items-center text-emerald-700 text-sm">
                                                        <FileAudio className="h-5 w-5 mr-2" />
                                                        <span>Vorhanden ✅</span>
                                                        <audio src={formData.audioUrl} controls className="ml-4 h-8" />
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-stone-400">Keine Datei ausgewählt</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ARABIC TEXT INPUT REMOVED PER USER REQUEST */}

                                        {/* AUDIO 2: MEANING */}
                                        <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                                            <label className={styles.label}>2. Audio: Bedeutung/Story (Deutsch)</label>
                                            <p className="text-xs text-stone-500 mb-2">Optional: Läuft im Abschnitt der Bedeutung.</p>
                                            <div className="mt-2 flex items-center space-x-4">
                                                <label className="cursor-pointer flex items-center px-4 py-2 border border-stone-300 rounded-lg shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50">
                                                    {uploadingMeaning ? <Loader className="animate-spin h-5 w-5" /> : <UploadCloud className="h-5 w-5 mr-2" />}
                                                    {uploadingMeaning ? 'Lädt hoch...' : 'Datei wählen'}
                                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, 'meaning')} />
                                                </label>

                                                {formData.meaningAudioUrl ? (
                                                    <div className="flex items-center text-stone-700 text-sm">
                                                        <FileAudio className="h-5 w-5 mr-2" />
                                                        <span>Vorhanden ✅</span>
                                                        <audio src={formData.meaningAudioUrl} controls className="ml-4 h-8" />
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-stone-400">Keine Datei ausgewählt</span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className={styles.label}>Bedeutung Text (Markdown)</label>
                                            <textarea
                                                name="meaningText"
                                                value={formData.meaningText}
                                                onChange={handleInputChange}
                                                rows="5"
                                                className={styles.input}
                                                placeholder="Erklärung hier..."
                                            />
                                        </div>

                                        {/* Basic Metadata needed for DB */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-100">
                                            <div>
                                                <label className={styles.label}>Bestellnummer (Shopify/Etsy)</label>
                                                <input type="text" name="orderId" value={formData.orderId} onChange={handleInputChange} className={styles.input} placeholder="#1001" />
                                            </div>
                                            <div>
                                                <label className={styles.label}>Kunden Name</label>
                                                <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className={styles.input} />
                                            </div>
                                            <div>
                                                <label className={styles.label}>Kunden Email</label>
                                                <input type="text" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} className={styles.input} />
                                            </div>
                                        </div>
                                    </div>
                                ) : isMemoria ? (
                                    /* MEMORIA FORM */
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className={styles.label}>Name des Verstorbenen</label>
                                                <input type="text" name="deceasedName" value={formData.deceasedName} onChange={handleInputChange} className={styles.input} placeholder="z.B. Opa Hans" />
                                            </div>
                                            <div>
                                                <label className={styles.label}>Lebensdaten (Jahr - Jahr)</label>
                                                <input type="text" name="lifeDates" value={formData.lifeDates} onChange={handleInputChange} className={styles.input} placeholder="1950 - 2024" />
                                            </div>
                                        </div>

                                        {/* AUDIO (Recitation slot reused as Main Audio) */}
                                        <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                                            <label className={styles.label}>Audio Geschichte/Musik (Suno)</label>
                                            <div className="mt-2 flex items-center space-x-4">
                                                <label className="cursor-pointer flex items-center px-4 py-2 border border-stone-300 rounded-lg shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50">
                                                    {uploadingRecitation ? <Loader className="animate-spin h-5 w-5" /> : <UploadCloud className="h-5 w-5 mr-2" />}
                                                    {uploadingRecitation ? 'Lädt hoch...' : 'Audio wählen'}
                                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, 'recitation')} />
                                                </label>

                                                {formData.audioUrl ? (
                                                    <div className="flex items-center text-stone-700 text-sm">
                                                        <FileAudio className="h-5 w-5 mr-2" />
                                                        <span>Vorhanden ✅</span>
                                                        <audio src={formData.audioUrl} controls className="ml-4 h-8" />
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-stone-400">Keine Datei ausgewählt</span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className={styles.label}>Geschichte / Text (Markdown)</label>
                                            <textarea
                                                name="meaningText"
                                                value={formData.meaningText}
                                                onChange={handleInputChange}
                                                rows="8"
                                                className={styles.input}
                                                placeholder="Hier die Geschichte des Verstorbenen schreiben..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-100">
                                            <div>
                                                <label className={styles.label}>Bestellnummer</label>
                                                <input type="text" name="orderId" value={formData.orderId} onChange={handleInputChange} className={styles.input} placeholder="#1001" />
                                            </div>
                                            <div>
                                                <label className={styles.label}>Kunden Name</label>
                                                <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className={styles.input} />
                                            </div>
                                            <div>
                                                <label className={styles.label}>Kunden Email</label>
                                                <input type="text" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} className={styles.input} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* KAMLIMOS FORM (Standard) */
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className={styles.label}>Bestellnummer (Shopify/Etsy)</label>
                                            <input type="text" name="orderId" value={formData.orderId} onChange={handleInputChange} className={styles.input} placeholder="#1001" />
                                        </div>
                                        <div>
                                            <label className={styles.label}>Empfänger</label>
                                            <input type="text" name="recipientName" value={formData.recipientName} onChange={handleInputChange} className={styles.input} />
                                        </div>
                                        <div>
                                            <label className={styles.label}>Absender</label>
                                            <input type="text" name="senderName" value={formData.senderName} onChange={handleInputChange} className={styles.input} />
                                        </div>
                                        {/* ... other standard fields ... */}
                                        {isBracelet ? (
                                            <div className="md:col-span-2 space-y-4">
                                                <div>
                                                    <label className={styles.label}>Gravur Text</label>
                                                    <input type="text" name="engravingText" value={formData.engravingText} onChange={handleInputChange} className={styles.input} />
                                                </div>
                                                <div>
                                                    <label className={styles.label}>Bedeutung (Markdown)</label>
                                                    <textarea name="meaningText" value={formData.meaningText} onChange={handleInputChange} rows="5" className={styles.input} />
                                                </div>
                                            </div>
                                        ) : (
                                            // Mug fields
                                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={styles.label}>PIN Code</label>
                                                    <input type="text" name="accessCode" value={formData.accessCode} onChange={handleInputChange} className={styles.input} />
                                                </div>
                                                <div>
                                                    <label className={styles.label}>Öffnungs-Animation</label>
                                                    <select name="openingAnimation" value={formData.openingAnimation} onChange={handleInputChange} className={styles.input}>
                                                        <option value="none">Keine</option>
                                                        <option value="hearts">Herzen ❤️</option>
                                                        <option value="stars">Sterne ⭐</option>
                                                        <option value="confetti">Konfetti 🎉</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <button onClick={() => navigate(`/admin/dashboard?tab=${getDashboardTab()}`)} className={styles.btnSecondary}>Zurück</button>
                                    <div className="flex-1"></div>
                                    <button onClick={() => setStep(2)} className={styles.btnPrimary}>
                                        Weiter <ArrowRight className="ml-2 h-4 w-4 inline" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ---------- STEP 2: SUMMARY (Formerly Step 3/Messages) ---------- */}
                        {step === 2 && (
                            <div className="space-y-6">
                                {/* Standard Mug Messages flow would go here if needed, but for MVP we merge messages into Step 2 or skip if not needed for Noor */}
                                {!isNoor && !isBracelet ? (
                                    // MUG MESSAGES LOGIC (Skipped details for brevity, assumed standard)
                                    // MUG MESSAGES LOGIC
                                    <WizardMessageEditor
                                        messages={formData.messages}
                                        onAdd={addMessage}
                                        onRemove={removeMessage}
                                        onUpdate={updateMessage}
                                    />
                                ) : (

                                    <h2 className="text-2xl font-bold text-stone-900">Zusammenfassung</h2>
                                )}

                                {(isMemoria || isNoor) && (
                                    <div className="bg-stone-50 p-6 rounded-xl space-y-4">
                                        {isMemoria && (
                                            <>
                                                <p><strong>Name:</strong> {formData.deceasedName}</p>
                                                <p><strong>Daten:</strong> {formData.lifeDates}</p>
                                                <p><strong>Audio:</strong> {formData.audioUrl ? 'Vorhanden ✅' : 'Fehlt ❌'}</p>
                                            </>
                                        )}
                                        {isNoor && (
                                            <>
                                                <p><strong>Titel:</strong> {formData.title}</p>
                                                <p><strong>Audio (Rezitation):</strong> {formData.audioUrl ? 'Vorhanden ✅' : 'Fehlt ❌'}</p>
                                                <p><strong>Audio (Bedeutung):</strong> {formData.meaningAudioUrl ? 'Vorhanden ✅' : 'Fehlt ❌'}</p>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <button onClick={() => setStep(1)} className={styles.btnSecondary}>Zurück</button>
                                    <div className="w-4"></div>
                                    <button onClick={handleSubmit} disabled={loading} className={`${styles.btnPrimary} flex-1`}>
                                        {loading ? <Loader className="animate-spin h-5 w-5 mx-auto" /> : 'Speichern'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div >
    );
}
