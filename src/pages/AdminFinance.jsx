import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getOrders,
  getCustomers,
  getAllSummaries,
  getSummary,
  updateOrder,
  syncEtsyOrdersNow,
  debugEtsyReceipts,
  buildCSVFromOrders,
  downloadCSV,
  getOrdersByCustomerId,
} from "../services/finance";
import {
  Loader,
  Menu,
  TrendingUp,
  ShoppingBag,
  Users,
  Settings,
  RefreshCw,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight,
  Save,
  Search,
  ArrowUpDown,
  Star,
  Package,
  Euro,
  X,
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import { toast } from "../services/toast";

const TAB_DASHBOARD = "dashboard";
const TAB_ORDERS = "orders";
const TAB_CUSTOMERS = "customers";
const TAB_SETTINGS = "settings";

const PERIOD_OPTIONS = [
  { key: "today", label: "Heute" },
  { key: "week", label: "7 Tage" },
  { key: "month", label: "Monat" },
  { key: "year", label: "Jahr" },
  { key: "all", label: "Gesamt" },
];

function formatEur(val) {
  return Number(val || 0).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(ts) {
  if (!ts) return "—";
  const s = ts.seconds || ts._seconds;
  if (!s) return "—";
  return new Date(s * 1000).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateFull(ts) {
  if (!ts) return "—";
  const s = ts.seconds || ts._seconds;
  if (!s) return "—";
  return new Date(s * 1000).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status) {
  const map = {
    delivered: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      label: "Geliefert",
    },
    shipped: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      label: "Versendet",
    },
    processing: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      label: "In Bearbeitung",
    },
  };
  const s = map[status] || map.processing;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${s.bg} ${s.text} border ${s.border}`}
    >
      {s.label}
    </span>
  );
}

export default function AdminFinance() {
  const [tab, setTab] = useState(TAB_DASHBOARD);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingEtsy, setSyncingEtsy] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [debugData, setDebugData] = useState(null);
  const [sortField, setSortField] = useState("orderDate");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    loadData(true);
  }, []);

  const loadData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [ordersData, customersData] = await Promise.all([
        getOrders(),
        getCustomers(),
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
    } catch (err) {
      console.error("Finance load failed", err);
      toast.error("Daten konnten nicht geladen werden.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncingEtsy(true);
    try {
      const result = await syncEtsyOrdersNow();
      await loadData(false);
      toast.success(
        `Sync fertig: ${result?.upserted ?? 0} aktualisiert, ${result?.newOrders ?? 0} neu`,
      );
    } catch (err) {
      console.error("Sync failed", err);
      toast.error("Sync fehlgeschlagen: " + (err?.message || "Unbekannt"));
    } finally {
      setSyncingEtsy(false);
    }
  };

  const handleSaveOrder = async (order) => {
    setSavingId(order.id);
    try {
      const a = order.amounts || {};
      const costs = Number(order.costs || 0);
      const bt = order.businessType || "mini";
      const finanzamt =
        bt === "standard"
          ? Number(((a.gross || 0) * 0.19 + (a.gross || 0) * 0.2).toFixed(2))
          : 0;
      const profit = Number(((a.payout || 0) - costs - finanzamt).toFixed(2));

      await updateOrder(order.id, { costs, businessType: bt, profit });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, costs, businessType: bt, profit } : o,
        ),
      );
      if (selectedOrder?.id === order.id)
        setSelectedOrder((p) => ({ ...p, costs, businessType: bt, profit }));
      toast.success("Gespeichert");
    } catch (err) {
      toast.error("Speichern fehlgeschlagen");
    } finally {
      setSavingId(null);
    }
  };

  const handleOrderFieldChange = (orderId, field, value) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, [field]: value } : o)),
    );
    if (selectedOrder?.id === orderId)
      setSelectedOrder((p) => ({ ...p, [field]: value }));
  };

  const copyToClipboard = async (value, label) => {
    if (!value) return toast.error(`${label} nicht vorhanden`);
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} kopiert`);
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  const openCustomerProfile = async (customer) => {
    setSelectedCustomer(customer);
    setTab(TAB_CUSTOMERS);
    try {
      const co = await getOrdersByCustomerId(customer.id);
      setCustomerOrders(co);
    } catch {
      setCustomerOrders([]);
    }
  };

  // ─── Computed data ──────────────────────────────────────

  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (period !== "all") {
      const now = new Date();
      let cutoff;
      if (period === "today")
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      else if (period === "week")
        cutoff = new Date(now.getTime() - 7 * 86400000);
      else if (period === "month")
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (period === "year") cutoff = new Date(now.getFullYear(), 0, 1);

      if (cutoff) {
        list = list.filter((o) => {
          const s =
            o.orderDate?.seconds ||
            o.orderDate?._seconds ||
            o.createdAt?.seconds ||
            o.createdAt?._seconds ||
            0;
          return s * 1000 >= cutoff.getTime();
        });
      }
    }

    if (statusFilter !== "all")
      list = list.filter((o) => o.status === statusFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          (o.customerName || "").toLowerCase().includes(q) ||
          (o.customerEmail || "").toLowerCase().includes(q) ||
          (o.platformOrderId || "").includes(q),
      );
    }

    list.sort((a, b) => {
      let av, bv;
      if (sortField === "orderDate") {
        av = a.orderDate?.seconds || a.orderDate?._seconds || 0;
        bv = b.orderDate?.seconds || b.orderDate?._seconds || 0;
      } else if (sortField === "gross") {
        av = a.amounts?.gross || 0;
        bv = b.amounts?.gross || 0;
      } else if (sortField === "profit") {
        av = a.profit || 0;
        bv = b.profit || 0;
      } else if (sortField === "name") {
        av = (a.customerName || "").toLowerCase();
        bv = (b.customerName || "").toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return list;
  }, [orders, period, statusFilter, searchQuery, sortField, sortDir]);

  const stats = useMemo(() => {
    const list = filteredOrders;
    const totalGross = list.reduce((s, o) => s + (o.amounts?.gross || 0), 0);
    const totalFees = list.reduce((s, o) => s + (o.amounts?.totalFees || 0), 0);
    const totalCosts = list.reduce((s, o) => s + (o.costs || 0), 0);
    const totalProfit = list.reduce((s, o) => s + (o.profit || 0), 0);
    const totalPayout = list.reduce((s, o) => s + (o.amounts?.payout || 0), 0);
    const totalShipping = list.reduce(
      (s, o) => s + (o.amounts?.shipping || 0),
      0,
    );
    return {
      count: list.length,
      totalGross,
      totalFees,
      totalCosts,
      totalProfit,
      totalPayout,
      totalShipping,
    };
  }, [filteredOrders]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // ─── Export ─────────────────────────────────────────────

  const handleExportCSV = () => {
    if (filteredOrders.length === 0)
      return toast.error("Keine Daten zum Export");
    const csv = buildCSVFromOrders(filteredOrders);
    const periodLabel =
      PERIOD_OPTIONS.find((p) => p.key === period)?.label || period;
    downloadCSV(
      csv,
      `kamlimos-etsy-${periodLabel}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success("CSV exportiert");
  };

  // ─── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  const formatAddr = (addr) => {
    if (!addr) return "";
    return [
      addr.name,
      [addr.firstLine, addr.secondLine].filter(Boolean).join(" "),
      [addr.zip, addr.city].filter(Boolean).join(" "),
      addr.state,
      addr.countryIso,
    ]
      .filter(Boolean)
      .join("\n");
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 rounded-lg hover:bg-stone-100"
              >
                <Menu className="h-5 w-5 text-stone-600" />
              </button>
              <h1 className="text-lg font-bold text-stone-900">
                Finanzcockpit
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSync}
                disabled={syncingEtsy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${syncingEtsy ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">
                  {syncingEtsy ? "Sync..." : "Etsy Sync"}
                </span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-stone-100 overflow-x-auto">
            {[
              { key: TAB_DASHBOARD, icon: TrendingUp, label: "Dashboard" },
              { key: TAB_ORDERS, icon: ShoppingBag, label: "Bestellungen" },
              { key: TAB_CUSTOMERS, icon: Users, label: "Kunden" },
              { key: TAB_SETTINGS, icon: Settings, label: "Einstellungen" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setSelectedOrder(null);
                  setSelectedCustomer(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.key
                    ? "border-stone-900 text-stone-900"
                    : "border-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </header>

        <main className="p-4 max-w-7xl mx-auto">
          {/* ─── DASHBOARD TAB ─────────────────────────────── */}
          {tab === TAB_DASHBOARD && (
            <div className="space-y-4">
              {/* Period Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                      period === p.key
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-600 border-stone-300 hover:border-stone-400"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  {
                    label: "Bestellungen",
                    value: stats.count,
                    icon: Package,
                    color: "text-stone-700",
                  },
                  {
                    label: "Umsatz brutto",
                    value: formatEur(stats.totalGross) + " €",
                    icon: Euro,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Etsy-Gebühren",
                    value: formatEur(stats.totalFees) + " €",
                    icon: TrendingUp,
                    color: "text-red-500",
                  },
                  {
                    label: "Versand",
                    value: formatEur(stats.totalShipping) + " €",
                    icon: Package,
                    color: "text-blue-500",
                  },
                  {
                    label: "Kosten",
                    value: formatEur(stats.totalCosts) + " €",
                    icon: ShoppingBag,
                    color: "text-amber-600",
                  },
                  {
                    label: "Profit",
                    value: formatEur(stats.totalProfit) + " €",
                    icon: TrendingUp,
                    color: "text-emerald-700",
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-white rounded-xl border border-stone-200 p-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                      <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                        {kpi.label}
                      </span>
                    </div>
                    <div className={`text-xl font-bold ${kpi.color}`}>
                      {kpi.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Auszahlung Summary */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
                      Auszahlung (nach Gebühren)
                    </div>
                    <div className="text-3xl font-bold">
                      {formatEur(stats.totalPayout)} €
                    </div>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV Export
                  </button>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl border border-stone-200">
                <div className="p-4 border-b border-stone-100">
                  <h3 className="text-sm font-bold text-stone-900">
                    Letzte Bestellungen
                  </h3>
                </div>
                <div className="divide-y divide-stone-100">
                  {filteredOrders.slice(0, 5).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setSelectedOrder(o);
                        setTab(TAB_ORDERS);
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-stone-900 truncate">
                          {o.customerName || "Unbekannt"}
                        </div>
                        <div className="text-xs text-stone-500">
                          {formatDate(o.orderDate)} · #{o.platformOrderId}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-sm font-bold text-stone-900">
                          {formatEur(o.amounts?.gross)} €
                        </div>
                        {statusBadge(o.status)}
                      </div>
                    </button>
                  ))}
                  {filteredOrders.length === 0 && (
                    <div className="p-8 text-center text-stone-500 text-sm">
                      Keine Bestellungen im gewählten Zeitraum.
                    </div>
                  )}
                </div>
              </div>

              {/* Top Customers */}
              {customers.length > 0 && (
                <div className="bg-white rounded-xl border border-stone-200">
                  <div className="p-4 border-b border-stone-100">
                    <h3 className="text-sm font-bold text-stone-900">
                      Top-Kunden
                    </h3>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {[...customers]
                      .sort(
                        (a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0),
                      )
                      .slice(0, 5)
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => openCustomerProfile(c)}
                          className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors text-left"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-stone-900 truncate">
                                {c.name || "Unbekannt"}
                              </span>
                              {(c.totalOrders || 0) > 1 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                  <Star className="h-2.5 w-2.5" /> Stammkunde
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-stone-500">
                              {c.email || "—"} · {c.totalOrders || 0}{" "}
                              Bestellungen
                            </div>
                          </div>
                          <div className="text-sm font-bold text-stone-900 shrink-0 ml-4">
                            {formatEur(c.totalRevenue)} €
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── ORDERS TAB ────────────────────────────────── */}
          {tab === TAB_ORDERS && !selectedOrder && (
            <div className="space-y-4">
              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Suche (Name, E-Mail, Receipt-ID)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-stone-900 focus:border-stone-900"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {PERIOD_OPTIONS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPeriod(p.key)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold border whitespace-nowrap transition-colors ${
                        period === p.key
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-white text-stone-600 border-stone-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {["all", "processing", "shipped", "delivered"].map((s) => {
                  const labels = {
                    all: "Alle",
                    processing: "Offen",
                    shipped: "Versendet",
                    delivered: "Geliefert",
                  };
                  const count =
                    s === "all"
                      ? orders.length
                      : orders.filter((o) => o.status === s).length;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-colors ${
                        statusFilter === s
                          ? "bg-stone-800 text-white border-stone-800"
                          : "bg-white text-stone-600 border-stone-300"
                      }`}
                    >
                      {labels[s]} ({count})
                    </button>
                  );
                })}
                <button
                  onClick={handleExportCSV}
                  className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-white text-stone-600 hover:border-stone-400 transition-colors"
                >
                  <Download className="h-3 w-3" /> CSV
                </button>
              </div>

              {/* Sort Headers (mobile-friendly) */}
              <div className="flex items-center gap-3 text-[11px] font-medium text-stone-500 px-1">
                <span>Sortierung:</span>
                {[
                  { field: "orderDate", label: "Datum" },
                  { field: "gross", label: "Umsatz" },
                  { field: "profit", label: "Profit" },
                  { field: "name", label: "Name" },
                ].map((s) => (
                  <button
                    key={s.field}
                    onClick={() => toggleSort(s.field)}
                    className={`flex items-center gap-0.5 ${sortField === s.field ? "text-stone-900 font-bold" : ""}`}
                  >
                    {s.label}
                    {sortField === s.field && (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                ))}
              </div>

              {/* Order Cards (mobile) / Table (desktop) */}
              <div className="space-y-2 md:hidden">
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center text-stone-500 text-sm bg-white rounded-xl border border-stone-200">
                    Keine Bestellungen gefunden.
                  </div>
                ) : (
                  filteredOrders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className="w-full bg-white rounded-xl border border-stone-200 p-4 text-left hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-mono text-xs text-stone-500">
                          #{o.platformOrderId}
                        </div>
                        {statusBadge(o.status)}
                      </div>
                      <div className="text-sm font-semibold text-stone-900">
                        {o.customerName || "Unbekannt"}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {formatDate(o.orderDate)}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                        <div>
                          <div className="text-[11px] text-stone-500">
                            Brutto
                          </div>
                          <div className="text-sm font-bold">
                            {formatEur(o.amounts?.gross)} €
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-stone-500">
                            Gebühren
                          </div>
                          <div className="text-sm font-semibold text-red-600">
                            -{formatEur(o.amounts?.totalFees)} €
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-stone-500">
                            Profit
                          </div>
                          <div
                            className={`text-sm font-bold ${(o.profit || 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}
                          >
                            {formatEur(o.profit)} €
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="p-3 text-xs font-bold text-stone-500 uppercase">
                          Datum
                        </th>
                        <th className="p-3 text-xs font-bold text-stone-500 uppercase">
                          Receipt-ID
                        </th>
                        <th className="p-3 text-xs font-bold text-stone-500 uppercase">
                          Kunde
                        </th>
                        <th className="p-3 text-xs font-bold text-stone-500 uppercase">
                          Status
                        </th>
                        <th className="p-3 text-xs font-bold text-stone-500 uppercase text-right">
                          Brutto
                        </th>
                        <th className="p-3 text-xs font-bold text-stone-500 uppercase text-right">
                          Gebühren
                        </th>
                        <th className="p-3 text-xs font-bold text-stone-500 uppercase text-right">
                          Auszahlung
                        </th>
                        <th className="p-3 text-xs font-bold text-stone-500 uppercase text-right">
                          Kosten
                        </th>
                        <th className="p-3 text-xs font-bold text-stone-500 uppercase text-right">
                          Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredOrders.map((o) => (
                        <tr
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className="hover:bg-stone-50 cursor-pointer transition-colors"
                        >
                          <td className="p-3 text-stone-600 whitespace-nowrap">
                            {formatDate(o.orderDate)}
                          </td>
                          <td className="p-3 font-mono text-xs text-stone-500">
                            {o.platformOrderId}
                          </td>
                          <td className="p-3 font-medium text-stone-900 max-w-[180px] truncate">
                            {o.customerName || "Unbekannt"}
                          </td>
                          <td className="p-3">{statusBadge(o.status)}</td>
                          <td className="p-3 text-right font-semibold">
                            {formatEur(o.amounts?.gross)} €
                          </td>
                          <td className="p-3 text-right text-red-600">
                            -{formatEur(o.amounts?.totalFees)} €
                          </td>
                          <td className="p-3 text-right">
                            {formatEur(o.amounts?.payout)} €
                          </td>
                          <td className="p-3 text-right text-stone-500">
                            {formatEur(o.costs)} €
                          </td>
                          <td
                            className={`p-3 text-right font-bold ${(o.profit || 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}
                          >
                            {formatEur(o.profit)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {filteredOrders.length > 0 && (
                      <tfoot className="bg-stone-50 border-t-2 border-stone-300">
                        <tr className="font-bold text-stone-900">
                          <td className="p-3" colSpan={4}>
                            Summe ({filteredOrders.length} Bestellungen)
                          </td>
                          <td className="p-3 text-right">
                            {formatEur(stats.totalGross)} €
                          </td>
                          <td className="p-3 text-right text-red-600">
                            -{formatEur(stats.totalFees)} €
                          </td>
                          <td className="p-3 text-right">
                            {formatEur(stats.totalPayout)} €
                          </td>
                          <td className="p-3 text-right text-stone-600">
                            {formatEur(stats.totalCosts)} €
                          </td>
                          <td
                            className={`p-3 text-right ${stats.totalProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}
                          >
                            {formatEur(stats.totalProfit)} €
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── ORDER DETAIL ──────────────────────────────── */}
          {tab === TAB_ORDERS && selectedOrder && (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
              >
                <ChevronLeft className="h-4 w-4" /> Zurück
              </button>

              <div className="bg-white rounded-xl border border-stone-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">
                      Bestellung #{selectedOrder.platformOrderId}
                    </h2>
                    <div className="text-sm text-stone-500">
                      {formatDateFull(selectedOrder.orderDate)}
                    </div>
                  </div>
                  {statusBadge(selectedOrder.status)}
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Kundendaten
                    </h3>
                    <div className="space-y-2">
                      {[
                        { label: "Name", value: selectedOrder.customerName },
                        { label: "E-Mail", value: selectedOrder.customerEmail },
                      ].map((f) => (
                        <div
                          key={f.label}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="text-sm">
                            <span className="font-semibold text-stone-900">
                              {f.label}:
                            </span>{" "}
                            {f.value || "—"}
                          </div>
                          <button
                            onClick={() => copyToClipboard(f.value, f.label)}
                            className="p-1 rounded hover:bg-stone-100"
                          >
                            <Copy className="h-3.5 w-3.5 text-stone-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Versandadresse
                    </h3>
                    <div className="flex items-start justify-between gap-2">
                      <pre className="text-sm text-stone-700 whitespace-pre-line font-sans">
                        {formatAddr(selectedOrder.shippingAddress) || "—"}
                      </pre>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            formatAddr(selectedOrder.shippingAddress),
                            "Adresse",
                          )
                        }
                        className="p-1 rounded hover:bg-stone-100 shrink-0"
                      >
                        <Copy className="h-3.5 w-3.5 text-stone-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Personalization */}
                {selectedOrder.personalization && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Personalisierung
                    </h3>
                    <p className="text-sm text-stone-700 bg-stone-50 rounded-lg p-3">
                      {selectedOrder.personalization}
                    </p>
                  </div>
                )}

                {/* Items */}
                {selectedOrder.items?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Artikel
                    </h3>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-stone-50 rounded-lg text-sm"
                        >
                          <div>
                            <div className="font-medium text-stone-900">
                              {item.title || "Artikel"}
                            </div>
                            <div className="text-xs text-stone-500">
                              Menge: {item.quantity}
                              {item.sku ? ` · SKU: ${item.sku}` : ""}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {formatEur(item.price)} €
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Breakdown */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Finanzen
                  </h3>
                  <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm">
                    {[
                      {
                        label: "Brutto",
                        value: selectedOrder.amounts?.gross,
                        bold: true,
                      },
                      {
                        label: "Versand",
                        value: selectedOrder.amounts?.shipping,
                      },
                      {
                        label: "Etsy-Gebühren",
                        value: selectedOrder.amounts?.platformFee,
                        negative: true,
                      },
                      {
                        label: "Zahlungsgebühren",
                        value: selectedOrder.amounts?.processingFee,
                        negative: true,
                      },
                      {
                        label: "Gebühren gesamt",
                        value: selectedOrder.amounts?.totalFees,
                        negative: true,
                        bold: true,
                      },
                      {
                        label: "Auszahlung",
                        value: selectedOrder.amounts?.payout,
                        bold: true,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className={`flex justify-between ${row.bold ? "font-bold" : ""}`}
                      >
                        <span className="text-stone-600">{row.label}</span>
                        <span
                          className={
                            row.negative ? "text-red-600" : "text-stone-900"
                          }
                        >
                          {row.negative ? "-" : ""}
                          {formatEur(row.value)} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editable: Costs + Business Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-600 block mb-1">
                      Kosten (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedOrder.costs ?? ""}
                      onChange={(e) =>
                        handleOrderFieldChange(
                          selectedOrder.id,
                          "costs",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full p-2.5 rounded-lg border border-stone-300 text-sm text-right"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 block mb-1">
                      Gewerbeart
                    </label>
                    <select
                      value={selectedOrder.businessType || "mini"}
                      onChange={(e) =>
                        handleOrderFieldChange(
                          selectedOrder.id,
                          "businessType",
                          e.target.value,
                        )
                      }
                      className="w-full p-2.5 rounded-lg border border-stone-300 text-sm"
                    >
                      <option value="mini">Kleinunternehmer</option>
                      <option value="standard">Regelbesteuerung (19%)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handleSaveOrder(selectedOrder)}
                      disabled={savingId === selectedOrder.id}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {savingId === selectedOrder.id
                        ? "Speichern..."
                        : "Speichern"}
                    </button>
                  </div>
                </div>

                {/* Link to customer profile */}
                {selectedOrder.customerId && (
                  <button
                    onClick={() => {
                      const c = customers.find(
                        (c) => c.id === selectedOrder.customerId,
                      );
                      if (c) openCustomerProfile(c);
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    → Kundenprofil anzeigen
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ─── CUSTOMERS TAB ─────────────────────────────── */}
          {tab === TAB_CUSTOMERS && !selectedCustomer && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Kunde suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-2">
                {customers
                  .filter((c) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (c.name || "").toLowerCase().includes(q) ||
                      (c.email || "").toLowerCase().includes(q)
                    );
                  })
                  .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openCustomerProfile(c)}
                      className="w-full bg-white rounded-xl border border-stone-200 p-4 text-left hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-stone-900 truncate">
                              {c.name || "Unbekannt"}
                            </span>
                            {(c.totalOrders || 0) > 1 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                <Star className="h-2.5 w-2.5" /> Stammkunde
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 mt-0.5">
                            {c.email || "—"}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <div className="text-sm font-bold text-stone-900">
                            {formatEur(c.totalRevenue)} €
                          </div>
                          <div className="text-xs text-stone-500">
                            {c.totalOrders || 0} Bestellungen
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                {customers.length === 0 && (
                  <div className="p-8 text-center text-stone-500 text-sm bg-white rounded-xl border border-stone-200">
                    Noch keine Kunden. Starte einen Etsy Sync.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── CUSTOMER PROFILE ──────────────────────────── */}
          {tab === TAB_CUSTOMERS && selectedCustomer && (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
              >
                <ChevronLeft className="h-4 w-4" /> Zurück
              </button>

              <div className="bg-white rounded-xl border border-stone-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">
                      {selectedCustomer.name || "Unbekannt"}
                    </h2>
                    <div className="text-sm text-stone-500">
                      {selectedCustomer.email || "—"}
                    </div>
                  </div>
                  {(selectedCustomer.totalOrders || 0) > 1 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">
                      <Star className="h-3 w-3" /> Stammkunde
                    </span>
                  )}
                </div>

                {/* Customer KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    {
                      label: "Bestellungen",
                      value: selectedCustomer.totalOrders || 0,
                    },
                    {
                      label: "Umsatz gesamt",
                      value: formatEur(selectedCustomer.totalRevenue) + " €",
                    },
                    {
                      label: "Erste Bestellung",
                      value: formatDate(selectedCustomer.firstOrderAt),
                    },
                    {
                      label: "Letzte Bestellung",
                      value: formatDate(selectedCustomer.lastOrderAt),
                    },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-stone-50 rounded-lg p-3">
                      <div className="text-[11px] text-stone-500 uppercase tracking-wider">
                        {kpi.label}
                      </div>
                      <div className="text-lg font-bold text-stone-900 mt-0.5">
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Addresses */}
                {selectedCustomer.addresses?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Adressen
                    </h3>
                    <div className="space-y-2">
                      {selectedCustomer.addresses.map((addr, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-2 bg-stone-50 rounded-lg p-3"
                        >
                          <pre className="text-sm text-stone-700 whitespace-pre-line font-sans">
                            {formatAddr(addr)}
                          </pre>
                          <button
                            onClick={() =>
                              copyToClipboard(formatAddr(addr), "Adresse")
                            }
                            className="p-1 rounded hover:bg-stone-200 shrink-0"
                          >
                            <Copy className="h-3.5 w-3.5 text-stone-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Tags (KI-bereit)
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedCustomer.tags || []).length > 0 ? (
                      selectedCustomer.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-stone-400">
                        Noch keine Tags vergeben
                      </span>
                    )}
                  </div>
                </div>

                {/* Order Timeline */}
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Bestellverlauf
                </h3>
                <div className="space-y-2">
                  {customerOrders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setSelectedOrder(o);
                        setSelectedCustomer(null);
                        setTab(TAB_ORDERS);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-stone-50 rounded-lg text-left hover:bg-stone-100 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-stone-900">
                          #{o.platformOrderId}
                        </div>
                        <div className="text-xs text-stone-500">
                          {formatDate(o.orderDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">
                          {formatEur(o.amounts?.gross)} €
                        </div>
                        {statusBadge(o.status)}
                      </div>
                    </button>
                  ))}
                  {customerOrders.length === 0 && (
                    <div className="text-sm text-stone-500 p-4 text-center">
                      Keine Bestellungen geladen.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── SETTINGS TAB ──────────────────────────────── */}
          {tab === TAB_SETTINGS && (
            <div className="space-y-4">
              {/* Etsy Connection */}
              <div className="bg-white rounded-xl border border-stone-200 p-5">
                <h3 className="text-sm font-bold text-stone-900 mb-3">
                  Etsy-Verbindung
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-stone-700">
                    Verbunden mit Kamlimos Etsy Shop
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSync}
                    disabled={syncingEtsy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${syncingEtsy ? "animate-spin" : ""}`}
                    />
                    {syncingEtsy
                      ? "Synchronisiere..."
                      : "Jetzt synchronisieren"}
                  </button>
                </div>
              </div>

              {/* Debug */}
              <div className="bg-white rounded-xl border border-stone-200 p-5">
                <h3 className="text-sm font-bold text-stone-900 mb-3">Debug</h3>
                <button
                  onClick={async () => {
                    try {
                      const data = await debugEtsyReceipts(3);
                      setDebugData(data);
                      toast.success("Debug-Daten geladen");
                    } catch (err) {
                      toast.error("Debug fehlgeschlagen");
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                >
                  Etsy Debug Felder laden
                </button>
                {debugData && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-stone-500">
                        Shop-ID: {debugData.shopId}
                      </span>
                      <button
                        onClick={() => setDebugData(null)}
                        className="p-1 rounded hover:bg-stone-100"
                      >
                        <X className="h-3.5 w-3.5 text-stone-400" />
                      </button>
                    </div>
                    <pre className="text-xs bg-stone-50 rounded-lg p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                      {JSON.stringify(debugData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Export */}
              <div className="bg-white rounded-xl border border-stone-200 p-5">
                <h3 className="text-sm font-bold text-stone-900 mb-3">
                  Export
                </h3>
                <p className="text-sm text-stone-600 mb-3">
                  Exportiert alle sichtbaren Bestellungen (mit aktuellem
                  Zeitraum-Filter) als CSV-Datei.
                </p>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                >
                  <Download className="h-4 w-4" />
                  CSV exportieren
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
