import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic, Download, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AudioViewer({ gift }) {
    const defaultTitle = 'Eine Nachricht für dich';
    const headline = gift?.headline || defaultTitle;
    const message = gift?.messages?.[0]?.content || '';
    const audioUrl = gift?.audioUrl;

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        const updateProgress = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        if (!audioRef.current) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const percent = x / bounds.width;
        audioRef.current.currentTime = percent * audioRef.current.duration;
    };

    const handleDownload = async () => {
        if (!audioUrl || isDownloading) return;
        try {
            setIsDownloading(true);
            const response = await fetch(audioUrl);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            const safeHeadline = (headline || 'audio').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            a.download = `${safeHeadline}.mp3`;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Sicherheits-Blockade (CORS): Firebase blockiert den direkten Download. Bitte wende die `cors.json` Einstellungen in deiner Google Cloud Console an, wie vom System beschrieben.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#111] text-stone-200 flex flex-col items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-lg w-full bg-[#1A1A1A] rounded-3xl p-8 md:p-12 shadow-2xl border border-stone-800/80 relative overflow-hidden"
            >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50"></div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
                        <Mic className="text-indigo-400 w-8 h-8" />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-display font-medium text-white mb-2 tracking-wide">
                        {headline}
                    </h1>

                    {message && (
                        <p className="text-stone-400 text-sm md:text-base leading-relaxed mt-4 mb-8 whitespace-pre-wrap">
                            {message}
                        </p>
                    )}

                    {!message && <div className="h-8"></div>}

                    {audioUrl ? (
                        <div className="w-full bg-[#222] rounded-2xl p-6 mt-4">
                            <audio ref={audioRef} src={audioUrl} preload="auto" />

                            {/* Play Controls */}
                            <div className="flex items-center justify-center gap-6 mb-6">
                                <button
                                    onClick={togglePlay}
                                    className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center transition-all transform hover:scale-105"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-6 h-6 text-white ml-0.5" />
                                    ) : (
                                        <Play className="w-7 h-7 text-white ml-1.5" />
                                    )}
                                </button>
                                
                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className="w-12 h-12 rounded-full bg-stone-800 hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                                    title="Audio herunterladen"
                                >
                                    {isDownloading ? (
                                        <Loader className="w-5 h-5 text-stone-300 animate-spin" />
                                    ) : (
                                        <Download className="w-5 h-5 text-stone-300" />
                                    )}
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div
                                className="h-1.5 bg-stone-800 rounded-full w-full cursor-pointer relative overflow-hidden hover:h-2 transition-all"
                                onClick={handleSeek}
                            >
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-100 ease-linear"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full bg-[#222] rounded-2xl p-6 mt-4 text-center">
                            <p className="text-stone-500 text-sm">Kein Audio gefunden.</p>
                        </div>
                    )}
                </div>

                <div className="mt-12 text-center">
                    <div className="text-[10px] text-stone-600 uppercase tracking-widest font-bold font-sans">
                        KAMLIMOS
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
