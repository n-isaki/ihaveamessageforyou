import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createGift, getGiftById, updateGift } from '@/services/gifts';
import { Plus, Trash2, Video, MessageSquare, ArrowRight, ArrowLeft, Save, Loader } from 'lucide-react';

export default function GiftWizard() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL if in edit mode
    const isEditMode = !!id;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        recipientName: '',
        senderName: '', // New field for display
        accessCode: '',
        customerName: '',
        customerEmail: '',
        orderId: '',
        openingAnimation: 'none',
        messages: []
    });

    useEffect(() => {
        if (isEditMode) {
            const fetchGift = async () => {
                try {
                    const data = await getGiftById(id);
                    if (data) {
                        setFormData({
                            recipientName: data.recipientName || '',
                            senderName: data.senderName || '', // Load it
                            accessCode: data.accessCode || '',
                            customerName: data.customerName || '',
                            customerEmail: data.customerEmail || '',
                            orderId: data.orderId || '',
                            openingAnimation: data.openingAnimation || 'none',
                            messages: data.messages || []
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
            author: formData.senderName || formData.customerName, // Use senderName as default if available
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
                console.log("Updating gift...");
                await updateGift(id, formData);
                console.log("Gift updated successfully!");
            } else {
                console.log("Creating gift...");
                await createGift(formData);
                console.log("Gift created successfully!");
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

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-stone-900">
                        {isEditMode ? 'Geschenk bearbeiten' : 'Neues Geschenk'}
                    </h1>
                    {isEditMode && (
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-stone-500 hover:text-stone-700"
                        >
                            Abbrechen
                        </button>
                    )}
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className={`flex-1 text-center ${step >= 1 ? 'text-rose-600 font-bold' : 'text-stone-400'}`}>1. Details</div>
                        <div className="flex-1 border-t-2 border-stone-200 mx-4"></div>
                        <div className={`flex-1 text-center ${step >= 2 ? 'text-rose-600 font-bold' : 'text-stone-400'}`}>2. Nachrichten</div>
                        <div className="flex-1 border-t-2 border-stone-200 mx-4"></div>
                        <div className={`flex-1 text-center ${step >= 3 ? 'text-rose-600 font-bold' : 'text-stone-400'}`}>3. Überprüfen</div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-stone-900">Details</h2>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Empfänger Name</label>
                                    <input
                                        type="text"
                                        name="recipientName"
                                        value={formData.recipientName}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                        placeholder="z.B. Opa Hans"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Angezeigter Absender</label>
                                    <input
                                        type="text"
                                        name="senderName"
                                        value={formData.senderName}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                        placeholder="z.B. Deine Enkelkinder"
                                    />
                                    <p className="mt-1 text-xs text-stone-500">Erscheint als "Nachricht von..."</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Zugangs-PIN</label>
                                    <input
                                        type="text"
                                        name="accessCode"
                                        value={formData.accessCode}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                        placeholder="z.B. 1954"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Bestellnummer</label>
                                    <input
                                        type="text"
                                        name="orderId"
                                        value={formData.orderId}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                        placeholder="z.B. #10234"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Öffnungs-Animation</label>
                                    <select
                                        name="openingAnimation"
                                        value={formData.openingAnimation}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                    >
                                        <option value="none">Keine</option>
                                        <option value="hearts">Herzen fliegen ❤️</option>
                                        <option value="confetti">Konfetti 🎉</option>
                                        <option value="stars">Sterne ✨</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Kunden Name</label>
                                    <input
                                        type="text"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                        placeholder="z.B. Saskia Muster"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Kunden E-Mail</label>
                                    <input
                                        type="email"
                                        name="customerEmail"
                                        value={formData.customerEmail}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                        placeholder="saskia@example.com"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!formData.recipientName || !formData.accessCode}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300"
                                >
                                    Weiter <ArrowRight className="ml-2 h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-stone-900">Nachrichten hinzufügen</h2>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => addMessage('text')}
                                        className="inline-flex items-center px-3 py-1.5 border border-stone-300 shadow-sm text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50"
                                    >
                                        <MessageSquare className="h-4 w-4 mr-2 text-rose-500" /> Text
                                    </button>
                                    <button
                                        onClick={() => addMessage('video')}
                                        className="inline-flex items-center px-3 py-1.5 border border-stone-300 shadow-sm text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50"
                                    >
                                        <Video className="h-4 w-4 mr-2 text-rose-500" /> Video
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {formData.messages.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-stone-300 rounded-lg">
                                        <p className="text-stone-500">Noch keine Nachrichten. Füge etwas Liebe hinzu!</p>
                                    </div>
                                )}
                                {formData.messages.map((msg, index) => (
                                    <div key={msg.id} className="bg-stone-50 p-4 rounded-lg border border-stone-200 relative">
                                        <button
                                            onClick={() => removeMessage(msg.id)}
                                            className="absolute top-2 right-2 text-stone-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                                            <div className="sm:col-span-3">
                                                <label className="block text-xs font-medium text-stone-500">Autor</label>
                                                <input
                                                    type="text"
                                                    value={msg.author}
                                                    onChange={(e) => updateMessage(msg.id, 'author', e.target.value)}
                                                    className="mt-1 block w-full border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                                />
                                            </div>
                                            <div className="sm:col-span-9">
                                                <label className="block text-xs font-medium text-stone-500">
                                                    {msg.type === 'video' ? 'Video URL (YouTube/Vimeo)' : 'Nachricht'}
                                                </label>
                                                {msg.type === 'text' ? (
                                                    <textarea
                                                        rows={2}
                                                        value={msg.content}
                                                        onChange={(e) => updateMessage(msg.id, 'content', e.target.value)}
                                                        className="mt-1 block w-full border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={msg.content}
                                                        onChange={(e) => updateMessage(msg.id, 'content', e.target.value)}
                                                        placeholder="https://..."
                                                        className="mt-1 block w-full border-stone-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="inline-flex items-center px-4 py-2 border border-stone-300 shadow-sm text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={formData.messages.length === 0}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300"
                                >
                                    Weiter <ArrowRight className="ml-2 h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-stone-900">Überprüfen & Speichern</h2>

                            <div className="bg-stone-50 p-4 rounded-lg">
                                <h3 className="font-medium text-stone-900">Zusammenfassung</h3>
                                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-sm font-medium text-stone-500">Empfänger</dt>
                                        <dd className="mt-1 text-sm text-stone-900">{formData.recipientName}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-stone-500">Absender (Anzeige)</dt>
                                        <dd className="mt-1 text-sm text-stone-900">{formData.senderName || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-stone-500">PIN Code</dt>
                                        <dd className="mt-1 text-sm text-stone-900">{formData.accessCode}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-stone-500">Bestellnummer</dt>
                                        <dd className="mt-1 text-sm text-stone-900">{formData.orderId || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-stone-500">Animation</dt>
                                        <dd className="mt-1 text-sm text-stone-900">
                                            {formData.openingAnimation === 'hearts' && 'Herzen ❤️'}
                                            {formData.openingAnimation === 'confetti' && 'Konfetti 🎉'}
                                            {formData.openingAnimation === 'stars' && 'Sterne ✨'}
                                            {formData.openingAnimation === 'none' && 'Keine'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-stone-500">Kunde</dt>
                                        <dd className="mt-1 text-sm text-stone-900">{formData.customerName} ({formData.customerEmail})</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-stone-500">Nachrichten</dt>
                                        <dd className="mt-1 text-sm text-stone-900">{formData.messages.length} Elemente</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="flex justify-between pt-4">
                                {error && (
                                    <div className="w-full mb-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                                        {error}
                                    </div>
                                )}
                                <button
                                    onClick={() => setStep(2)}
                                    className="inline-flex items-center px-4 py-2 border border-stone-300 shadow-sm text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400"
                                >
                                    {loading ? (
                                        'Speichert...'
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> {isEditMode ? 'Änderungen speichern' : 'Geschenk erstellen'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
