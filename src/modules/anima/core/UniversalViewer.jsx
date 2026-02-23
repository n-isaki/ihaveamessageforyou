
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById, markGiftAsViewed } from '@/services/gifts';
import { Loader } from 'lucide-react';

// Lazy Load Experience Viewers
const MugViewer = lazy(() => import('../experiences/multimedia-gift/pages/Viewer'));
const NoorViewer = lazy(() => import('../experiences/noor/pages/NoorViewer'));
const MemoryViewer = lazy(() => import('../experiences/memoria/pages/MemoryViewer'));

export default function UniversalViewer() {
    const { id } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadGift();
    }, [id]);

    const loadGift = async () => {
        try {
            const data = await getGiftById(id);
            if (!data) {
                setError('Geschenk nicht gefunden.');
            } else {
                setGift(data);
                if (!data.viewed) {
                    markGiftAsViewed(id).catch(e => console.error("Could not mark as viewed", e));
                }
            }
        } catch (err) {
            console.error(err);
            setError('Systemfehler beim Laden.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-stone-400" />
        </div>
    );

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
                if (gift.project === 'memoria') return <MemoryViewer gift={gift} />;
                if (gift.project === 'noor' || gift.project === 'dua' || gift.productType === 'dua-audio' || gift.productType === 'noor-audio') return <NoorViewer gift={gift} />;
                return <MugViewer gift={gift} />;
            })()}
        </Suspense>
    );
}
