
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById, markGiftAsViewed } from '@/services/gifts';
import { Loader } from 'lucide-react';

// Lazy Load Experience Viewers
const MugViewer = lazy(() => import('../experiences/multimedia-gift/pages/Viewer'));
const NoorViewer = lazy(() => import('../experiences/noor/pages/NoorViewer'));
const MemoryViewer = lazy(() => import('../experiences/memoria/pages/MemoryViewer'));
const AudioViewer = lazy(() => import('../experiences/audio/AudioViewer'));

export default function UniversalViewer() {
    const { id } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadGift = useCallback(async () => {
        try {
            const data = await getGiftById(id);
            if (!data) {
                setError('Geschenk nicht gefunden.');
            } else {
                let isExpired = false;
                let expiresTime = null;
                if (data.expiresAtMillis != null) {
                    expiresTime = data.expiresAtMillis; // von getPublicGiftData (Cloud Function)
                } else if (data.expiresAt) {
                    expiresTime = typeof data.expiresAt.toDate === 'function'
                        ? data.expiresAt.toDate().getTime()
                        : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : new Date(data.expiresAt).getTime());
                }
                if (expiresTime != null && Date.now() > expiresTime) {
                    isExpired = true;
                }

                if (isExpired) {
                    setError('expired');
                } else {
                    setGift(data);
                    if (!data.viewed) {
                        markGiftAsViewed(id).catch(e => console.error("Could not mark as viewed", e));
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setError('Systemfehler beim Laden.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadGift();
    }, [id, loadGift]);

    if (loading) return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-stone-400" />
        </div>
    );

    if (error === 'expired') {
        return (
            <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-6 text-center font-sans tracking-wide">
                <div className="max-w-md w-full bg-[#1A1A1A] p-10 rounded-3xl border border-stone-800/80 shadow-2xl flex flex-col items-center">
                    <div className="w-12 h-12 mb-6 text-stone-500">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <h2 className="text-xl font-medium text-stone-200 mb-3 font-display">
                        Dieses Geschenk ist nicht<br />mehr online.
                    </h2>
                    <p className="text-stone-400 text-sm leading-relaxed mb-8">
                        Die Zeit für dieses Geschenkfenster ist abgelaufen. Wir hoffen, du hattest viel Freude damit!
                    </p>
                    <div className="text-[10px] text-stone-600 uppercase tracking-widest font-bold">
                        KAMLIMOS
                    </div>
                </div>
            </div>
        );
    }

    if (error) return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-300">
            {error}
        </div>
    );

    // Note: Using an IIFE or separate component renders cleaner with Suspense than multiple return statements outside
    // Generierte Geschenk-Seiten: Dark Mode (Viewer/Erlebnis bleibt dunkel)
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        }>
            {(() => {
                if (gift.project === 'audio') return <AudioViewer gift={gift} />;
                if (gift.project === 'memoria') return <MemoryViewer gift={gift} />;
                if (gift.project === 'noor' || gift.project === 'dua' || gift.productType === 'dua-audio' || gift.productType === 'noor-audio') return <NoorViewer gift={gift} />;
                return <MugViewer gift={gift} />;
            })()}
        </Suspense>
    );
}
