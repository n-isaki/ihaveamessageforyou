import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById } from '@/services/gifts';
import { Play, Pause, Loader, Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// --- Components ---
const AudioPlayer = ({ url, isPlaying, onToggle }) => (
    <div className="flex flex-col items-center gap-6">
        <button
            onClick={onToggle}
            className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 hover:bg-stone-200 transition-all shadow-sm hover:shadow-md border border-stone-200"
        >
            {isPlaying ? (
                <div className="flex gap-1">
                    <span className="block w-1 h-5 bg-stone-600 rounded-full animate-pulse"></span>
                    <span className="block w-1 h-5 bg-stone-600 rounded-full animate-pulse delay-75"></span>
                </div>
            ) : (
                <Play className="h-8 w-8 text-stone-600 fill-stone-600 ml-1" />
            )}

            {/* Gentle ring animation when playing */}
            {isPlaying && (
                <span className="absolute inset-0 rounded-full border border-stone-300 animate-ping opacity-50"></span>
            )}
        </button>
        <p className="text-xs uppercase tracking-widest text-stone-400 font-medium">In Gedenken anhören</p>
    </div>
);

export default function MemoryViewer() {
    const { id } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        const fetchGift = async () => {
            try {
                const data = await getGiftById(id);
                setGift(data);
                if (data?.audioUrl) audioRef.current.src = data.audioUrl;
            } catch (error) {
                console.error("Failed to load memory", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGift();

        const audio = audioRef.current;
        const handleEnd = () => setIsPlaying(false);
        audio.addEventListener('ended', handleEnd);
        return () => {
            audio.pause();
            audio.removeEventListener('ended', handleEnd);
        };
    }, [id]);

    const toggleAudio = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error("Play error:", e));
            setIsPlaying(true);
        }
    };

    if (loading) return <div className="h-screen bg-[#faf9f6] flex items-center justify-center"><Loader className="animate-spin text-stone-400" /></div>;
    if (!gift) return <div className="h-screen bg-[#faf9f6] flex items-center justify-center text-stone-500">Eintrag nicht gefunden.</div>;

    return (
        <div className="min-h-screen bg-[#faf9f6] text-stone-800 font-serif selection:bg-stone-200">
            {/* Import Elegant Font */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&display=swap');`}
            </style>

            <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col items-center">

                {/* Header / Intro */}
                <div className="mb-24 text-center opacity-60">
                    <Heart className="h-4 w-4 mx-auto mb-4 text-stone-400" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Memoria</span>
                </div>

                {/* Name & Dates (HERO) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="text-center mb-12"
                >
                    <div className="w-px h-16 bg-gradient-to-b from-transparent via-stone-300 to-transparent mx-auto mb-8"></div>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-normal text-stone-900 mb-6 tracking-wide leading-tight" style={{ fontFamily: '"Crimson Pro", serif' }}>
                        {gift.deceasedName}
                    </h1>
                    <p className="text-xl md:text-2xl text-stone-500 italic font-light tracking-[0.2em]">
                        {gift.lifeDates}
                    </p>
                </motion.div>

                {/* Audio Player */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="mb-32"
                >
                    {gift.audioUrl && (
                        <AudioPlayer url={gift.audioUrl} isPlaying={isPlaying} onToggle={toggleAudio} />
                    )}
                </motion.div>

                {/* Story Text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="w-full prose prose-stone prose-lg text-center md:text-justify max-w-lg"
                >
                    <div className="w-16 h-px bg-stone-300 mx-auto mb-10"></div>
                    <ReactMarkdown
                        components={{
                            p: ({ node, ...props }) => <p className="text-xl leading-loose text-stone-600 font-light" style={{ fontFamily: '"Crimson Pro", serif' }} {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-stone-800" {...props} />,
                        }}
                    >
                        {gift.meaningText}
                    </ReactMarkdown>
                </motion.div>

                {/* Footer */}
                <div className="mt-32 opacity-30 text-center">
                    <div className="h-px w-24 bg-stone-300 mx-auto mb-4"></div>
                    <a href="https://www.kamlimos.com" target="_blank" className="text-[10px] uppercase tracking-[0.2em] hover:text-stone-900 transition-colors">
                        www.kamlimos.com
                    </a>
                </div>

            </div>
        </div>
    );
}
