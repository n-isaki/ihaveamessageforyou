import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createGift, getGiftById, updateGift } from '@/services/gifts';
import { Plus, Trash2, Video, MessageSquare, ArrowRight, ArrowLeft, Save, Loader, Coffee, Watch } from 'lucide-react';

export default function GiftWizard() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Common
        productType: 'mug', // 'mug' or 'bracelet'
        recipientName: '',
        senderName: '',
        customerName: '',
        customerEmail: '',
        orderId: '',

        // Mug Specific
        accessCode: '',
        openingAnimation: 'none',
        messages: [],
        designImage: '', // URL for placeholder

        // Bracelet Specific
        engravingText: ''
    });

    useEffect(() => {
        if (isEditMode) {
            const fetchGift = async () => {
                try {
                    const data = await getGiftById(id);
                    if (data) {
                        setFormData({
                            productType: data.productType || 'mug',
                            recipientName: data.recipientName || '',
                            senderName: data.senderName || '',
                            accessCode: data.accessCode || '',
                            customerName: data.customerName || '',
                            customerEmail: data.customerEmail || '',
                            orderId: data.orderId || '',
                            openingAnimation: data.openingAnimation || 'none',
                            messages: data.messages || [],
                            designImage: data.designImage || '', // Load design image
                            engravingText: data.engravingText || '' // Load bracelet text
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
        }
    }, [id, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                await createGift(formData);
            }
            navigate('/admin/dashboard');
        } catch (err) {
            console.error("Failed to save gift:", err);
            setError(`Fehler: ${err.message}`);
        } finally {
            setLoading(false);
        }
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
        inputSm: "block w-full border-none p-0 focus:ring-0 text-sm",
        btnPrimary: "inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none disabled:bg-stone-300 transition-colors",
        btnSecondary: "inline-flex items-center px-6 py-3 border border-stone-300 shadow-sm text-sm font-medium rounded-xl text-stone-700 bg-white hover:bg-stone-50 focus:outline-none transition-colors",
        btnSmall: "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md hover:bg-stone-50 transition-colors"
    };

    // Determine Steps based on Product Type
    // Mug: 1. Type -> 2. Details -> 3. Messages -> 4. Review
    // Bracelet: 1. Type -> 2. Details (inc. Text) -> 3. Review
    const isBracelet = formData.productType === 'bracelet';

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-stone-900">
                        {isEditMode ? 'Auftrag bearbeiten' : 'Neuer Auftrag'}
                    </h1>
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="text-stone-500 hover:text-stone-700"
                    >
                        Abbrechen
                    </button>
                </div>

                {/* Progress Steps (Simplified Visual) */}
                <div className="mb-8 flex space-x-2">
                    <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-stone-200'}`}></div>
                    <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-stone-200'}`}></div>
                    <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-stone-200'}`}></div>
                    {!isBracelet && <div className={`h-2 flex-1 rounded-full ${step >= 4 ? 'bg-emerald-500' : 'bg-stone-200'}`}></div>}
                </div>

                <div className="bg-white shadow rounded-2xl p-8 border border-stone-100">

                    {/* STEP 1: Product Selection */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-stone-900">1. Produkt wählen</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFormData(p => ({ ...p, productType: 'mug' }))}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${formData.productType === 'mug'
                                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                                        : 'border-stone-200 hover:border-stone-400'
                                        }`}
                                >
                                    <Coffee className={`h-8 w-8 mb-4 ${formData.productType === 'mug' ? 'text-emerald-600' : 'text-stone-400'}`} />
                                    <h3 className="font-bold text-stone-900">Multimedia Tasse</h3>
                                    <p className="text-xs text-stone-500 mt-1">Design + Video + PIN Code</p>
                                </button>

                                <button
                                    onClick={() => setFormData(p => ({ ...p, productType: 'bracelet' }))}
                                    className={`p-6 rounded-xl border-2 text-left transition-all ${formData.productType === 'bracelet'
                                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                                        : 'border-stone-200 hover:border-stone-400'
                                        }`}
                                >
                                    <Watch className={`h-8 w-8 mb-4 ${formData.productType === 'bracelet' ? 'text-indigo-600' : 'text-stone-400'}`} />
                                    <h3 className="font-bold text-stone-900">Ritual Armband</h3>
                                    <p className="text-xs text-stone-500 mt-1">Gravur + Story Card</p>
                                </button>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={() => setStep(2)} className={styles.btnPrimary}>
                                    Weiter <ArrowRight className="ml-2 h-4 w-4 inline" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Main Details */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-stone-900">2. Details erfassen</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Common Fields */}
                                <div>
                                    <label className={styles.label}>Empfänger</label>
                                    <input type="text" name="recipientName" value={formData.recipientName} onChange={handleInputChange} className={styles.input} placeholder="Für wen?" />
                                </div>
                                <div>
                                    <label className={styles.label}>Absender</label>
                                    <input type="text" name="senderName" value={formData.senderName} onChange={handleInputChange} className={styles.input} placeholder="Von wem?" />
                                </div>
                                <div>
                                    <label className={styles.label}>Bestellnummer</label>
                                    <input type="text" name="orderId" value={formData.orderId} onChange={handleInputChange} className={styles.input} placeholder="#" />
                                </div>
                                <div>
                                    <label className={styles.label}>Kunden E-Mail</label>
                                    <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} className={styles.input} />
                                </div>

                                {/* MUG ONLY: PIN & Animation */}
                                {!isBracelet && (
                                    <>
                                        <div>
                                            <label className={styles.label}>Zugangs-PIN</label>
                                            <input type="text" name="accessCode" value={formData.accessCode} onChange={handleInputChange} className={`${styles.input} bg-emerald-50 border-emerald-200`} placeholder="1234" />
                                        </div>
                                        <div>
                                            <label className={styles.label}>Animation</label>
                                            <select name="openingAnimation" value={formData.openingAnimation} onChange={handleInputChange} className={styles.input}>
                                                <option value="none">Keine</option>
                                                <option value="confetti">Konfetti 🎉</option>
                                                <option value="hearts">Herzen ❤️</option>
                                            </select>
                                        </div>
                                        {/* Design Image URL for Mug (Manual Entry) */}
                                        <div className="md:col-span-2">
                                            <label className={styles.label}>Design Bild URL (Optional)</label>
                                            <div className="flex gap-2 mb-2">
                                                {['Strand', 'Berge', 'Stadt'].map((type, i) => {
                                                    const urls = [
                                                        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
                                                        'https://images.unsplash.com/photo-1519681393797-a1e943e06572?w=800&q=80',
                                                        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80'
                                                    ];
                                                    return (
                                                        <button
                                                            key={type}
                                                            onClick={() => setFormData(p => ({ ...p, designImage: urls[i] }))}
                                                            className="text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded border border-stone-200 transition-colors"
                                                        >
                                                            {type}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <input type="text" name="designImage" value={formData.designImage} onChange={handleInputChange} className={`${styles.input} font-mono text-xs`} placeholder="https://..." />
                                        </div>
                                    </>
                                )}

                                {/* BRACELET ONLY: Engraving Text */}
                                {isBracelet && (
                                    <div className="md:col-span-2 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <label className="block text-sm font-medium text-indigo-900 mb-1">Gravur Text (Manuell)</label>
                                        <p className="text-xs text-indigo-500 mb-2">Lass leer, wenn der Kunde dies via Ritual machen soll.</p>
                                        <textarea
                                            rows={3}
                                            name="engravingText"
                                            value={formData.engravingText}
                                            onChange={handleInputChange}
                                            className={`${styles.input} border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500`}
                                            placeholder="Ich halte dich nicht fest..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className={styles.btnSecondary}>Zurück</button>
                                <button onClick={() => setStep(isBracelet ? 3 : 3)} className={styles.btnPrimary}>
                                    Weiter <ArrowRight className="ml-2 h-4 w-4 inline" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Messages (MUG ONLY) */}
                    {!isBracelet && step === 3 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-stone-900">3. Multimedia Inhalte</h2>
                                <div className="space-x-2">
                                    <button onClick={() => addMessage('text')} className={`${styles.btnSmall} bg-white border border-stone-200`}><MessageSquare className="h-4 w-4 mr-2" /> Text</button>
                                    <button onClick={() => addMessage('video')} className={`${styles.btnSmall} bg-white border border-stone-200`}><Video className="h-4 w-4 mr-2" /> Video</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {formData.messages.map((msg) => (
                                    <div key={msg.id} className="bg-stone-50 p-4 rounded-lg border border-stone-200 relative group">
                                        <button onClick={() => removeMessage(msg.id)} className="absolute top-2 right-2 text-stone-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                        <div className="space-y-2">
                                            <input type="text" value={msg.author} onChange={(e) => updateMessage(msg.id, 'author', e.target.value)} className={`${styles.inputSm} font-bold text-stone-700`} placeholder="Autor" />
                                            {msg.type === 'video' ? (
                                                <input type="text" value={msg.content} onChange={(e) => updateMessage(msg.id, 'content', e.target.value)} className={styles.input} placeholder="YouTube URL..." />
                                            ) : (
                                                <textarea value={msg.content} onChange={(e) => updateMessage(msg.id, 'content', e.target.value)} className={styles.input} rows={2} placeholder="Nachricht..." />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {formData.messages.length === 0 && <p className="text-center text-stone-400 py-8">Keine Nachrichten.</p>}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(2)} className={styles.btnSecondary}>Zurück</button>
                                <button onClick={() => setStep(4)} className={styles.btnPrimary}>Weiter</button>
                            </div>
                        </div>
                    )}

                    {/* FINAL STEP: Review & Save */}
                    {((isBracelet && step === 3) || (!isBracelet && step === 4)) && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-stone-900">Fertigstellen</h2>

                            <div className="bg-stone-50 p-6 rounded-xl space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Typ:</span>
                                    <span className="font-bold uppercase tracking-wider">{isBracelet ? 'Armband' : 'Tasse'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Empfänger:</span>
                                    <span className="font-medium">{formData.recipientName}</span>
                                </div>
                                {isBracelet && (
                                    <div className="pt-4 border-t border-stone-200">
                                        <p className="text-xs text-stone-400 mb-1">Gravur:</p>
                                        <p className="font-mono bg-white p-2 rounded border border-stone-200 text-sm">
                                            {formData.engravingText || '(Leer - Warte auf Ritual)'}
                                        </p>
                                    </div>
                                )}
                                {!isBracelet && (
                                    <div className="pt-4 border-t border-stone-200">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-stone-500">PIN:</span>
                                            <span className="font-mono font-bold bg-yellow-100 px-2 rounded text-yellow-800">{formData.accessCode}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">Nachrichten:</span>
                                            <span>{formData.messages.length}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(isBracelet ? 2 : 3)} className={styles.btnSecondary}>Zurück</button>
                                <button onClick={handleSubmit} disabled={loading} className={`${styles.btnPrimary} w-full ml-4`}>
                                    {loading ? <Loader className="animate-spin h-5 w-5 mx-auto" /> : <><Save className="h-5 w-5 mr-2" /> Speichern</>}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
