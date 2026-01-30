
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getGifts, deleteGift, updateGift } from '../services/gifts';
import { Plus, Loader, Menu, ShoppingBag, Heart, Search, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminKanban from '../components/AdminKanban';
import AdminStats from '../components/admin/AdminStats';
import AdminGiftTable from '../components/admin/AdminGiftTable';
import EtsyModal from '../components/modals/EtsyModal';
import MemoriaModal from '../components/modals/MemoriaModal';
import DeleteModal from '../components/modals/DeleteModal';

export default function AdminDashboard() {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Etsy Modal State
    const [showEtsyModal, setShowEtsyModal] = useState(false);
    
    // Memoria Modal State
    const [showMemoriaModal, setShowMemoriaModal] = useState(false);

    // Delete Modal State
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [bulkDeleteIds, setBulkDeleteIds] = useState([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    
    // Active Tab aus URL lesen
    const activeTab = searchParams.get('tab') || 'kamlimos';
    
    // Reagiere auf Tab-Änderungen in der URL
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab') || 'kamlimos';
        // Tab ist bereits in activeTab gesetzt, keine weitere Aktion nötig
    }, [searchParams]);
    const viewParam = searchParams.get('view');
    
    // Bulk Select State
    const [selectedGifts, setSelectedGifts] = useState(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);

    useEffect(() => {
        fetchGifts();
    }, []);

    // Setze View-Mode basierend auf URL Parameter
    useEffect(() => {
        if (viewParam === 'kanban' && viewMode !== 'kanban') {
            setViewMode('kanban');
        } else if (viewParam === 'list' && viewMode !== 'list') {
            setViewMode('list');
        } else if (!viewParam && viewMode !== 'list') {
            // Default zu 'list' wenn kein Parameter
            setViewMode('list');
        }
    }, [viewParam]);

    // Auto-select from URL
    useEffect(() => {
        const selectId = searchParams.get('select');
        if (selectId && gifts.length > 0) {
            const gift = gifts.find(g => g.id === selectId);
            if (gift) {
                setExpandedId(selectId);
                let targetTab = 'kamlimos';
                if (gift.project === 'noor' || gift.project === 'dua') targetTab = 'noor';
                else if (gift.project === 'memoria') targetTab = 'memoria';
                else if (gift.project === 'ritual' || gift.productType === 'bracelet') targetTab = 'ritual';

                if (activeTab !== targetTab) {
                    setActiveTab(targetTab);
                }
            }
        }
    }, [searchParams, gifts]);

    const fetchGifts = async () => {
        try {
            const data = await getGifts();
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
        // Tab-Filter
        let matchesTab = false;
        if (activeTab === 'noor' || activeTab === 'dua') matchesTab = g.project === 'noor' || g.project === 'dua';
        else if (activeTab === 'memoria') matchesTab = g.project === 'memoria';
        else if (activeTab === 'ritual') matchesTab = g.project === 'ritual' || (g.productType === 'bracelet' && (!g.project || g.project === 'kamlimos'));
        else matchesTab = (!g.project || g.project === 'kamlimos') && g.productType !== 'bracelet';
        
        if (!matchesTab) return false;
        
        // Search-Filter
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase().trim();
        const searchFields = [
            g.customerName || '',
            g.customerEmail || '',
            g.senderName || '',
            g.recipientName || '',
            g.orderId || '',
            g.id || '',
            g.headline || '',
            g.title || '',
            g.deceasedName || ''
        ];
        
        return searchFields.some(field => field.toLowerCase().includes(query));
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
            setSelectedGifts(new Set());
        } catch (error) {
            console.error("Failed to delete gift", error);
            alert("Fehler beim Löschen des Geschenks.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Bulk Select Functions
    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        if (isSelectMode) {
            setSelectedGifts(new Set());
        }
    };

    const toggleSelectGift = (giftId) => {
        const newSelected = new Set(selectedGifts);
        if (newSelected.has(giftId)) {
            newSelected.delete(giftId);
        } else {
            newSelected.add(giftId);
        }
        setSelectedGifts(newSelected);
    };

    const selectAll = () => {
        setSelectedGifts(new Set(filteredGifts.map(g => g.id)));
    };

    const deselectAll = () => {
        setSelectedGifts(new Set());
    };

    const handleBulkDelete = () => {
        if (selectedGifts.size === 0) return;
        setBulkDeleteIds(Array.from(selectedGifts));
        setDeleteId('bulk'); // Special marker for bulk delete
    };

    const confirmBulkDelete = async () => {
        if (bulkDeleteIds.length === 0) return;
        setIsDeleting(true);
        try {
            // Delete all selected gifts
            await Promise.all(bulkDeleteIds.map(id => deleteGift(id)));
            setGifts(gifts.filter(g => !bulkDeleteIds.includes(g.id)));
            setSelectedGifts(new Set());
            setBulkDeleteIds([]);
            setDeleteId(null);
            setIsSelectMode(false);
        } catch (error) {
            console.error("Failed to delete gifts", error);
            alert("Fehler beim Löschen der Geschenke.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleViewed = async (gift) => {
        const newStatus = !gift.viewed;
        try {
            // Optimistic update
            setGifts(gifts.map(g => g.id === gift.id ? { ...g, viewed: newStatus } : g));
            await updateGift(gift.id, { viewed: newStatus, viewedAt: newStatus ? new Date() : null });
        } catch (e) {
            console.error("Failed to update viewed status", e);
            // Revert on error
            setGifts(gifts.map(g => g.id === gift.id ? { ...g, viewed: !newStatus } : g));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader className="h-8 w-8 animate-spin text-rose-600" />
            </div>
        );
    }

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
                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
                                        <p className="text-stone-500 mt-1">Verwalte deine Connected Produkte</p>
                                    </div>
                                    {/* Bulk Select Toggle */}
                                    <button
                                        onClick={toggleSelectMode}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                            isSelectMode
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                                        }`}
                                    >
                                        {isSelectMode ? 'Auswahl beenden' : 'Auswählen'}
                                    </button>
                                </div>

                                {/* TABS - Werkstatt Style (wie Schubladen) */}
                                <div className="flex gap-1 border-b border-stone-200 overflow-x-auto">
                                    {['kamlimos', 'noor', 'memoria', 'ritual'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => { setActiveTab(tab); setSearchParams({ tab }); }}
                                            className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap capitalize border-b-2 ${
                                                activeTab === tab 
                                                    ? 'text-[#2C2C2C] border-[#2C2C2C]' 
                                                    : 'text-stone-500 border-transparent hover:text-stone-700 hover:border-stone-300'
                                            }`}
                                        >
                                            {tab === 'kamlimos' ? 'Tasse' : tab === 'ritual' ? 'Armband' : tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex space-x-3">
                                    {activeTab === 'kamlimos' && (
                                        <button
                                            onClick={() => setShowEtsyModal(true)}
                                            className="inline-flex items-center px-4 py-2 border border-stone-200 rounded-xl shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 transition-colors shrink-0"
                                        >
                                            <ShoppingBag className="h-5 w-5 mr-2 text-rose-600" />
                                            Etsy Simulieren
                                        </button>
                                    )}
                                    {activeTab === 'memoria' && (
                                        <button
                                            onClick={() => setShowMemoriaModal(true)}
                                            className="inline-flex items-center px-4 py-2 border border-stone-200 rounded-xl shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 transition-colors shrink-0"
                                        >
                                            <Heart className="h-5 w-5 mr-2 text-rose-600" />
                                            Memoria Auftrag
                                        </button>
                                    )}
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

                            {/* Search Input */}
                            <div className="max-w-6xl mx-auto mb-6">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
                                    <input
                                        type="text"
                                        placeholder="Suche nach Name, Email, Bestellnummer, ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3 border border-stone-200 rounded-xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-stone-100 rounded-lg transition-colors"
                                            title="Suche löschen"
                                        >
                                            <X className="h-4 w-4 text-stone-400" />
                                        </button>
                                    )}
                                </div>
                                {searchQuery && (
                                    <p className="mt-2 text-sm text-stone-500">
                                        {filteredGifts.length} {filteredGifts.length === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <AdminStats gifts={gifts} filteredGifts={filteredGifts} />
                                
                                {/* Bulk Actions Toolbar */}
                                {isSelectMode && selectedGifts.size > 0 && (
                                    <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-rose-900">
                                                {selectedGifts.size} {selectedGifts.size === 1 ? 'Item' : 'Items'} ausgewählt
                                            </span>
                                            <button
                                                onClick={selectedGifts.size === filteredGifts.length ? deselectAll : selectAll}
                                                className="text-sm text-rose-700 hover:text-rose-900 underline"
                                            >
                                                {selectedGifts.size === filteredGifts.length ? 'Alle abwählen' : 'Alle auswählen'}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleBulkDelete}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Löschen ({selectedGifts.size})
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <AdminGiftTable
                                    gifts={filteredGifts}
                                    expandedId={expandedId}
                                    onToggleExpand={toggleExpand}
                                    onDeleteClick={handleDeleteClick}
                                    onToggleViewed={handleToggleViewed}
                                    isSelectMode={isSelectMode}
                                    selectedGifts={selectedGifts}
                                    onToggleSelect={toggleSelectGift}
                                />
                            </div>
                        </div>

                        {/* Modals */}
                        <EtsyModal
                            isOpen={showEtsyModal}
                            onClose={() => setShowEtsyModal(false)}
                            onSuccess={() => window.location.reload()}
                        />

                        <MemoriaModal
                            isOpen={showMemoriaModal}
                            onClose={() => setShowMemoriaModal(false)}
                            onSuccess={() => window.location.reload()}
                        />

                        <DeleteModal
                            isOpen={deleteId !== null}
                            onClose={() => {
                                setDeleteId(null);
                                setBulkDeleteIds([]);
                            }}
                            onConfirm={deleteId === 'bulk' ? confirmBulkDelete : confirmDelete}
                            isDeleting={isDeleting}
                            itemName={deleteId === 'bulk' ? `${bulkDeleteIds.length} Geschenke` : (gifts.find(g => g.id === deleteId)?.customerName || 'Geschenk')}
                        />
                    </>
                )}
            </main>
        </div>
    );
}
