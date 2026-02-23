import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getGifts, deleteGift, updateGift } from "../services/gifts";
import {
  Plus,
  Loader,
  Menu,
  ShoppingBag,
  Heart,
  Search,
  X,
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import AdminKanban from "../components/AdminKanban";
import AdminStats from "../components/admin/AdminStats";
import AdminGiftTable from "../components/admin/AdminGiftTable";
import EtsyModal from "../components/modals/EtsyModal";
import MemoriaModal from "../components/modals/MemoriaModal";
import DeleteModal from "../components/modals/DeleteModal";

export default function AdminDashboard() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState("list");
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
  const [searchQuery, setSearchQuery] = useState("");

  // Active Tab direkt aus URL lesen (nicht als State)
  const activeTab = searchParams.get("tab") || "kamlimos";

  // Bulk Select State
  const [selectedGifts, setSelectedGifts] = useState(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const data = await getGifts();
        data.sort((a, b) => {
          const getT = (t) => (t ? t.seconds || t._seconds || 0 : 0);
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
    fetchGifts();
  }, []);

  const filteredGifts = gifts.filter((g) => {
    // Tab-Filter
    let matchesTab = false;
    if (activeTab === "noor" || activeTab === "dua")
      matchesTab = g.project === "noor" || g.project === "dua";
    else if (activeTab === "memoria") matchesTab = g.project === "memoria";
    else if (activeTab === "ritual")
      matchesTab =
        g.project === "ritual" ||
        (g.productType === "bracelet" &&
          (!g.project || g.project === "kamlimos"));
    else
      matchesTab =
        (!g.project || g.project === "kamlimos") &&
        g.productType !== "bracelet";

    if (!matchesTab) return false;

    // Search-Filter
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const searchFields = [
      g.customerName || "",
      g.customerEmail || "",
      g.senderName || "",
      g.recipientName || "",
      g.orderId || "",
      g.id || "",
      g.headline || "",
      g.title || "",
      g.deceasedName || "",
    ];

    return searchFields.some((field) => field.toLowerCase().includes(query));
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
      setGifts(gifts.filter((g) => g.id !== deleteId));
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
    setSelectedGifts(new Set(filteredGifts.map((g) => g.id)));
  };

  const deselectAll = () => {
    setSelectedGifts(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedGifts.size === 0) return;
    setBulkDeleteIds(Array.from(selectedGifts));
    setDeleteId("bulk"); // Special marker for bulk delete
  };

  const confirmBulkDelete = async () => {
    if (bulkDeleteIds.length === 0) return;
    setIsDeleting(true);
    try {
      // Delete all selected gifts
      await Promise.all(bulkDeleteIds.map((id) => deleteGift(id)));
      setGifts(gifts.filter((g) => !bulkDeleteIds.includes(g.id)));
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
      setGifts(
        gifts.map((g) => (g.id === gift.id ? { ...g, viewed: newStatus } : g))
      );
      await updateGift(gift.id, {
        viewed: newStatus,
        viewedAt: newStatus ? new Date() : null,
      });
    } catch (e) {
      console.error("Failed to update viewed status", e);
      // Revert on error
      setGifts(
        gifts.map((g) => (g.id === gift.id ? { ...g, viewed: !newStatus } : g))
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <Loader className="h-8 w-8 animate-spin text-brand-patina" />
      </div>
    );
  }

  return (
    <div className="flex bg-brand-cream min-h-screen font-sans">
      <AdminSidebar
        activeView={viewMode}
        onViewChange={setViewMode}
        onRefresh={() => window.location.reload()}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto h-screen p-8 relative">
        {viewMode === "kanban" ? (
          <AdminKanban gifts={filteredGifts} />
        ) : (
          <>
            <div className="max-w-6xl mx-auto">
              {/* Header & Tabs */}
              <div className="mb-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="md:hidden p-2 -ml-2 text-brand-text hover:bg-brand-cream-tint rounded-lg"
                    >
                      <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex-1">
                      <h1 className="text-3xl font-display font-bold text-brand-anthracite">
                        Dashboard
                      </h1>
                      <p className="text-brand-text mt-1">
                        Verwalte deine Connected Produkte
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {/* Bulk Select Toggle */}
                    <button
                      onClick={toggleSelectMode}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelectMode
                          ? "btn-primary"
                          : "btn-secondary"
                      }`}
                    >
                      {isSelectMode ? "Auswahl beenden" : "Auswählen"}
                    </button>
                    
                    {/* Action Buttons */}
                    {activeTab === "kamlimos" && (
                      <button
                        onClick={() => setShowEtsyModal(true)}
                        className="btn-secondary inline-flex items-center px-4 py-2 rounded-lg text-sm shrink-0"
                      >
                        <ShoppingBag className="h-5 w-5 mr-2 text-brand-patina" />
                        Etsy Simulieren
                      </button>
                    )}
                    {activeTab === "memoria" && (
                      <button
                        onClick={() => setShowMemoriaModal(true)}
                        className="btn-secondary inline-flex items-center px-4 py-2 rounded-lg text-sm shrink-0"
                      >
                        <Heart className="h-5 w-5 mr-2 text-brand-patina" />
                        Memoria Auftrag
                      </button>
                    )}
                    <Link
                      to={
                        activeTab === "noor"
                          ? "/admin/create?project=noor"
                          : activeTab === "dua"
                          ? "/admin/create?project=noor"
                          : activeTab === "memoria"
                          ? "/admin/create?project=memoria"
                          : activeTab === "ritual"
                          ? "/admin/create?project=ritual"
                          : "/admin/create?project=tasse"
                      }
                      className="btn-primary inline-flex items-center px-4 py-2 rounded-lg text-sm shrink-0"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Neuer Auftrag
                    </Link>
                  </div>
                </div>
                
                {/* TABS */}
                <div className="flex gap-1 border-b border-brand-border overflow-x-auto">
                  {["kamlimos", "noor", "memoria", "ritual"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set("tab", tab);
                        setSearchParams(newParams);
                      }}
                      className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap capitalize border-b-2 ${
                        activeTab === tab
                          ? "text-brand-anthracite border-brand-anthracite"
                          : "text-brand-text border-transparent hover:text-brand-anthracite hover:border-brand-border"
                      }`}
                    >
                      {tab === "kamlimos"
                        ? "Tasse"
                        : tab === "ritual"
                        ? "Armband"
                        : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Input */}
              <div className="max-w-6xl mx-auto mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-text/70" />
                  <input
                    type="text"
                    placeholder="Suche nach Name, Email, Bestellnummer, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-base w-full pl-12 pr-12 py-3 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-brand-cream-tint rounded-lg transition-colors"
                      title="Suche löschen"
                    >
                      <X className="h-4 w-4 text-brand-text/70" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <p className="mt-2 text-sm text-brand-text">
                    {filteredGifts.length}{" "}
                    {filteredGifts.length === 1 ? "Ergebnis" : "Ergebnisse"}{" "}
                    gefunden
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <AdminStats gifts={gifts} filteredGifts={filteredGifts} />

                {/* Bulk Actions Toolbar */}
                {isSelectMode && selectedGifts.size > 0 && (
                  <div className="mb-4 p-4 bg-brand-patina/10 border border-brand-patina/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-brand-anthracite">
                        {selectedGifts.size}{" "}
                        {selectedGifts.size === 1 ? "Item" : "Items"} ausgewählt
                      </span>
                      <button
                        onClick={
                          selectedGifts.size === filteredGifts.length
                            ? deselectAll
                            : selectAll
                        }
                        className="text-sm text-brand-patina hover:text-brand-patina-hover underline"
                      >
                        {selectedGifts.size === filteredGifts.length
                          ? "Alle abwählen"
                          : "Alle auswählen"}
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
              onConfirm={
                deleteId === "bulk" ? confirmBulkDelete : confirmDelete
              }
              isDeleting={isDeleting}
              itemName={
                deleteId === "bulk"
                  ? `${bulkDeleteIds.length} Geschenke`
                  : gifts.find((g) => g.id === deleteId)?.customerName ||
                    "Geschenk"
              }
            />
          </>
        )}
      </main>
    </div>
  );
}
