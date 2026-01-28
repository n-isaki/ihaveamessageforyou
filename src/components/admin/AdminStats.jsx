
import React, { useMemo } from 'react';
import { Package, Unlock, Gift, Eye, Activity, Clock } from 'lucide-react';

export default function AdminStats({ gifts, filteredGifts }) {

    // Calculate Activities from ALL gifts (Business Overview)
    const activities = useMemo(() => {
        const list = [];
        gifts.forEach(g => {
            if (g.createdAt) list.push({ type: 'created', date: g.createdAt.toDate(), gift: g });
            if (g.viewedAt) list.push({ type: 'viewed', date: g.viewedAt.toDate(), gift: g });
            if (g.locked) list.push({ type: 'locked', date: g.updatedAt?.toDate() || new Date(), gift: g });
        });
        return list
            .filter(a => a.date && !isNaN(a.date.getTime()))
            .sort((a, b) => b.date - a.date)
            .slice(0, 5);
    }, [gifts]);

    return (
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
    );
}
