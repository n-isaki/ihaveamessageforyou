import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById } from '@/services/gifts';
import { Loader, MoveUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StoryCard() {
    const { id } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        loadGift();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [id]);

    const handleScroll = () => {
        if (window.scrollY > 50) setScrolled(true);
    };

    const loadGift = async () => {
        try {
            const data = await getGiftById(id);
            setGift(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-screen bg-stone-950 flex items-center justify-center"><Loader className="animate-spin text-stone-600" /></div>;
    if (!gift) return <div className="h-screen bg-stone-950 flex items-center justify-center text-stone-500">Nachricht nicht gefunden.</div>;

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200 font-sans selection:bg-rose-500 selection:text-white">

            {/* Stage 1: The Quote (Top) */}
            <div className="h-screen flex flex-col items-center justify-center p-8 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-center"
                >
                    <p className="text-sm font-bold text-emerald-500 tracking-[0.2em] uppercase mb-8 opacity-70">
                        Für {gift.recipientName}
                    </p>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight text-white mb-12">
                        "{gift.engravingText}"
                    </h1>
                    <p className="text-sm font-medium text-stone-500">
                        Von {gift.senderName || gift.customerName}
                    </p>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: scrolled ? 0 : 1 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-600"
                >
                    <span className="text-[10px] uppercase tracking-widest">Die Bedeutung</span>
                    <MoveUp className="h-4 w-4 animate-bounce rotate-180" />
                </motion.div>
            </div>

            {/* Stage 2: The Meaning (Scroll Down) */}
            <div className="max-w-xl mx-auto px-8 pb-32">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-800 to-transparent mb-16"></div>

                <div className="prose prose-invert prose-stone mx-auto">
                    <p className="font-serif text-2xl leading-relaxed text-stone-300">
                        Dieser Satz ist kein Zufall. Er ist das Destillat eurer Verbindung. Ein Versprechen, das so beständig ist wie das Leder, das es trägt.
                    </p>
                    <p className="text-stone-400">
                        {gift.senderName} hat diesen Moment im "Archiv der Bindungen" festgehalten, um dich daran zu erinnern: Du bist nicht allein. Nicht heute. Nicht morgen.
                    </p>
                </div>

                <div className="mt-20 flex justify-center">
                    <div className="px-4 py-2 rounded-full border border-stone-800 text-xs text-stone-500 flex items-center gap-2">
                        <Info className="h-3 w-3" />
                        Dieses Band ist ein Unikat.
                    </div>
                </div>
            </div>
        </div>
    );
}
