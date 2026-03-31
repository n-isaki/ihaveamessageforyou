import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGifts, updateGift } from "../services/gifts";
import { Loader, Menu, Calculator, PackageCheck, Save, Copy } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import { toast } from "../services/toast";

export default function AdminTaxes() {
    const [gifts, setGifts] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [savingId, setSavingId] = useState(null);

    const copyToClipboard = async (value, label) => {
        if (!value) {
            toast.error(`${label} nicht vorhanden`);
            return;
        }
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} kopiert`);
        } catch (error) {
            console.error("Clipboard write failed", error);
            toast.error("Kopieren fehlgeschlagen");
        }
    };

    const formatAddress = (gift) => {
        const addr = gift.shippingAddress || {};
        const lines = [
            addr.name || gift.customerName || "",
            [addr.firstLine, addr.secondLine].filter(Boolean).join(" "),
            [addr.zip, addr.city].filter(Boolean).join(" "),
            addr.state || "",
            addr.countryIso || "",
        ].filter(Boolean);
        return lines.join("\n");
    };

    useEffect(() => {
        const fetchGifts = async () => {
            try {
                const data = await getGifts();
                // Sort by delivered date or created date mapping backwards
                data.sort((a, b) => {
                    const getT = (t) => (t ? t.seconds || t._seconds || 0 : 0);
                    const timeA = getT(a.deliveredAt) || getT(a.updatedAt) || getT(a.createdAt);
                    const timeB = getT(b.deliveredAt) || getT(b.updatedAt) || getT(b.createdAt);
                    return timeB - timeA;
                });

                // Initialize local input state for tax info if not present
                const initializedGifts = data.map(g => ({
                    ...g,
                    taxInfo: g.taxInfo || {
                        sellingPrice: "",
                        costs: "",
                        businessType: "mini", // 'mini' or 'standard'
                        platform: "manual", // 'etsy', 'shopify', 'manual'
                        platformFee: 0,
                        finanzamt: 0,
                        profit: 0
                    }
                }));

                setGifts(initializedGifts);
            } catch (error) {
                console.error("Failed to fetch gifts", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGifts();
    }, []);

    const handleUpdateTaxInfo = (id, field, value) => {
        setGifts(prevGifts => prevGifts.map(gift => {
            if (gift.id !== id) return gift;

            const updatedTaxInfo = { ...gift.taxInfo, [field]: value };

            // Calculate profit automatically
            const sellingPrice = parseFloat(updatedTaxInfo.sellingPrice) || 0;
            const costs = parseFloat(updatedTaxInfo.costs) || 0;
            const platform = updatedTaxInfo.platform || "manual";

            let platformFee = 0;
            if (platform === "etsy" && sellingPrice > 0) {
                // Etsy: 6.5% Transaction + 4% Payment Processing + 0.30€ Fixed Payment + 0.20€ Listing (approx 10.5% + 0.50€)
                platformFee = (sellingPrice * 0.105) + 0.50;
            } else if (platform === "shopify" && sellingPrice > 0) {
                // Shopify: Approx 2.1% + 0.30€
                platformFee = (sellingPrice * 0.021) + 0.30;
            }

            // VAT calculation
            let vat = 0;
            if (updatedTaxInfo.businessType === "standard") {
                vat = sellingPrice - (sellingPrice / 1.19);
            }

            const netSellingPrice = sellingPrice - vat;
            const profitBeforeIncomeTax = netSellingPrice - costs - platformFee;

            // Einkommensteuer-Rücklage (estimated 20% on profit)
            const incomeTaxReserve = profitBeforeIncomeTax > 0 ? profitBeforeIncomeTax * 0.20 : 0;
            const finanzamtTotal = vat + incomeTaxReserve;
            const finalNetProfit = profitBeforeIncomeTax - incomeTaxReserve;

            updatedTaxInfo.platformFee = parseFloat(platformFee.toFixed(2));
            updatedTaxInfo.finanzamt = parseFloat(finanzamtTotal.toFixed(2));
            updatedTaxInfo.profit = parseFloat(finalNetProfit.toFixed(2));

            return { ...gift, taxInfo: updatedTaxInfo };
        }));
    };

    const handleSaveTaxInfo = async (gift) => {
        setSavingId(gift.id);
        try {
            await updateGift(gift.id, {
                taxInfo: gift.taxInfo
            });
            toast.success("Gespeichert");
        } catch (e) {
            console.error("Failed to save tax info", e);
            toast.error("Fehler beim Speichern der Daten.");
        } finally {
            setTimeout(() => setSavingId(null), 500);
        }
    };

    // Totals calculations
    const totalRevenue = gifts.reduce((acc, g) => acc + (parseFloat(g.taxInfo?.sellingPrice) || 0), 0);
    const totalCosts = gifts.reduce((acc, g) => acc + (parseFloat(g.taxInfo?.costs) || 0), 0);
    const totalEtsy = gifts.reduce((acc, g) => acc + (g.taxInfo?.platform === 'etsy' ? (g.taxInfo?.platformFee || 0) : 0), 0);
    const totalShopify = gifts.reduce((acc, g) => acc + (g.taxInfo?.platform === 'shopify' ? (g.taxInfo?.platformFee || 0) : 0), 0);
    const totalPlatformFees = gifts.reduce((acc, g) => acc + (g.taxInfo?.platformFee || 0), 0);
    const totalFinanzamt = gifts.reduce((acc, g) => acc + (g.taxInfo?.finanzamt || 0), 0);
    const totalProfit = gifts.reduce((acc, g) => acc + (g.taxInfo?.profit || 0), 0);
    const normalizedStatus = (gift) => {
        if (gift.shippingStatus === "delivered") return "delivered";
        if (gift.shippingStatus === "shipped") return "shipped";
        return "ordered";
    };

    const visibleGifts = gifts.filter((gift) => {
        if (statusFilter === "all") return true;
        return normalizedStatus(gift) === statusFilter;
    });

    const statusCounts = gifts.reduce(
        (acc, gift) => {
            const s = normalizedStatus(gift);
            acc[s] += 1;
            acc.all += 1;
            return acc;
        },
        { all: 0, ordered: 0, shipped: 0, delivered: 0 }
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="flex bg-stone-50 min-h-screen font-sans">
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 relative">
                <div className="max-w-[1400px] mx-auto">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="md:hidden p-2 -ml-2 text-stone-600 hover:bg-stone-200 rounded-lg"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
                                    <Calculator className="h-8 w-8 text-emerald-600" />
                                    Steuerberatung
                                </h1>
                                <p className="text-stone-500 mt-1">
                                    Verwalte Finanzen für alle <strong className="text-stone-700">angekommenen</strong> Pakete.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setStatusFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                statusFilter === "all"
                                    ? "bg-stone-900 text-white border-stone-900"
                                    : "bg-white text-stone-600 border-stone-300 hover:bg-stone-100"
                            }`}
                        >
                            Alle ({statusCounts.all})
                        </button>
                        <button
                            onClick={() => setStatusFilter("ordered")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                statusFilter === "ordered"
                                    ? "bg-sky-700 text-white border-sky-700"
                                    : "bg-white text-stone-600 border-stone-300 hover:bg-stone-100"
                            }`}
                        >
                            Bestellt ({statusCounts.ordered})
                        </button>
                        <button
                            onClick={() => setStatusFilter("shipped")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                statusFilter === "shipped"
                                    ? "bg-amber-600 text-white border-amber-600"
                                    : "bg-white text-stone-600 border-stone-300 hover:bg-stone-100"
                            }`}
                        >
                            Versandt ({statusCounts.shipped})
                        </button>
                        <button
                            onClick={() => setStatusFilter("delivered")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                statusFilter === "delivered"
                                    ? "bg-emerald-700 text-white border-emerald-700"
                                    : "bg-white text-stone-600 border-stone-300 hover:bg-stone-100"
                            }`}
                        >
                            Angekommen ({statusCounts.delivered})
                        </button>
                    </div>

                    {/* Spreadsheet Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                                <thead className="bg-stone-100 border-b border-stone-200 text-xs font-bold uppercase text-stone-600 tracking-wider">
                                    <tr>
                                        <th className="p-3 pl-4 w-12 text-center" title="Angekommen"><PackageCheck className="h-4 w-4 mx-auto text-blue-600" /></th>
                                        <th className="p-3 border-r border-stone-200">Bestell-ID</th>
                                        <th className="p-3 border-r border-stone-200">Kunde / Headline</th>
                                        <th className="p-3 border-r border-stone-200 min-w-[280px]">Kundendaten</th>
                                        <th className="p-3 border-r border-stone-200 w-32">Gewerbeart</th>
                                        <th className="p-3 border-r border-stone-200 w-32">Plattform</th>
                                        <th className="p-3 border-r border-stone-200 w-24">Preis (€)</th>
                                        <th className="p-3 border-r border-stone-200 w-24">Kosten (€)</th>
                                        <th className="p-3 border-r border-stone-200 w-24 text-right" title="Etsy/Shopify Gebühren">Gebühr (€)</th>
                                        <th className="p-3 border-r border-stone-200 w-24 text-right" title="MwSt + ca. 20% ESt-Rücklage">Finanzamt (€)</th>
                                        <th className="p-3 border-r border-stone-200 w-24 text-right">Profit (€)</th>
                                        <th className="p-3 text-center w-16">Aktion</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 custom-scrollbar">
                                    {visibleGifts.length === 0 ? (
                                        <tr>
                                            <td colSpan="12" className="p-8 text-center text-stone-500">
                                                Keine Bestellungen für diesen Status gefunden.
                                            </td>
                                        </tr>
                                    ) : (
                                        visibleGifts.map((gift) => (
                                            <tr key={gift.id} className="hover:bg-amber-50/30 transition-colors group">
                                                {/* Status Icon */}
                                                <td className="p-3 pl-4 text-center align-middle">
                                                    <PackageCheck className="h-4 w-4 mx-auto text-blue-600" />
                                                </td>

                                                {/* Order ID */}
                                                <td className="p-3 border-r border-stone-200 font-mono text-xs text-stone-500 align-middle">
                                                    <Link to={`/admin/edit/${gift.id}`} className="hover:text-blue-600 hover:underline">
                                                        {gift.orderId || gift.id.substring(0, 8)}
                                                    </Link>
                                                </td>

                                                {/* Customer */}
                                                <td className="p-3 border-r border-stone-200 align-middle truncate max-w-[200px]" title={gift.customerName || gift.headline}>
                                                    <div className="font-medium text-stone-900 truncate">
                                                        {gift.customerName || "Unbekannt"}
                                                    </div>
                                                    <div className="text-xs text-stone-500 truncate">
                                                        {gift.headline || gift.productType || gift.project}
                                                    </div>
                                                </td>

                                                {/* Customer Data */}
                                                <td className="p-3 border-r border-stone-200 align-top min-w-[280px]">
                                                    <div className="space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="text-xs text-stone-700 break-all">
                                                                <div className="font-semibold text-stone-900">E-Mail</div>
                                                                <div>{gift.customerEmail || "—"}</div>
                                                            </div>
                                                            <button
                                                                onClick={() => copyToClipboard(gift.customerEmail, "E-Mail")}
                                                                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                                                                title="E-Mail kopieren"
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="text-xs text-stone-700 whitespace-pre-line">
                                                                <div className="font-semibold text-stone-900">Adresse</div>
                                                                <div>{formatAddress(gift) || "—"}</div>
                                                            </div>
                                                            <button
                                                                onClick={() => copyToClipboard(formatAddress(gift), "Adresse")}
                                                                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                                                                title="Adresse kopieren"
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>

                                                        <div className="text-xs text-stone-700">
                                                            <div className="font-semibold text-stone-900">Personalisierung</div>
                                                            <div className="line-clamp-3">{gift.personalizationText || gift.engravingText || "—"}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Business Type */}
                                                <td className="p-0 border-r border-stone-200 align-middle">
                                                    <select
                                                        value={gift.taxInfo.businessType}
                                                        onChange={(e) => handleUpdateTaxInfo(gift.id, "businessType", e.target.value)}
                                                        onBlur={() => handleSaveTaxInfo(gift)}
                                                        className="w-full h-full p-3 bg-transparent border-none outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm cursor-pointer"
                                                    >
                                                        <option value="mini">Mini-Gewerbe</option>
                                                        <option value="standard">Regelsteuer (19% MwSt)</option>
                                                    </select>
                                                </td>

                                                {/* Platform */}
                                                <td className="p-0 border-r border-stone-200 align-middle">
                                                    <select
                                                        value={gift.taxInfo.platform || "manual"}
                                                        onChange={(e) => handleUpdateTaxInfo(gift.id, "platform", e.target.value)}
                                                        onBlur={() => handleSaveTaxInfo(gift)}
                                                        className="w-full h-full p-3 bg-transparent border-none outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm cursor-pointer"
                                                    >
                                                        <option value="manual">Manuell (0%)</option>
                                                        <option value="etsy">Etsy (~10.5% + 0.50€)</option>
                                                        <option value="shopify">Shopify (~2.1% + 0.30€)</option>
                                                    </select>
                                                </td>

                                                {/* Selling Price */}
                                                <td className="p-0 border-r border-stone-200 align-middle">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={gift.taxInfo.sellingPrice ?? ""}
                                                        onChange={(e) => handleUpdateTaxInfo(gift.id, "sellingPrice", e.target.value)}
                                                        onBlur={() => handleSaveTaxInfo(gift)}
                                                        className="w-full h-full p-3 bg-transparent border-none outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm text-right placeholder:text-stone-300"
                                                    />
                                                </td>

                                                {/* Costs */}
                                                <td className="p-0 border-r border-stone-200 align-middle">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={gift.taxInfo.costs ?? ""}
                                                        onChange={(e) => handleUpdateTaxInfo(gift.id, "costs", e.target.value)}
                                                        onBlur={() => handleSaveTaxInfo(gift)}
                                                        className="w-full h-full p-3 bg-transparent border-none outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 text-sm text-right text-rose-600 placeholder:text-rose-200"
                                                    />
                                                </td>

                                                {/* Computed Platform Fee */}
                                                <td className="p-3 border-r border-stone-200 align-middle text-right text-stone-500 bg-stone-50/50 font-mono text-xs">
                                                    {gift.taxInfo.platformFee > 0 ? `-${gift.taxInfo.platformFee.toFixed(2)}` : "0.00"}
                                                </td>

                                                {/* Finanzamt (VAT + Income Tax Reserve) */}
                                                <td className="p-3 border-r border-stone-200 align-middle text-right text-rose-600 bg-rose-50/30 font-mono text-xs" title="MwSt + 20% ESt Rücklage">
                                                    {gift.taxInfo.finanzamt > 0 ? `-${gift.taxInfo.finanzamt.toFixed(2)}` : "0.00"}
                                                </td>

                                                {/* Computed Profit */}
                                                <td className={`p-3 border-r border-stone-200 align-middle text-right font-bold font-mono text-sm ${gift.taxInfo.profit > 0 ? 'text-emerald-600 bg-emerald-50/50' : gift.taxInfo.profit < 0 ? 'text-rose-600 bg-rose-50/50' : 'text-stone-900 bg-stone-50'}`}>
                                                    {gift.taxInfo.profit > 0 ? '+' : ''}{gift.taxInfo.profit.toFixed(2)}
                                                </td>

                                                {/* Action - Save Indicator */}
                                                <td className="p-3 align-middle text-center">
                                                    <button
                                                        onClick={() => handleSaveTaxInfo(gift)}
                                                        disabled={savingId === gift.id}
                                                        className={`p-1.5 rounded-md transition-colors ${savingId === gift.id ? 'bg-emerald-100 text-emerald-600' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'}`}
                                                        title="Speichern"
                                                    >
                                                        {savingId === gift.id ? (
                                                            <Loader className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-stone-800 text-white font-mono text-sm tracking-wide">
                                    <tr>
                                        <td colSpan="6" className="p-4 text-right font-bold uppercase text-stone-300 font-sans text-xs">
                                            Total (Summen)
                                        </td>
                                        <td className="p-4 border-r border-stone-700 text-right text-emerald-400">
                                            {totalRevenue.toFixed(2)}
                                        </td>
                                        <td className="p-4 border-r border-stone-700 text-right text-rose-400">
                                            -{totalCosts.toFixed(2)}
                                        </td>
                                        <td className="p-4 border-r border-stone-700 text-right text-amber-400" title={`Etsy: ${totalEtsy.toFixed(2)} | Shopify: ${totalShopify.toFixed(2)}`}>
                                            -{totalPlatformFees.toFixed(2)}
                                        </td>
                                        <td className="p-4 border-r border-stone-700 text-right text-rose-400">
                                            -{totalFinanzamt.toFixed(2)}
                                        </td>
                                        <td className="p-4 border-r border-stone-700 text-right font-bold text-emerald-400 text-base">
                                            {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)}
                                        </td>
                                        <td className="p-4"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Breakdown Widget */}
                        <div className="bg-stone-50 border-t border-stone-200 p-4 flex flex-wrap gap-6 items-center uppercase tracking-wider text-[10px] font-bold text-stone-500">
                            <div>
                                Sichtbar: <span className="text-stone-900 text-xs">{visibleGifts.length}</span>
                            </div>
                            <div>
                                Etsy Gebühren: <span className="text-stone-900 text-xs">{totalEtsy.toFixed(2)} €</span>
                            </div>
                            <div>
                                Shopify Gebühren: <span className="text-stone-900 text-xs">{totalShopify.toFixed(2)} €</span>
                            </div>
                            <div className="flex-1 text-right text-stone-400 normal-case tracking-normal font-normal text-xs">
                                Das Dokument speichert beim Verlassen eines Feldes (Auto-Save on blur)
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
