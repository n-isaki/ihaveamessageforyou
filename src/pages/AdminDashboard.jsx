import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getGifts, deleteGift, createEtsyOrder, updateGift } from '../services/gifts'; // updateGift added
import { Plus, Gift, Eye, EyeOff, Loader, Printer, ChevronDown, ChevronUp, Edit2, Video, MessageSquare, Trash2, AlertTriangle, X, Watch, Coffee, Zap, ExternalLink, Heart, Lock, Unlock, ShoppingBag, Copy, Check, Menu, Package, Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../components/AdminSidebar';
import AdminKanban from '../components/AdminKanban';

export default function AdminDashboard() {
    const [gifts, setGifts] = useState([]);
    const [hoveredGift, setHoveredGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

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

    // Auto-select from URL (e.g. from Kanban click)
    useEffect(() => {
        const selectId = searchParams.get('select');
        if (selectId && gifts.length > 0) {
            const gift = gifts.find(g => g.id === selectId);
            if (gift) {
                setExpandedId(selectId);

                // Switch Tab if needed
                let targetTab = 'kamlimos';
                if (gift.project === 'noor' || gift.project === 'dua') targetTab = 'noor';
                else if (gift.project === 'memoria') targetTab = 'memoria';
                else if (gift.project === 'ritual' || gift.productType === 'bracelet') targetTab = 'ritual';

                if (activeTab !== targetTab) {
                    setActiveTab(targetTab);
                    // Note: changing state won't update 'activeTab' in this render cycle immediately used by filter, 
                    // but next render will show it.
                }

                // Optional: Scroll into view? (Requires ref)
            }
        }
    }, [searchParams, gifts]);

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
        if (activeTab === 'noor' || activeTab === 'dua') return g.project === 'noor' || g.project === 'dua';
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
        if (gift.project === 'noor' || gift.project === 'dua') domain = 'https://noor.kamlimos.com';
        else if (gift.project === 'memoria') domain = 'https://memoria.kamlimos.com';
        else if (gift.project === 'ritual' || gift.productType === 'bracelet') domain = 'https://ritual.kamlimos.com';

        return `${domain}/v/${gift.id}`;
    };

    const activities = React.useMemo(() => {
        const list = [];
        // Use all gifts for global activity feed
        gifts.forEach(g => {
            if (g.createdAt) list.push({ type: 'created', date: g.createdAt.toDate(), gift: g });
            if (g.viewedAt) list.push({ type: 'viewed', date: g.viewedAt.toDate(), gift: g });
            if (g.locked) list.push({ type: 'locked', date: g.updatedAt?.toDate() || new Date(), gift: g }); // Approximation
        });
        return list
            .filter(a => a.date && !isNaN(a.date.getTime())) // Filter invalid dates
            .sort((a, b) => b.date - a.date)
            .slice(0, 5);
    }, [gifts]);

    return (
        <div className="flex bg-stone-50 min-h-screen font-sans">
            <AdminSidebar
                activeView={viewMode}
                onViewChange={setViewMode}
                onRefresh={() => window.location.reload()}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 overflow-y-auto h-screen p-8 relative">
                {viewMode === 'kanban' ? (
                    <AdminKanban gifts={filteredGifts} />
                ) : (
                    <>
                        <div className="max-w-6xl mx-auto">

                            {/* Header & Tabs */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-stone-600 hover:bg-stone-200 rounded-lg">
                                        <Menu className="h-6 w-6" />
                                    </button>
                                    <div>
                                        <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
                                        <p className="text-stone-500 mt-1">Verwalte deine Connected Produkte</p>
                                    </div>
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
                                        onClick={() => { setActiveTab('noor'); setSearchParams({ tab: 'noor' }); }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'noor' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
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
                                        to={activeTab === 'noor' ? "/admin/create?project=noor" :
                                            activeTab === 'dua' ? "/admin/create?project=noor" :
                                                activeTab === 'memoria' ? "/admin/create?project=memoria" :
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
                                {/* Stats Cards */}
                                {/* Stats & Activity Feed */}
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                                    {/* Left: Stats Cards (3 Cols) */}
                                    <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 h-full">
                                        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between h-full">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider">Gesamt</p>
                                                <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-stone-900">{filteredGifts.length}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between h-full">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider">Offen</p>
                                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                                    <Unlock className="h-4 w-4" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-amber-600">{filteredGifts.filter(g => !g.locked).length}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between h-full">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider">Bereit</p>
                                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                                    <Gift className="h-4 w-4" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-emerald-600">{filteredGifts.filter(g => g.locked && !g.viewed).length}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between h-full">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider">Gesehen</p>
                                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                                    <Eye className="h-4 w-4" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-indigo-600">{filteredGifts.filter(g => g.viewed).length}</p>
                                        </div>
                                    </div>

                                    {/* Right: Activity Feed (1 Col) */}
                                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center">
                                                <Activity className="h-3 w-3 mr-2" /> Live Aktivität
                                            </h3>
                                            <span className="block h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                                        </div>
                                        <div className="space-y-4 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                                            {activities.length === 0 ? (
                                                <p className="text-xs text-stone-400">Keine Aktivitäten</p>
                                            ) : (
                                                activities.map((act, i) => (
                                                    <div key={i} className="flex gap-3 items-start group">
                                                        <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${act.type === 'viewed' ? 'bg-indigo-500' : act.type === 'locked' ? 'bg-emerald-500' : 'bg-stone-300'}`}></div>
                                                        <div>
                                                            <p className="text-xs font-medium text-stone-800 leading-tight">
                                                                {act.type === 'created' && <>Neuer Auftrag für <span className="font-bold">{act.gift.customerName || act.gift.senderName || 'Kunde'}</span></>}
                                                                {act.type === 'viewed' && <><span className="font-bold">{act.gift.recipientName || 'Empfänger'}</span> hat das Geschenk angesehen!</>}
                                                                {act.type === 'locked' && <>Geschenk für <span className="font-bold">{act.gift.recipientName}</span> ist jetzt fertig.</>}
                                                            </p>
                                                            <p className="text-[10px] text-stone-400 mt-0.5 flex items-center">
                                                                <Clock className="h-2.5 w-2.5 mr-1" />
                                                                {act.date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {filteredGifts.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                                        <Gift className="h-12 w-12 mx-auto text-stone-300 mb-4" />
                                        <h3 className="text-lg font-medium text-stone-900">Keine Aufträge</h3>
                                        <p className="text-stone-500">In diesem Projekt ist noch nichts los.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col max-h-[calc(100vh-16rem)]">
                                            <div className="overflow-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-stone-50 border-b border-stone-200 text-xs font-bold uppercase text-stone-500 tracking-wider sticky top-0 z-10">
                                                        <tr>
                                                            <th className="p-2 pl-4">Status</th>
                                                            <th className="p-2">Produkt</th>
                                                            <th className="p-2">Kunde</th>
                                                            <th className="p-2 hidden md:table-cell">Bestell-Nr.</th>
                                                            <th className="p-2 text-right pr-4">Aktionen</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-stone-100 bg-white">
                                                        {filteredGifts.map((gift, index) => (
                                                            <React.Fragment key={gift.id}>
                                                                <tr
                                                                    onClick={() => toggleExpand(gift.id)}
                                                                    onMouseEnter={() => setHoveredGift(gift)}
                                                                    onMouseLeave={() => setHoveredGift(null)}
                                                                    className={`cursor-pointer hover:bg-stone-100 transition-colors ${expandedId === gift.id ? 'bg-emerald-50/60 ring-1 ring-inset ring-emerald-100' : index % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}`}
                                                                >
                                                                    {/* Column 1: Status */}
                                                                    <td className="p-2 pl-4 align-middle">
                                                                        <div className="flex flex-col items-start gap-1">
                                                                            {gift.locked ? (
                                                                                <span className="inline-flex items-center space-x-1 bg-stone-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                                                    <Lock className="h-3 w-3" /> <span>FERTIG</span>
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                                                    <Unlock className="h-3 w-3" /> <span>OFFEN</span>
                                                                                </span>
                                                                            )}
                                                                            {gift.viewed && (
                                                                                <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                                                    <Check className="h-3 w-3" /> <span>EMPFANGEN</span>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    {/* Column 2: Product */}
                                                                    <td className="p-2 align-middle">
                                                                        <div className="flex items-center space-x-3">
                                                                            <div className={`p-2 rounded-lg shrink-0 ${gift.project === 'noor' || gift.project === 'dua' ? 'bg-emerald-100 text-emerald-600' : gift.project === 'memoria' ? 'bg-stone-100 text-stone-600' : gift.productType === 'bracelet' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                                                                                {gift.project === 'noor' || gift.project === 'dua' ? <Zap className="h-4 w-4" /> :
                                                                                    gift.project === 'memoria' ? <Heart className="h-4 w-4" /> :
                                                                                        gift.productType === 'bracelet' ? <Watch className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-stone-900 text-sm">
                                                                                    {(gift.project === 'noor' || gift.project === 'dua') ? (gift.title || 'Noor') :
                                                                                        gift.project === 'memoria' ? (gift.deceasedName || 'Memoria') :
                                                                                            (gift.headline ? gift.headline.substring(0, 20) + (gift.headline.length > 20 ? '...' : '') : 'Multimedia Tasse')}
                                                                                </div>
                                                                                <div className="text-xs text-stone-400">
                                                                                    {(gift.project === 'noor' || gift.project === 'dua') ? 'Noor' : gift.project === 'memoria' ? 'Memoria' : gift.productType === 'bracelet' ? 'Armband' : 'Tasse'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>


                                                                    {/* Column 4: Customer */}
                                                                    <td className="p-2 align-middle">
                                                                        <div className="text-sm font-medium text-stone-900">{gift.customerName || gift.senderName || gift.recipientName || 'Unbekannt'}</div>
                                                                        <div className="text-xs text-stone-400 truncate max-w-[150px]" title={gift.customerEmail}>
                                                                            {gift.customerEmail || '-'}
                                                                        </div>
                                                                    </td>

                                                                    {/* Column 5: Order ID */}
                                                                    <td className="p-2 align-middle hidden md:table-cell">
                                                                        <span className="font-mono text-xs text-stone-500">{gift.orderId || 'MANUAL'}</span>
                                                                    </td>

                                                                    {/* Column 6: Actions */}
                                                                    <td className="p-2 align-middle text-right pr-4">
                                                                        <div className="flex justify-end items-center space-x-1" onClick={e => e.stopPropagation()}>
                                                                            {/* Link Copy (For Customers) */}
                                                                            {!gift.locked && (
                                                                                <button
                                                                                    onClick={e => {
                                                                                        e.stopPropagation();
                                                                                        const tokenPart = gift.securityToken ? `?token=${gift.securityToken}` : '';
                                                                                        const name = gift.customerName || gift.senderName || gift.recipientName || 'Kunde';
                                                                                        navigator.clipboard.writeText(`Hallo ${name}, bitte richte dein Geschenk hier ein: https://scan.kamlimos.com/setup/${gift.id}${tokenPart}`);
                                                                                        alert("Link kopiert!");
                                                                                    }}
                                                                                    className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors"
                                                                                    title="Link kopieren"
                                                                                >
                                                                                    <Copy className="h-4 w-4" />
                                                                                </button>
                                                                            )}

                                                                            {/* Toggle Viewed */}
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const newStatus = !gift.viewed;
                                                                                    updateGift(gift.id, { viewed: newStatus, viewedAt: newStatus ? new Date() : null });
                                                                                    setGifts(gifts.map(g => g.id === gift.id ? { ...g, viewed: newStatus } : g));
                                                                                }}
                                                                                className={`p-1.5 rounded-lg transition-colors ${gift.viewed ? 'text-green-600 hover:bg-green-50' : 'text-stone-400 hover:bg-stone-100'}`}
                                                                                title={gift.viewed ? "Als ungesehen markieren" : "Als gesehen markieren"}
                                                                            >
                                                                                {gift.viewed ? <Check className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                                            </button>

                                                                            <div className="h-4 w-px bg-stone-300 mx-1"></div>

                                                                            {/* Open Viewer */}
                                                                            <a href={getViewerUrl(gift)} target="_blank" rel="noopener noreferrer" className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Ansicht öffnen">
                                                                                <ExternalLink className="h-4 w-4" />
                                                                            </a>

                                                                            {/* QR/Print */}
                                                                            <Link to={`/admin/print/${gift.id}`} target="_blank" className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg" title="QR Code">
                                                                                <Printer className="h-4 w-4" />
                                                                            </Link>

                                                                            {/* Edit */}
                                                                            <Link to={`/admin/edit/${gift.id}`} className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Bearbeiten">
                                                                                <Edit2 className="h-4 w-4" />
                                                                            </Link>

                                                                            {/* Delete */}
                                                                            <button onClick={(e) => handleDeleteClick(e, gift.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Löschen">
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </button>

                                                                            {/* Chevron */}
                                                                            <div className="pl-2 text-stone-400">
                                                                                {expandedId === gift.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* EXPANDED DETAILS */}
                                                                {expandedId === gift.id && (
                                                                    <tr>
                                                                        <td colSpan="6" className="p-0 border-none">
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                transition={{ duration: 0.2 }}
                                                                                className="bg-stone-50 border-b border-stone-200 shadow-inner"
                                                                            >
                                                                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                                                                                    {/* MAIN DETAILS */}
                                                                                    <div className="md:col-span-2 space-y-6">
                                                                                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                                                                                            <h4 className="font-bold text-stone-900 mb-4 border-b border-stone-100 pb-2">
                                                                                                {gift.project === 'noor' || gift.project === 'dua' ? 'Noor Details' :
                                                                                                    gift.project === 'memoria' ? 'Memoria Details' :
                                                                                                        gift.productType === 'bracelet' ? 'Armband Details' : 'Tasse Details'}
                                                                                            </h4>

                                                                                            {/* Timeline */}
                                                                                            <div className="mt-4 mb-8 px-2">
                                                                                                <div className="relative">
                                                                                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-stone-100 -translate-y-1/2 rounded-full"></div>
                                                                                                    <div className="relative flex justify-between">
                                                                                                        {/* Step 1: Created */}
                                                                                                        <div className="flex flex-col items-center w-1/4">
                                                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-emerald-500 border-emerald-500 text-white z-10 shadow-sm`}>
                                                                                                                <Package className="h-3.5 w-3.5" />
                                                                                                            </div>
                                                                                                            <div className="mt-2 text-center">
                                                                                                                <p className="text-[10px] font-bold text-stone-900 uppercase tracking-wide">Erstellt</p>
                                                                                                                <p className="text-[10px] text-stone-400 font-mono mt-0.5">{gift.createdAt?.toDate ? gift.createdAt.toDate().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '-'}</p>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {/* Step 2: Setup (Started) */}
                                                                                                        <div className="flex flex-col items-center w-1/4">
                                                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 shadow-sm transition-colors ${gift.setupStarted || gift.locked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-stone-200 text-stone-300'}`}>
                                                                                                                <Edit2 className="h-3.5 w-3.5" />
                                                                                                            </div>
                                                                                                            <div className="mt-2 text-center">
                                                                                                                <p className={`text-[10px] font-bold uppercase tracking-wide ${gift.setupStarted || gift.locked ? 'text-stone-900' : 'text-stone-300'}`}>Bearbeitet</p>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {/* Step 3: Locked (Ready) */}
                                                                                                        <div className="flex flex-col items-center w-1/4">
                                                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 shadow-sm transition-colors ${gift.locked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-stone-200 text-stone-300'}`}>
                                                                                                                <Lock className="h-3.5 w-3.5" />
                                                                                                            </div>
                                                                                                            <div className="mt-2 text-center">
                                                                                                                <p className={`text-[10px] font-bold uppercase tracking-wide ${gift.locked ? 'text-stone-900' : 'text-stone-300'}`}>Fertig</p>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {/* Step 4: Viewed */}
                                                                                                        <div className="flex flex-col items-center w-1/4">
                                                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 shadow-sm transition-colors ${gift.viewed ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-stone-200 text-stone-300'}`}>
                                                                                                                <Eye className="h-3.5 w-3.5" />
                                                                                                            </div>
                                                                                                            <div className="mt-2 text-center">
                                                                                                                <p className={`text-[10px] font-bold uppercase tracking-wide ${gift.viewed ? 'text-indigo-600' : 'text-stone-300'}`}>Gesehen</p>
                                                                                                                <p className="text-[10px] text-stone-400 font-mono mt-0.5">{gift.viewedAt?.toDate ? gift.viewedAt.toDate().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '-'}</p>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                                                                                {/* NOOR */}
                                                                                                {(gift.project === 'noor' || gift.project === 'dua') && (
                                                                                                    <>
                                                                                                        <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Titel</span> {gift.title || '-'}</div>
                                                                                                        <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Audio</span> {gift.audioUrl ? '✅ Vorhanden' : '❌ Fehlt'}</div>
                                                                                                    </>
                                                                                                )}
                                                                                                {/* MEMORIA */}
                                                                                                {gift.project === 'memoria' && (
                                                                                                    <>
                                                                                                        <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Verstorbener</span> {gift.deceasedName || '-'}</div>
                                                                                                        <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Lebensdaten</span> {gift.lifeDates || '-'}</div>
                                                                                                        <div className="col-span-2"><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Geschichte</span> <p className="line-clamp-2">{gift.meaningText || '-'}</p></div>
                                                                                                    </>
                                                                                                )}
                                                                                                {/* TASSE / BRACELET */}
                                                                                                {(!gift.project || gift.project === 'kamlimos' || gift.project === 'ritual') && (
                                                                                                    <>
                                                                                                        {gift.productType === 'bracelet' && (
                                                                                                            <div className="col-span-2"><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Gravur</span> <code className="bg-stone-100 px-2 py-1 rounded">{gift.engravingText}</code></div>
                                                                                                        )}
                                                                                                        {gift.productType !== 'bracelet' && (
                                                                                                            <>
                                                                                                                <div>
                                                                                                                    <span className="text-xs text-stone-400 font-bold uppercase block mb-1">Intro Titel</span>
                                                                                                                    <span className="font-serif italic text-lg">{gift.headline || 'Standard'}</span>
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    <span className="text-xs text-stone-400 font-bold uppercase block mb-1">Design</span>
                                                                                                                    {gift.designImage ? <img src={gift.designImage} className="h-12 w-12 rounded border border-stone-200" /> : '-'}
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    <span className="text-xs text-stone-400 font-bold uppercase block mb-1">Inhalte</span>
                                                                                                                    {gift.messages?.length || 0} Beiträge
                                                                                                                </div>
                                                                                                            </>
                                                                                                        )}
                                                                                                    </>
                                                                                                )}
                                                                                            </div>

                                                                                            {/* Meta Info Footer */}
                                                                                            <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between items-center text-xs text-stone-400">
                                                                                                <div className="flex flex-col gap-1">
                                                                                                    <span>Erstellt: {gift.createdAt?.toDate ? gift.createdAt.toDate().toLocaleString('de-DE') : 'Unbekannt'}</span>
                                                                                                    <span>ID: <span className="font-mono select-all text-stone-500">{gift.id}</span></span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* META DATA (Simplified/Repeated for Context) */}
                                                                                    <div className="space-y-4">
                                                                                        <div>
                                                                                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">System Infos</h4>
                                                                                            <dl className="space-y-2 text-sm">
                                                                                                <div className="flex justify-between border-b border-stone-200 pb-2">
                                                                                                    <dt className="text-stone-500">Erstellt am</dt>
                                                                                                    <dd>{gift.createdAt?.toDate ? gift.createdAt.toDate().toLocaleDateString() : 'N/A'}</dd>
                                                                                                </div>
                                                                                                <div className="flex justify-between border-b border-stone-200 pb-2">
                                                                                                    <dt className="text-stone-500">PIN Code</dt>
                                                                                                    <dd className="font-mono font-bold">{gift.accessCode || '-'}</dd>
                                                                                                </div>
                                                                                            </dl>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Mobile List View */}
                                        <div className="md:hidden space-y-3">
                                            {filteredGifts.map((gift) => (
                                                <div key={gift.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden relative">
                                                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${gift.locked ? 'bg-stone-800' : 'bg-amber-400'}`}></div>
                                                    <div className="p-4 pl-5">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center space-x-3">
                                                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${gift.project === 'noor' || gift.project === 'dua' ? 'bg-emerald-100 text-emerald-600' : gift.project === 'memoria' ? 'bg-stone-100 text-stone-600' : gift.productType === 'bracelet' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                                                                    {gift.project === 'noor' || gift.project === 'dua' ? <Zap className="h-5 w-5" /> : gift.project === 'memoria' ? <Heart className="h-5 w-5" /> : gift.productType === 'bracelet' ? <Watch className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-stone-900 leading-tight">
                                                                        {gift.customerName || gift.recipientName || gift.customerEmail || 'Unbekannt'}
                                                                    </div>
                                                                    <div className="text-xs text-stone-500">
                                                                        {(gift.project === 'noor' || gift.project === 'dua') ? 'Noor' : gift.project === 'memoria' ? 'Memoria' : gift.productType === 'bracelet' ? 'Armband' : 'Multimedia Tasse'}
                                                                        <span className="mx-1">•</span>
                                                                        {gift.orderId || '#'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newStatus = !gift.viewed;
                                                                    updateGift(gift.id, { viewed: newStatus, viewedAt: newStatus ? new Date() : null });
                                                                    setGifts(gifts.map(g => g.id === gift.id ? { ...g, viewed: newStatus } : g));
                                                                }}
                                                                className={`p-1.5 rounded-full ${gift.viewed ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400'}`}
                                                            >
                                                                {gift.viewed ? <Check className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-100">
                                                            <Link to={`/admin/edit/${gift.id}`} className="flex flex-col items-center justify-center p-2 rounded-lg bg-stone-50 text-stone-600 active:bg-stone-200">
                                                                <Edit2 className="h-4 w-4 mb-1" />
                                                                <span className="text-[10px] font-bold uppercase">Edit</span>
                                                            </Link>
                                                            <a href={getViewerUrl(gift)} target="_blank" className="flex flex-col items-center justify-center p-2 rounded-lg bg-stone-50 text-stone-600 active:bg-stone-200">
                                                                <ExternalLink className="h-4 w-4 mb-1" />
                                                                <span className="text-[10px] font-bold uppercase">View</span>
                                                            </a>
                                                            <button onClick={() => toggleExpand(gift.id)} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${expandedId === gift.id ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-600'}`}>
                                                                {expandedId === gift.id ? <ChevronUp className="h-4 w-4 mb-1" /> : <ChevronDown className="h-4 w-4 mb-1" />}
                                                                <span className="text-[10px] font-bold uppercase">Info</span>
                                                            </button>
                                                        </div>

                                                        <AnimatePresence>
                                                            {expandedId === gift.id && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="mt-4 border-t border-stone-100 pt-4"
                                                                >
                                                                    <div className="space-y-4 text-sm">
                                                                        {gift.customerName && <div><span className="font-bold text-xs uppercase text-stone-400 block mb-1">Kunde</span> {gift.customerName}</div>}
                                                                        {gift.customerEmail && <div><span className="font-bold text-xs uppercase text-stone-400 block mb-1">Email</span> {gift.customerEmail}</div>}
                                                                        {gift.productType === 'bracelet' ? (
                                                                            gift.engravingText && <div><span className="font-bold text-xs uppercase text-stone-400 block mb-1">Gravur</span> {gift.engravingText}</div>
                                                                        ) : (
                                                                            <>
                                                                                {gift.headline && <div><span className="font-bold text-xs uppercase text-stone-400 block mb-1">Titel</span> {gift.headline}</div>}
                                                                                <div><span className="font-bold text-xs uppercase text-stone-400 block mb-1">Inhalte</span> {gift.messages?.length || 0} Beiträge</div>
                                                                            </>
                                                                        )}
                                                                        <div className="pt-2">
                                                                            <button onClick={(e) => handleDeleteClick(e, gift.id)} className="w-full py-2 text-red-600 font-bold text-xs uppercase bg-red-50 rounded-lg">Löschen</button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
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
                                                <label className="block text-sm font-medium text-stone-700 mb-1">Kunden E-Mail (Optional)</label>
                                                <input
                                                    type="email"
                                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                                                    placeholder="kunde@email.com"
                                                    value={etsyForm.buyerEmail || ''}
                                                    onChange={e => setEtsyForm({ ...etsyForm, buyerEmail: e.target.value })}
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
                                                        customerEmail: etsyForm.buyerEmail, // The Buyer Email
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

            {/* Magic Live Preview Overlay */}
            <AnimatePresence>
                {hoveredGift && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-8 right-8 w-60 z-50 pointer-events-none"
                    >
                        <div className="relative bg-stone-900 rounded-[2rem] border-4 border-stone-800 shadow-2xl overflow-hidden aspect-[9/16] flex flex-col">
                            {/* iPhone Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-stone-800 rounded-b-lg z-20"></div>

                            {/* Content */}
                            <div className="flex-1 bg-stone-50 relative flex flex-col">
                                {(hoveredGift.designImage || hoveredGift.photoUrl) ? (
                                    <img src={hoveredGift.designImage || hoveredGift.photoUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${hoveredGift.project === 'noor' || hoveredGift.project === 'dua' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                        {hoveredGift.project === 'noor' || hoveredGift.project === 'dua' ? (
                                            <div className="text-center p-4">
                                                <Zap className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                                <p className="text-xs font-bold text-emerald-900">{hoveredGift.title}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center p-4">
                                                <Coffee className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                                                <p className="text-xs font-bold text-rose-900">{hoveredGift.headline || 'Deine Botschaft'}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Overlay Text */}
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                                    <p className="text-[10px] opacity-80 uppercase tracking-widest mb-1">Vorschau</p>
                                    <p className="text-xs font-bold line-clamp-2">{hoveredGift.headline || hoveredGift.title || hoveredGift.recipientName}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
