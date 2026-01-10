import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById } from '@/services/gifts';
import { Play, Pause, Loader, Volume2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function DuaViewer() {
    const { id } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);

    // Audio Reference
    const audioRef = useRef(new Audio());

    useEffect(() => {
        const fetchGift = async () => {
            try {
                const data = await getGiftById(id);
                setGift(data);
                if (data?.audioUrl) {
                    audioRef.current.src = data.audioUrl;
                }
            } catch (error) {
                console.error("Failed to fetch dua", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGift();

        // Cleanup
        return () => {
            audioRef.current.pause();
            audioRef.current.src = "";
        };
    }, [id]);

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => setPlaying(false);
        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, []);

    const togglePlay = () => {
        if (!gift?.audioUrl) return;

        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Play error:", e));
        }
        setPlaying(!playing);
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
                <div className="text-center mb-12 opacity-60">
                    <div className="w-px h-16 bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent mx-auto mb-4"></div>
                    <span className="text-xs uppercase tracking-[0.3em] font-light">Light of Remembrance</span>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-12 mb-12">

                    {/* Audio Player Circle */}
                    <div className="relative group cursor-pointer" onClick={togglePlay}>
                        {/* Pulse Effect when playing */}
                        {playing && (
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                        )}

                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            animate={{ scale: playing ? 1.05 : 1 }}
                            className="w-32 h-32 rounded-full border border-emerald-500/30 flex items-center justify-center bg-stone-900/50 backdrop-blur-md shadow-2xl relative z-10 transition-colors hover:border-emerald-500/60"
                        >
                            {playing ? (
                                <Pause className="h-10 w-10 text-emerald-400 fill-current ml-0.5" />
                            ) : (
                                <Play className="h-10 w-10 text-emerald-400 fill-current ml-1.5" />
                            )}
                        </motion.div>
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

                    {/* Translation / Meaning */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center max-w-prose mx-auto"
                    >
                        <h2 className="text-emerald-500/80 text-sm font-bold uppercase tracking-widest mb-6">
                            {gift.title}
                        </h2>

                        <div className="prose prose-invert prose-stone mx-auto">
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
