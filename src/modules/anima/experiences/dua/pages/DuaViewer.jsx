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


export default function DuaViewer() {
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
                console.error("Failed to fetch dua", error);
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
            {/* Import Arabic Font */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');`}
            </style>

            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-emerald-950/20 to-stone-950 z-0 pointer-events-none"></div>

            <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 flex flex-col min-h-screen">

                {/* Header (Minimal) */}
                <div className="text-center mb-8 opacity-60">
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent mx-auto mb-4"></div>
                    <span className="text-xs uppercase tracking-[0.3em] font-light">Light of Remembrance</span>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center space-y-12 mb-12">

                    {/* 1. Recitation Player (Prominent) */}
                    <div className="my-4">
                        <CircularPlayer
                            url={gift.audioUrl}
                            label="Rezitation"
                            isActive={playingState === 'recitation'}
                            onToggle={() => toggleAudio('recitation')}
                        />
                    </div>

                    {/* Arabic Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center w-full"
                    >
                        <h1
                            className="text-4xl md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-[#fbfdf2] to-[#c7c2b0] leading-[2.0] py-4"
                            style={{ fontFamily: "'Amiri', serif" }}
                            dir="rtl"
                        >
                            {gift.arabicText}
                        </h1>
                    </motion.div>

                    {/* Divider */}
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

                    {/* Translation Area */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="w-full max-w-lg space-y-8"
                    >
                        {/* Title */}
                        <div className="text-center">
                            <h2 className="text-emerald-500/80 text-sm font-bold uppercase tracking-widest mb-2">
                                {gift.title}
                            </h2>
                        </div>

                        {/* 2. Meaning Player (Inline Bar) - Only show if URL exists */}
                        {gift.meaningAudioUrl && (
                            <InlinePlayer
                                url={gift.meaningAudioUrl}
                                label="Bedeutung & Geschichte"
                                isActive={playingState === 'meaning'}
                                onToggle={() => toggleAudio('meaning')}
                            />
                        )}

                        {/* Text Content */}
                        <div className="prose prose-invert prose-stone mx-auto text-center md:text-justify">
                            <ReactMarkdown
                                components={{
                                    p: ({ node, ...props }) => <p className="text-lg font-light leading-relaxed text-stone-300" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-medium text-emerald-200" {...props} />,
                                }}
                            >
                                {gift.meaningText}
                            </ReactMarkdown>
                        </div>
                    </motion.div>
                </div>

                {/* Footer */}
                <div className="mt-auto text-center opacity-30 cursor-default">
                    <Sparkles className="h-4 w-4 mx-auto mb-4 text-emerald-500/50" />
                </div>
            </div>
        </div>
    );
}
