import React, { useState } from 'react';
import { createSimulatedOrder } from '@/services/gifts';
import { ShoppingBag, CreditCard, Loader, CheckCircle } from 'lucide-react';

export default function Simulator() {
    const [loading, setLoading] = useState(false);
    const [successId, setSuccessId] = useState('');

    // Fake Designs for Simulation
    const MUG_DESIGNS = [
        { id: 'design_face_tolstoy', name: 'Face Geometry + Tolstoy', url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=200' },
        { id: 'design_minimal_lines', name: 'Minimal Lines', url: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=200' }
    ];

    const [formData, setFormData] = useState({
        productType: 'mug',
        designImage: MUG_DESIGNS[0].url,
        customerName: 'Saskia Muster',
        customerEmail: 'saskia@test.de',
        recipientName: 'Opa Hans',
        senderName: 'Deine Enkelin'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const id = await createSimulatedOrder(formData);
            setSuccessId(id);
        } catch (error) {
            alert("Fehler: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-stone-900 p-6 text-white text-center">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-emerald-400" />
                    <h1 className="text-xl font-bold">Shopify Simulator</h1>
                    <p className="text-stone-400 text-sm">Bestellungen faken für Project ANIMA</p>
                </div>

                <div className="p-8">
                    {!successId ? (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Product Select */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Produkt Typ</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                                    value={formData.productType}
                                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                                >
                                    <option value="mug">Multimedia Tasse</option>
                                    <option value="bracelet">Ritual Armband</option>
                                </select>
                            </div>

                            {/* Conditional Design Select (Only for Mug) */}
                            {formData.productType === 'mug' && (
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">Design wählen</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {MUG_DESIGNS.map(design => (
                                            <div
                                                key={design.id}
                                                onClick={() => setFormData({ ...formData, designImage: design.url })}
                                                className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${formData.designImage === design.url ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-stone-200 hover:border-stone-400'}`}
                                            >
                                                <img src={design.url} className="w-full h-20 object-cover rounded mb-1" />
                                                <p className="text-xs text-center font-medium">{design.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Customer Data */}
                            <div className="space-y-4 pt-4 border-t border-stone-100">
                                <h3 className="text-sm font-bold text-stone-900">Kunden Daten</h3>
                                <input
                                    type="text"
                                    value={formData.customerName}
                                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                    placeholder="Name des Kunden"
                                    className="block w-full rounded-md border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                />
                                <input
                                    type="email"
                                    value={formData.customerEmail}
                                    onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                                    placeholder="saskia@test.de"
                                    className="block w-full rounded-md border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                />
                            </div>

                            {/* Personalization */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-stone-900">Personalisierung (Input im Shop)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={formData.recipientName}
                                        onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                                        placeholder="Für wen? (Opa)"
                                        className="block w-full rounded-md border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                    />
                                    <input
                                        type="text"
                                        value={formData.senderName}
                                        onChange={e => setFormData({ ...formData, senderName: e.target.value })}
                                        placeholder="Von wem? (Enkel)"
                                        className="block w-full rounded-md border-stone-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all font-bold"
                            >
                                {loading ? <Loader className="animate-spin" /> : <><CreditCard className="mr-2 h-5 w-5" /> Jetzt Kaufen (Fake)</>}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-10 space-y-4">
                            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
                            <h2 className="text-2xl font-bold text-stone-800">Bestellung angelegt!</h2>
                            <p className="text-stone-500">Das System hat die Bestellung erfolgreich empfangen.</p>
                            <div className="bg-stone-50 p-4 rounded-lg font-mono text-xs text-left mb-6">
                                Order ID: {successId}
                            </div>
                            <div className="space-y-2">
                                <a href="/admin/dashboard" className="block w-full py-3 bg-stone-900 text-white rounded-xl font-bold">
                                    Zum Admin Dashboard (Produktion)
                                </a>
                                <button onClick={() => setSuccessId('')} className="block w-full py-3 text-stone-500 hover:text-stone-800">
                                    Noch eine Bestellung simulieren
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
