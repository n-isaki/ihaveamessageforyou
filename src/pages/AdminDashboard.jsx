import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getGifts, deleteGift, createEtsyOrder, updateGift } from '../services/gifts'; // updateGift added
import { Plus, Gift, Eye, EyeOff, Loader, Printer, ChevronDown, ChevronUp, Edit2, Video, MessageSquare, Trash2, AlertTriangle, X, Watch, Coffee, Zap, ExternalLink, Heart, Lock, Unlock, ShoppingBag, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../components/AdminSidebar';
import AdminKanban from '../components/AdminKanban';

export default function AdminDashboard() {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [viewMode, setViewMode] = useState('list');

    // Etsy Modal
    const [showEtsyModal, setShowEtsyModal] = useState(false);
    const [etsyForm, setEtsyForm] = useState({ buyerName: '', personalizationText: '', productType: 'mug' });

    // Delete Modal State
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    // Initialize tab from URL or default to 'kamlimos'
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'kamlimos');

    useEffect(() => {
        fetchGifts();
    }, []);

    const fetchGifts = async () => {
        try {
            const data = await getGifts();

            // Sort by Last Modified / Created (Newest First)
            data.sort((a, b) => {
                const getT = (t) => t ? (t.seconds || t._seconds || 0) : 0;
                const timeA = Math.max(getT(a.updatedAt), getT(a.createdAt));
                const timeB = Math.max(getT(b.updatedAt), getT(b.createdAt));
                return timeB - timeA;
            });

            setGifts(data);
        } catch (error) {
            console.error("Failed to fetch gifts", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredGifts = gifts.filter(g => {
        if (activeTab === 'dua') return g.project === 'dua';
        if (activeTab === 'memoria') return g.project === 'memoria';
        if (activeTab === 'ritual') return g.project === 'ritual' || (g.productType === 'bracelet' && (!g.project || g.project === 'kamlimos'));
        // Kamlimos defaults (Mugs/Multimedia Tasse)
        return (!g.project || g.project === 'kamlimos') && g.productType !== 'bracelet';
    });

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteGift(deleteId);
            setGifts(gifts.filter(g => g.id !== deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete gift", error);
            alert("Fehler beim Löschen des Geschenks.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader className="h-8 w-8 animate-spin text-rose-600" />
            </div>
        );
    }

    const getViewerUrl = (gift) => {
        // If on local or staging, keep relative/same domain to ensure we test current env
        const isDevOrStaging = window.location.hostname.includes('localhost') ||
            window.location.hostname.includes('127.0.0.1') ||
            window.location.hostname.includes('staging');

        if (isDevOrStaging) {
            return `/v/${gift.id}`;
        }

        // Production: Use branded domains
        let domain = 'https://scan.kamlimos.com';
        if (gift.project === 'dua') domain = 'https://noor.kamlimos.com';
        else if (gift.project === 'memoria') domain = 'https://memoria.kamlimos.com';
        else if (gift.project === 'ritual' || gift.productType === 'bracelet') domain = 'https://ritual.kamlimos.com';

        return `${domain}/v/${gift.id}`;
    };

    return (
        <div className="flex bg-stone-50 min-h-screen font-sans">
            <AdminSidebar activeView={viewMode} onViewChange={setViewMode} onRefresh={() => window.location.reload()} />

            <main className="flex-1 overflow-y-auto h-screen p-8 relative">
                {viewMode === 'kanban' ? (
                    <AdminKanban gifts={filteredGifts} />
                ) : (
                    <>
                        <div className="max-w-6xl mx-auto">

                            {/* Header & Tabs */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
                                    <p className="text-stone-500 mt-1">Verwalte deine Connected Produkte</p>
                                </div>

                                {/* TABS */}
                                <div className="flex p-1 bg-stone-200 rounded-xl overflow-x-auto">
                                    <button
                                        onClick={() => { setActiveTab('kamlimos'); setSearchParams({ tab: 'kamlimos' }); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'kamlimos' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                                            }`}
                                    >
                                        Tasse
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('dua'); setSearchParams({ tab: 'dua' }); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'dua' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                                            }`}
                                    >
                                        Noor
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('memoria'); setSearchParams({ tab: 'memoria' }); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'memoria' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                                            }`}
                                    >
                                        Memoria
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('ritual'); setSearchParams({ tab: 'ritual' }); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'ritual' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                                            }`}
                                    >
                                        Armband
                                    </button>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowEtsyModal(true)}
                                        className="inline-flex items-center px-4 py-2 border border-stone-200 rounded-xl shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 transition-colors shrink-0"
                                    >
                                        <ShoppingBag className="h-5 w-5 mr-2 text-rose-600" />
                                        Etsy Simulieren
                                    </button>
                                    <Link
                                        to={activeTab === 'memoria' ? "/admin/create?project=memoria" :
                                            activeTab === 'dua' ? "/admin/create?project=dua" :
                                                activeTab === 'ritual' ? "/admin/create?project=ritual" :
                                                    "/admin/create?project=tasse"}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shrink-0"
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Neuer Auftrag
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {filteredGifts.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                                        <Gift className="h-12 w-12 mx-auto text-stone-300 mb-4" />
                                        <h3 className="text-lg font-medium text-stone-900">Keine Aufträge</h3>
                                        <p className="text-stone-500">In diesem Projekt ist noch nichts los.</p>
                                    </div>
                                ) : (
                                    filteredGifts.map((gift) => (
                                        <motion.div
                                            layout
                                            key={gift.id}
                                            className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow"
                                        >
                                            <div className="p-6 cursor-pointer" onClick={() => toggleExpand(gift.id)}>
                                                <div className="flex items-start justify-between">

                                                    {/* Left Side: Icon & Main Info */}
                                                    <div className="flex items-start space-x-4">
                                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${gift.project === 'dua' ? 'bg-emerald-100 text-emerald-600' :
                                                            gift.project === 'memoria' ? 'bg-stone-100 text-stone-600' :
                                                                gift.productType === 'bracelet' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'
                                                            }`}>
                                                            {gift.project === 'dua' ? <Zap className="h-6 w-6" /> :
                                                                gift.project === 'memoria' ? <Heart className="h-6 w-6" /> :
                                                                    gift.productType === 'bracelet' ? <Watch className="h-6 w-6" /> : <Coffee className="h-6 w-6" />}
                                                        </div>

                                                        <div>
                                                            <div className="flex items-center space-x-2">
                                                                <h3 className="text-lg font-bold text-stone-900">
                                                                    {gift.project === 'dua'
                                                                        ? (gift.title || gift.customerName || (gift.customerEmail ? gift.customerEmail.split('@')[0] : 'Unbekanntes Dua'))
                                                                        : gift.project === 'memoria'
                                                                            ? (gift.deceasedName || 'Unbekannter Name')
                                                                            : (gift.recipientName || gift.customerName || 'Unbekannt')}
                                                                </h3>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${gift.project === 'dua' ? 'bg-emerald-50 text-emerald-700' :
                                                                    gift.project === 'memoria' ? 'bg-stone-100 text-stone-500' :
                                                                        gift.productType === 'bracelet' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'
                                                                    }`}>
                                                                    {gift.project === 'dua' ? 'Noor' :
                                                                        gift.project === 'memoria' ? 'Memoria' :
                                                                            gift.productType === 'bracelet' ? 'Armband' : 'Tasse'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-stone-500">
                                                                Bestellung <span className="font-mono bg-stone-100 px-1 rounded">{gift.orderId || 'MANUAL'}</span>
                                                                {gift.productVariant && <span className="mx-1 text-stone-400">• {gift.productVariant} •</span>}
                                                                von {gift.customerName}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Right Side: Status & Actions */}
                                                    <div className="flex items-center space-x-4">
                                                        {/* Etsy Specific Status */}
                                                        {gift.platform === 'etsy' && (
                                                            <div className="flex items-center space-x-2 mr-2 border-r border-stone-200 pr-4">
                                                                <button
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        const tokenPart = gift.securityToken ? `?token=${gift.securityToken}` : '';
                                                                        const name = gift.customerName || gift.senderName || gift.recipientName || 'Kunde';
                                                                        navigator.clipboard.writeText(`Hallo ${name}, bitte richte dein Geschenk hier ein: https://scan.kamlimos.com/setup/${gift.id}${tokenPart}`);
                                                                        alert("Link kopiert (Secure)!");
                                                                    }}
                                                                    className="flex items-center space-x-1 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold hover:bg-violet-200 transition-colors"
                                                                    title="Link Kopieren"
                                                                >                                                      <Copy className="h-3 w-3" />
                                                                    <span>Link</span>
                                                                </button>

                                                                {gift.locked ? (
                                                                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-stone-800 text-white text-xs font-bold" title="Kunde ist fertig">
                                                                        <Lock className="h-3 w-3" />
                                                                        <span>Fertig</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold" title="Wartet auf Kunde">
                                                                        <Unlock className="h-3 w-3" />
                                                                        <span>Offen</span>
                                                                    </div>
                                                                )}

                                                                {gift.setupStarted && !gift.locked && (
                                                                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold" title="Kunde hat Link geöffnet">
                                                                        <Eye className="h-3 w-3" />
                                                                        <span>Gestartet</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!confirm("Status 'Gesehen' umschalten?")) return;
                                                                const newStatus = !gift.viewed;
                                                                // Async Update
                                                                updateGift(gift.id, {
                                                                    viewed: newStatus,
                                                                    viewedAt: newStatus ? new Date() : null
                                                                });
                                                                // Optimistic Update
                                                                setGifts(gifts.map(g => g.id === gift.id ? { ...g, viewed: newStatus } : g));
                                                            }}
                                                            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold hover:shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer ${gift.viewed ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                                                                }`}
                                                            title="Klicken um Status zu ändern"
                                                        >
                                                            {gift.viewed ? (
                                                                <><Check className="h-3 w-3" /> <span>Empfangen</span></>
                                                            ) : (
                                                                <><EyeOff className="h-3 w-3" /> <span>Ungesehen</span></>
                                                            )}
                                                        </button>

                                                        <div className="h-8 w-px bg-stone-200"></div>

                                                        <div className="flex space-x-1" onClick={e => e.stopPropagation()}>
                                                            <a
                                                                href={getViewerUrl(gift)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                                title="Öffnen"
                                                            >
                                                                <ExternalLink className="h-5 w-5" />
                                                            </a>
                                                            <Link to={`/admin/print/${gift.id}`} target="_blank" className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg" title="QR Code">
                                                                <Printer className="h-5 w-5" />
                                                            </Link>
                                                            <Link to={`/admin/edit/${gift.id}`} className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Bearbeiten">
                                                                <Edit2 className="h-5 w-5" />
                                                            </Link>
                                                            <button onClick={(e) => handleDeleteClick(e, gift.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Löschen">
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>

                                                        <div className="pl-2">
                                                            {expandedId === gift.id ? <ChevronUp className="h-5 w-5 text-stone-400" /> : <ChevronDown className="h-5 w-5 text-stone-400" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Production View */}
                                            <AnimatePresence>
                                                {expandedId === gift.id && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: 'auto' }}
                                                        exit={{ height: 0 }}
                                                        className="border-t border-stone-100 bg-stone-50/50"
                                                    >
                                                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">

                                                            {/* DATA VIEW */}
                                                            <div className="md:col-span-2 space-y-6">
                                                                {gift.project === 'dua' ? (
                                                                    <div className="bg-white p-6 rounded-xl border border-stone-200">
                                                                        <h4 className="font-bold mb-4">Noor Details</h4>
                                                                        <p className="mb-2"><strong>Titel:</strong> {gift.title || '-'}</p>
                                                                        <p><strong>Audio URL:</strong> <a href={gift.audioUrl} className="text-emerald-600 underline truncate block text-sm">{gift.audioUrl ? 'Anhören' : '-'}</a></p>
                                                                    </div>
                                                                ) : gift.project === 'memoria' ? (
                                                                    <div className="bg-white p-6 rounded-xl border border-stone-200">
                                                                        <h4 className="font-bold mb-4">Memoria Details</h4>
                                                                        <p className="mb-2"><strong>Name des Verstorbenen:</strong> {gift.deceasedName || '-'}</p>
                                                                        <p className="mb-2"><strong>Lebensdaten:</strong> {gift.lifeDates || '-'}</p>
                                                                        <p><strong>Audio:</strong> {gift.audioUrl ? 'Vorhanden ✅' : 'Fehlt ❌'}</p>
                                                                    </div>
                                                                ) : gift.productType === 'bracelet' ? (
                                                                    <div>
                                                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Produktions-Daten (Laser)</h4>
                                                                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                                                                            <h5 className="font-bold text-stone-900 mb-2">Armband-Gravur</h5>
                                                                            <div className="p-4 bg-stone-100 rounded-lg border-l-4 border-indigo-500">
                                                                                <p className="font-mono text-xl text-stone-900 tracking-wide">{gift.engravingText || '-'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Produktions-Daten (Tasse)</h4>
                                                                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                                                                            <div className="flex items-start space-x-6">
                                                                                {gift.designImage ? (
                                                                                    <div className="shrink-0">
                                                                                        <img src={gift.designImage} alt="Design" className="h-32 w-32 object-cover rounded-lg border border-stone-100 shadow-sm" />
                                                                                        <p className="mt-2 text-xs text-center text-stone-400">Design</p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="h-32 w-32 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 text-xs">Kein Bild</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Meta Data */}
                                                            <div className="space-y-6">
                                                                <div>
                                                                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Metadaten</h4>
                                                                    <dl className="space-y-3 text-sm">
                                                                        <div className="flex justify-between pb-2 border-b border-stone-100">
                                                                            <dt className="text-stone-500">Kunden E-Mail</dt>
                                                                            <dd className="font-medium text-stone-900 truncate ml-2">{gift.customerEmail || '-'}</dd>
                                                                        </div>
                                                                        <div className="flex justify-between pb-2 border-b border-stone-100">
                                                                            <dt className="text-stone-500">Variante</dt>
                                                                            <dd className="font-medium text-stone-900 truncate ml-2">{gift.productVariant || '-'}</dd>
                                                                        </div>
                                                                        {gift.productType === 'mug' && (
                                                                            <div className="flex justify-between pb-2 border-b border-stone-100">
                                                                                <dt className="text-stone-500">PIN Code</dt>
                                                                                <dd className="font-mono font-bold text-stone-900">{gift.accessCode || '-'}</dd>
                                                                            </div>
                                                                        )}
                                                                    </dl>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Etsy Manual Order Modal */}
                        <AnimatePresence>
                            {showEtsyModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative"
                                    >
                                        <button onClick={() => setShowEtsyModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
                                            <X className="h-6 w-6" />
                                        </button>
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="p-3 bg-stone-100 rounded-full">
                                                <ShoppingBag className="h-6 w-6 text-rose-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold font-serif text-stone-900">Etsy Simulieren</h3>
                                                <p className="text-stone-500 text-sm">Bestellung manuell anlegen</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-1">Produkt</label>
                                                <select
                                                    value={etsyForm.productType}
                                                    onChange={e => setEtsyForm({ ...etsyForm, productType: e.target.value })}
                                                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                                >
                                                    <option value="mug">Multimedia Tasse</option>
                                                    <option value="bracelet">Armband (Gravur)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-1">Name des Käufers (Etsy User)</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                                    placeholder="z.B. Stefan Müller"
                                                    value={etsyForm.buyerName}
                                                    onChange={e => setEtsyForm({ ...etsyForm, buyerName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-1">Personalisierung (Etsy Text)</label>
                                                <textarea
                                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                                    placeholder="Text den der Kunde bei Etsy eingegeben hat..."
                                                    rows={3}
                                                    value={etsyForm.personalizationText}
                                                    onChange={e => setEtsyForm({ ...etsyForm, personalizationText: e.target.value })}
                                                />
                                            </div>

                                            <button
                                                onClick={async () => {
                                                    await createEtsyOrder({
                                                        ...etsyForm,
                                                        customerName: etsyForm.buyerName, // The Buyer
                                                        senderName: etsyForm.buyerName, // Usually the buyer is the sender
                                                        recipientName: '', // We don't know the recipient yet
                                                        etsyOrderId: `MANUAL-${Math.floor(Math.random() * 10000)}`
                                                    });
                                                    setShowEtsyModal(false);
                                                    window.location.reload();
                                                }}
                                                className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl mt-4 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-200"
                                            >
                                                Auftrag Anlegen
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Delete Modal (Same as before) */}
                        <AnimatePresence>
                            {deleteId && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                                    >
                                        <h3 className="text-lg font-bold text-center text-stone-900 mb-2">Geschenk löschen?</h3>
                                        <div className="flex space-x-3 mt-6">
                                            <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium">Abbrechen</button>
                                            <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium">Löschen</button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </main>
        </div>
    );
}
