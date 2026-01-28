import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById } from '@/services/gifts';
import { Play, Pause, Loader, Sparkles, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// --- Sub-Component: Minimal Circular Player ---
const CircularPlayer = ({ url, label, isActive, onToggle }) => {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={onToggle}>
                {/* Pulse Effect */}
                {isActive && (
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                )}

                <motion.div
                    whileTap={{ scale: 0.95 }}
                    animate={{ scale: isActive ? 1.05 : 1 }}
                    className={`w-28 h-28 rounded-full border flex items-center justify-center backdrop-blur-md shadow-2xl relative z-10 transition-colors 
                        ${isActive ? 'border-emerald-500/60 bg-stone-900/80' : 'border-emerald-500/30 bg-stone-900/50 hover:border-emerald-500/60'}
                    `}
                >
                    {isActive ? (
                        <Pause className="h-10 w-10 text-emerald-400 fill-current ml-0.5" />
                    ) : (
                        <Play className="h-10 w-10 text-emerald-400 fill-current ml-1.5" />
                    )}
                </motion.div>
            </div>
            {label && <span className="text-xs uppercase tracking-widest text-emerald-500/60 font-medium">{label}</span>}
        </div>
    );
};

// --- Sub-Component: Inline Bar Player ---
const InlinePlayer = ({ url, label, isActive, onToggle }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onToggle}
            className={`flex items-center gap-4 px-6 py-4 rounded-xl border w-full text-left transition-all
                ${isActive
                    ? 'border-emerald-500/50 bg-emerald-950/30 ring-1 ring-emerald-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }
            `}
        >
            <div className={`flex items-center justify-center h-10 w-10 rounded-full border ${isActive ? 'bg-emerald-500 text-stone-900 border-emerald-400' : 'border-emerald-500/30 text-emerald-400'}`}>
                {isActive ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </div>
            <div>
                <p className="text-sm font-bold text-stone-200">{label}</p>
                <p className="text-xs text-stone-500 mt-0.5 uppercase tracking-wider">{isActive ? 'Spielt jetzt...' : 'Anhören'}</p>
            </div>
            {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>}
        </motion.button>
    );
};


export default function NoorViewer() {
    const { id } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);

    // State for which audio is playing: 'recitation' | 'meaning' | null
    const [playingState, setPlayingState] = useState(null);

    // Refs
    const recitationRef = useRef(new Audio());
    const meaningRef = useRef(new Audio());

    useEffect(() => {
        const fetchGift = async () => {
            try {
                const data = await getGiftById(id);
                setGift(data);

                if (data?.audioUrl) recitationRef.current.src = data.audioUrl;
                if (data?.meaningAudioUrl) meaningRef.current.src = data.meaningAudioUrl;

            } catch (error) {
                console.error("Failed to fetch noor", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGift();

        // Cleanup
        return () => {
            recitationRef.current.pause();
            meaningRef.current.pause();
        };
    }, [id]);

    useEffect(() => {
        // Event Listeners for ending
        const handleRecitationEnd = () => setPlayingState(null);
        const handleMeaningEnd = () => setPlayingState(null);

        const rAudio = recitationRef.current;
        const mAudio = meaningRef.current;

        rAudio.addEventListener('ended', handleRecitationEnd);
        mAudio.addEventListener('ended', handleMeaningEnd);

        return () => {
            rAudio.removeEventListener('ended', handleRecitationEnd);
            mAudio.removeEventListener('ended', handleMeaningEnd);
        };
    }, []);

    const toggleAudio = (type) => {
        if (!gift) return;

        const targetAudio = type === 'recitation' ? recitationRef.current : meaningRef.current;
        const otherAudio = type === 'recitation' ? meaningRef.current : recitationRef.current;

        // Stop the other one immediately
        otherAudio.pause();
        // Reset its time if you want, or keep it paused
        // otherAudio.currentTime = 0; 

        if (playingState === type) {
            // Pause current
            targetAudio.pause();
            setPlayingState(null);
        } else {
            // Play new
            targetAudio.play().catch(e => console.error("Play error:", e));
            setPlayingState(type);
        }
    };

    if (loading) return <div className="h-screen bg-stone-950 flex items-center justify-center"><Loader className="animate-spin text-emerald-500" /></div>;

    if (!gift) return <div className="h-screen bg-stone-950 text-white flex items-center justify-center">Nicht gefunden.</div>;

    return (
        <div className="min-h-screen bg-[#0a0f0d] text-[#e8e4d9] font-sans selection:bg-emerald-500/30 overflow-hidden relative">

            {/* Background Texture (Subtle Noise or Gradient) */}
            <div className="fixed inset-0 bg-[#0a0f0d] z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-[#0a0f0d] to-[#0a0f0d]"></div>
            </div>

            <div className="relative z-10">

                {/* --- SEKTION 1: REZITATION (FULL SCREEN) --- */}
                <div className="h-screen flex flex-col items-center justify-center p-8 relative">

                    {/* Header Minimal */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2 }}
                        className="absolute top-12 left-0 right-0 text-center"
                    >
                        <span className="text-[10px] uppercase tracking-[0.4em] text-emerald-500/40 font-light">
                            Light of Remembrance
                        </span>
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="flex flex-col items-center"
                    >
                        {/* THE BIG PLAYER */}
                        <CircularPlayer
                            url={gift.audioUrl}
                            isActive={playingState === 'recitation'}
                            onToggle={() => toggleAudio('recitation')}
                        />

                        <h1 className="mt-12 text-2xl md:text-3xl font-serif text-stone-200 tracking-wide text-center max-w-lg leading-relaxed">
                            {gift.title}
                        </h1>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-stone-500/50"
                    >
                        <span className="text-[9px] uppercase tracking-widest">Die Bedeutung</span>
                        <div className="w-px h-8 bg-gradient-to-b from-emerald-500/50 to-transparent"></div>
                    </motion.div>
                </div>


                {/* --- SEKTION 2: BEDEUTUNG (SCROLL) --- */}
                <div className="min-h-[80vh] flex flex-col items-center px-6 py-24 bg-gradient-to-b from-transparent to-black/40">

                    <div className="w-full max-w-lg space-y-12">

                        {/* Divider */}
                        <div className="flex justify-center mb-12">
                            <Sparkles className="h-5 w-5 text-emerald-900/40" />
                        </div>

                        {/* Meaning Audio Player (If exists) */}
                        {gift.meaningAudioUrl && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <InlinePlayer
                                    url={gift.meaningAudioUrl}
                                    label="Bedeutung anhören"
                                    isActive={playingState === 'meaning'}
                                    onToggle={() => toggleAudio('meaning')}
                                />
                            </motion.div>
                        )}

                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="prose prose-invert prose-stone prose-lg mx-auto text-center md:text-justify leading-relaxed"
                        >
                            <ReactMarkdown
                                components={{
                                    p: ({ node, ...props }) => <p className="text-xl font-light text-stone-300/90 mb-8" style={{ lineHeight: '1.8' }} {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-medium text-emerald-400" {...props} />,
                                }}
                            >
                                {gift.meaningText || "_Keine schriftliche Bedeutung hinterlegt._"}
                            </ReactMarkdown>
                        </motion.div>

                        {/* Footer Branding */}
                        <div className="pt-32 pb-12 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
                            <div className="h-px w-12 bg-emerald-500/50"></div>
                            <a
                                href="https://www.kamlimos.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs uppercase tracking-[0.3em] text-emerald-100 hover:text-emerald-400 font-light"
                            >
                                www.kamlimos.com
                            </a>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
