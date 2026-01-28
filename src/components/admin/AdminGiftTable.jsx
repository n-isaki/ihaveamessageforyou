
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, Unlock, Check, EyeOff, ExternalLink, Printer, Edit2, Trash2,
    ChevronUp, ChevronDown, Copy, Package, Gift, Eye
} from 'lucide-react';
import { getExperience } from '../../modules/registry';

export default function AdminGiftTable({ gifts, expandedId, onToggleExpand, onDeleteClick, onToggleViewed }) {

    const handleCopyLink = (e, gift) => {
        e.stopPropagation();
        const tokenPart = gift.securityToken ? `?token=${gift.securityToken}` : '';
        const name = gift.customerName || gift.senderName || gift.recipientName || 'Kunde';
        
        // Determine base URL based on environment and project
        let baseUrl = 'https://scan.kamlimos.com'; // Default for production
        const isStaging = window.location.hostname.includes('staging') || window.location.hostname.includes('localhost');
        
        if (isStaging) {
            // Use current domain for staging
            baseUrl = window.location.origin;
        } else if (gift.project === 'memoria') {
            baseUrl = 'https://memoria.kamlimos.com';
        } else if (gift.project === 'noor' || gift.project === 'dua') {
            baseUrl = 'https://noor.kamlimos.com';
        } else if (gift.project === 'ritual' || gift.productType === 'bracelet') {
            baseUrl = 'https://ritual.kamlimos.com';
        }
        
        const setupUrl = `${baseUrl}/setup/${gift.id}${tokenPart}`;
        navigator.clipboard.writeText(`Hallo ${name}, bitte richte dein Geschenk hier ein: ${setupUrl}`);
        alert("Link kopiert!");
    };

    if (gifts.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                <Gift className="h-12 w-12 mx-auto text-stone-300 mb-4" />
                <h3 className="text-lg font-medium text-stone-900">Keine Aufträge</h3>
                <p className="text-stone-500">In diesem Projekt ist noch nichts los.</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
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
                            {gifts.map((gift, index) => {
                                const exp = getExperience(gift);
                                return (
                                    <React.Fragment key={gift.id}>
                                        <tr
                                            onClick={() => onToggleExpand(gift.id)}
                                            className={`cursor-pointer hover:bg-stone-100 transition-colors ${expandedId === gift.id ? 'bg-emerald-50/60 ring-1 ring-inset ring-emerald-100' : index % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}`}
                                        >
                                            {/* Status */}
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

                                            {/* Product */}
                                            <td className="p-2 align-middle">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`p-2 rounded-lg shrink-0 ${exp.colors.bg} ${exp.colors.text}`}>
                                                        <exp.icon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-stone-900 text-sm">
                                                            {exp.id === 'noor' ? (gift.title || 'Noor') :
                                                                exp.id === 'memoria' ? (gift.deceasedName || 'Memoria') :
                                                                    (gift.headline ? gift.headline.substring(0, 20) + (gift.headline.length > 20 ? '...' : '') : exp.label)}
                                                        </div>
                                                        <div className="text-xs text-stone-400">
                                                            {exp.label}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="p-2 align-middle">
                                                <div className="text-sm font-medium text-stone-900">{gift.customerName || gift.senderName || gift.recipientName || 'Unbekannt'}</div>
                                                <div className="text-xs text-stone-400 truncate max-w-[150px]" title={gift.customerEmail}>
                                                    {gift.customerEmail || '-'}
                                                </div>
                                            </td>

                                            {/* Order ID */}
                                            <td className="p-2 align-middle hidden md:table-cell">
                                                <span className="font-mono text-xs text-stone-500">{gift.orderId || 'MANUAL'}</span>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-2 align-middle text-right pr-4">
                                                <div className="flex justify-end items-center space-x-1" onClick={e => e.stopPropagation()}>

                                                    {/* Link Copy */}
                                                    {!gift.locked && exp.isSetupRequired && (
                                                        <button
                                                            onClick={(e) => handleCopyLink(e, gift)}
                                                            className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors"
                                                            title="Link kopieren"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    {/* Toggle Viewed */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onToggleViewed(gift); }}
                                                        className={`p-1.5 rounded-lg transition-colors ${gift.viewed ? 'text-green-600 hover:bg-green-50' : 'text-stone-400 hover:bg-stone-100'}`}
                                                        title={gift.viewed ? "Als ungesehen markieren" : "Als gesehen markieren"}
                                                    >
                                                        {gift.viewed ? <Check className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    </button>

                                                    <div className="h-4 w-px bg-stone-300 mx-1"></div>

                                                    <a href={exp.getViewerUrl(gift)} target="_blank" rel="noopener noreferrer" className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Ansicht öffnen">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>

                                                    <Link to={`/admin/print/${gift.id}`} target="_blank" className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg" title="QR Code">
                                                        <Printer className="h-4 w-4" />
                                                    </Link>

                                                    <Link to={`/admin/edit/${gift.id}`} className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Bearbeiten">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Link>

                                                    <button onClick={(e) => onDeleteClick(e, gift.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Löschen">
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
                                                            <div className="md:col-span-2 space-y-6">
                                                                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                                                                    <h4 className="font-bold text-stone-900 mb-4 border-b border-stone-100 pb-2">
                                                                        {exp.label} Details
                                                                    </h4>

                                                                    {/* Timeline */}
                                                                    <div className="mt-4 mb-8 px-2">
                                                                        <div className="relative">
                                                                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-stone-100 -translate-y-1/2 rounded-full"></div>
                                                                            <div className={`relative flex ${exp.isSetupRequired ? 'justify-between' : 'justify-around'}`}>
                                                                                {/* Step 1: Created */}
                                                                                <div className={`flex flex-col items-center ${exp.isSetupRequired ? 'w-1/4' : 'w-1/3'}`}>
                                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-emerald-500 border-emerald-500 text-white z-10 shadow-sm`}>
                                                                                        <Package className="h-3.5 w-3.5" />
                                                                                    </div>
                                                                                    <div className="mt-2 text-center">
                                                                                        <p className="text-[10px] font-bold text-stone-900 uppercase tracking-wide">Erstellt</p>
                                                                                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">{gift.createdAt?.toDate ? gift.createdAt.toDate().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '-'}</p>
                                                                                    </div>
                                                                                </div>
                                                                                {/* Step 2: Setup (Started) - Only for products that require setup */}
                                                                                {exp.isSetupRequired && (
                                                                                    <div className="flex flex-col items-center w-1/4">
                                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 shadow-sm transition-colors ${gift.setupStarted || gift.locked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-stone-200 text-stone-300'}`}>
                                                                                            <Edit2 className="h-3.5 w-3.5" />
                                                                                        </div>
                                                                                        <div className="mt-2 text-center">
                                                                                            <p className={`text-[10px] font-bold uppercase tracking-wide ${gift.setupStarted || gift.locked ? 'text-stone-900' : 'text-stone-300'}`}>Bearbeitet</p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {/* Step 3: Locked (Ready) - Only for products that require setup */}
                                                                                {exp.isSetupRequired && (
                                                                                    <div className="flex flex-col items-center w-1/4">
                                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 shadow-sm transition-colors ${gift.locked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-stone-200 text-stone-300'}`}>
                                                                                            <Lock className="h-3.5 w-3.5" />
                                                                                        </div>
                                                                                        <div className="mt-2 text-center">
                                                                                            <p className={`text-[10px] font-bold uppercase tracking-wide ${gift.locked ? 'text-stone-900' : 'text-stone-300'}`}>Fertig</p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {/* Step 4: Viewed */}
                                                                                <div className={`flex flex-col items-center ${exp.isSetupRequired ? 'w-1/4' : 'w-1/3'}`}>
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
                                                                        {exp.renderDetails(gift)}
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

                                                            {/* META DATA Info */}
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
                {gifts.map((gift) => {
                    const exp = getExperience(gift);
                    return (
                        <div key={gift.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden relative">
                            <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${gift.locked ? 'bg-stone-800' : 'bg-amber-400'}`}></div>
                            <div className="p-4 pl-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${exp.colors.bg} ${exp.colors.text}`}>
                                            <exp.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-stone-900 leading-tight">
                                                {gift.customerName || gift.recipientName || gift.customerEmail || 'Unbekannt'}
                                            </div>
                                            <div className="text-xs text-stone-500">
                                                {exp.label}
                                                <span className="mx-1">•</span>
                                                {gift.orderId || '#'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onToggleViewed(gift); }}
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
                                    <a href={exp.getViewerUrl(gift)} target="_blank" className="flex flex-col items-center justify-center p-2 rounded-lg bg-stone-50 text-stone-600 active:bg-stone-200">
                                        <ExternalLink className="h-4 w-4 mb-1" />
                                        <span className="text-[10px] font-bold uppercase">View</span>
                                    </a>
                                    <button onClick={() => onToggleExpand(gift.id)} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${expandedId === gift.id ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-600'}`}>
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

                                                {/* Dynamic Details from Registry */}
                                                {exp.renderDetails(gift)}

                                                <div className="pt-2">
                                                    <button onClick={(e) => onDeleteClick(e, gift.id)} className="w-full py-2 text-red-600 font-bold text-xs uppercase bg-red-50 rounded-lg">Löschen</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
