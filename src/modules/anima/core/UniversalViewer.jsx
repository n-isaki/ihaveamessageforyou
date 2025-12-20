import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById } from '@/services/gifts';
import { Loader } from 'lucide-react';

// Import Specific Experiences
import MugViewer from '../experiences/multimedia-gift/pages/Viewer';
import StoryCard from '../experiences/engraving-ritual/pages/StoryCard';

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
            }
        } catch (err) {
            console.error(err);
            setError('Systemfehler beim Laden.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-stone-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="text-center p-8">
                    <h1 className="text-xl font-bold text-stone-800 mb-2">Entschuldigung</h1>
                    <p className="text-stone-500">{error}</p>
                </div>
            </div>
        );
    }

    // THE SMART ROUTING LOGIC
    // Decide which experience to show based on productType
    if (gift.productType === 'bracelet') {
        return <StoryCard />;
    }

    // Default Fallback (Mug/Multimedia)
    // We treat 'mug' or undefined as the standard multimedia gift for backward compatibility
    return <MugViewer />;
}
