
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById, markGiftAsViewed } from '@/services/gifts';
import { Loader } from 'lucide-react';
import MugViewer from '../experiences/multimedia-gift/pages/Viewer';
import NoorViewer from '../experiences/noor/pages/NoorViewer';
import MemoryViewer from '../experiences/memoria/pages/MemoryViewer';

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
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-stone-400" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">
            {error}
        </div>
    );

    if (gift.project === 'memoria') return <MemoryViewer />;
    if (gift.project === 'noor' || gift.project === 'dua' || gift.productType === 'dua-audio' || gift.productType === 'noor-audio') return <NoorViewer />;

    return <MugViewer />;
}
