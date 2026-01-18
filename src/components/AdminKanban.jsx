import React from 'react';
import { MoreHorizontal, Clock, CheckCircle, Lock, Eye, EyeOff, Coffee, Watch, Heart, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date.toDate()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " Jahre";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " Mon.";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " T";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " Std.";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " Min.";
    return "Gerade eben";
};

export default function AdminKanban({ gifts }) {

    // Sort logic: Newest first
    const sortedGifts = [...gifts].sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

    const columns = {
        open: {
            title: "Offen / Setup",
            items: sortedGifts.filter(g => !g.locked),
            color: "stone",
            icon: Clock
        },
        ready: {
            title: "Fertig (Gesperrt)",
            items: sortedGifts.filter(g => g.locked && !g.viewed),
            color: "amber",
            icon: Lock
        },
        viewed: {
            title: "Empfangen",
            items: sortedGifts.filter(g => g.viewed),
            color: "emerald",
            icon: CheckCircle
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'tasse': return <Coffee className="h-4 w-4" />;
            case 'bracelet': return <Watch className="h-4 w-4" />;
            case 'memoria': return <Heart className="h-4 w-4" />;
            case 'dua': return <Zap className="h-4 w-4" />;
            default: return <Coffee className="h-4 w-4" />;
        }
    };

    return (
        <div className="flex h-full overflow-x-auto p-8 items-start gap-6">
            {Object.entries(columns).map(([key, col]) => (
                <div key={key} className="w-80 shrink-0 flex flex-col max-h-full bg-stone-100/50 rounded-2xl border border-stone-200">
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between border-b border-stone-200 bg-white/50 rounded-t-2xl backdrop-blur-sm">
                        <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-lg bg-${col.color}-100 text-${col.color}-600`}>
                                <col.icon className="h-4 w-4" />
                            </div>
                            <h3 className="font-bold text-stone-700 text-sm">{col.title}</h3>
                        </div>
                        <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-full">{col.items.length}</span>
                    </div>

                    {/* Items */}
                    <div className="p-4 overflow-y-auto space-y-3 min-h-[100px]">
                        {col.items.length === 0 && (
                            <div className="text-center py-8 text-stone-400 text-xs italic">
                                Keine Aufträge
                            </div>
                        )}
                        {col.items.map(gift => (
                            <motion.div
                                key={gift.id}
                                layoutId={gift.id}
                                className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-all cursor-pointer group relative"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-stone-100 text-stone-500`}>
                                        {getIcon(gift.project || 'tasse')}
                                        <span className="ml-1">{gift.project || 'tasse'}</span>
                                    </span>
                                    {gift.createdAt && (
                                        <span className="text-[10px] text-stone-400">{timeAgo(gift.createdAt)}</span>
                                    )}
                                </div>

                                <h4 className="font-bold text-stone-800 mb-1 truncate">
                                    {gift.recipientName || gift.customerName || 'Unbekannt'}
                                </h4>

                                <div className="text-xs text-stone-500 mb-3 line-clamp-2">
                                    {gift.messages && gift.messages.length > 0 ? (
                                        `"${gift.messages[0].content}"`
                                    ) : (
                                        <span className="italic text-stone-300">Keine Nachricht...</span>
                                    )}
                                </div>

                                {/* Actions Footer */}
                                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                                    <div className="flex -space-x-1">
                                        {/* Avatar placeholder */}
                                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 border border-white"></div>
                                    </div>

                                    <Link to={`/admin/edit/${gift.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-rose-600 hover:underline">
                                        Bearbeiten &rarr;
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
