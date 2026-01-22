
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getGifts, deleteGift, updateGift } from '../services/gifts';
import { Plus, Loader, Menu, ShoppingBag } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminKanban from '../components/AdminKanban';
import AdminStats from '../components/admin/AdminStats';
import AdminGiftTable from '../components/admin/AdminGiftTable';
import EtsyModal from '../components/modals/EtsyModal';
import DeleteModal from '../components/modals/DeleteModal';

export default function AdminDashboard() {
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Etsy Modal State
    const [showEtsyModal, setShowEtsyModal] = useState(false);

    // Delete Modal State
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'kamlimos');

    useEffect(() => {
        fetchGifts();
    }, []);

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
        if (activeTab === 'noor' || activeTab === 'dua') return g.project === 'noor' || g.project === 'dua';
        if (activeTab === 'memoria') return g.project === 'memoria';
        if (activeTab === 'ritual') return g.project === 'ritual' || (g.productType === 'bracelet' && (!g.project || g.project === 'kamlimos'));
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
                                    <div>
                                        <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
                                        <p className="text-stone-500 mt-1">Verwalte deine Connected Produkte</p>
                                    </div>
                                </div>

                                {/* TABS */}
                                <div className="flex p-1 bg-stone-200 rounded-xl overflow-x-auto">
                                    {['kamlimos', 'noor', 'memoria', 'ritual'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => { setActiveTab(tab); setSearchParams({ tab }); }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap capitalize ${activeTab === tab ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                                                }`}
                                        >
                                            {tab === 'kamlimos' ? 'Tasse' : tab === 'ritual' ? 'Armband' : tab}
                                        </button>
                                    ))}
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
                                <AdminStats gifts={gifts} filteredGifts={filteredGifts} />
                                <AdminGiftTable
                                    gifts={filteredGifts}
                                    expandedId={expandedId}
                                    onToggleExpand={toggleExpand}
                                    onDeleteClick={handleDeleteClick}
                                    onToggleViewed={handleToggleViewed}
                                />
                            </div>
                        </div>

                        {/* Modals */}
                        <EtsyModal
                            isOpen={showEtsyModal}
                            onClose={() => setShowEtsyModal(false)}
                            onSuccess={() => window.location.reload()}
                        />

                        <DeleteModal
                            isOpen={!!deleteId}
                            onClose={() => setDeleteId(null)}
                            onConfirm={confirmDelete}
                            isDeleting={isDeleting}
                        />
                    </>
                )}
            </main>
        </div>
    );
}
