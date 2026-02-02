import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById, markGiftAsViewed } from '@/services/gifts';
import { Lock, Play, Loader, Heart, Sparkles, Type } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import { checkRateLimit, resetRateLimit, getRemainingAttempts } from '@/utils/security';

export default function GiftReveal({ initialData }) {
    const { id } = useParams();
    const [gift, setGift] = useState(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [fontSizeLevel, setFontSizeLevel] = useState(0); // 0=Normal, 1=Large, 2=Extra Large
    const isPreview = !!initialData;
    const messagesEndRef = useRef(null);

    // Initial Fetch (Only if no initialData)
    useEffect(() => {
        if (initialData) {
            setGift(initialData);
            setLoading(false);
            return;
        }

        const fetchGift = async () => {
            try {
                const data = await getGiftById(id);
                setGift(data);
            } catch (error) {
                console.error("Failed to fetch gift", error);
                setError("Geschenk nicht gefunden.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchGift();
        } else {
            setLoading(false);
        }
    }, [id, initialData]);


    // Auto-unlock for bracelets AND Mark as Viewed immediately
    useEffect(() => {
        if (gift && gift.productType === 'bracelet') {
            setUnlocked(true);
            if (!gift.viewed && !isPreview) {
                markGiftAsViewed(id).catch(err => console.error("Error marking as viewed", err));
            }
        }
    }, [gift, id, isPreview]);

    // Redirect to Setup if empty and unlocked (Scan-to-Setup)
    useEffect(() => {
        if (gift && !gift.locked && (!gift.messages || gift.messages.length === 0) && gift.productType !== 'bracelet' && !isPreview) {
            // Use window.location for hard redirect or navigate
            // Since we are in Router context... I need useNavigate.
            // But Viewer uses useParams. I need to add useNavigate hook.
            // For now window.location is safer if I don't want to change imports excessively, 
            // but useNavigate is better SPA practice.
            // I'll check imports.
            window.location.href = `/setup/${id}`;
        }
    }, [gift, id, isPreview]);

    const triggerAnimation = (type) => {
        const duration = 3000;
        const end = Date.now() + duration;

        if (type === 'hearts') {
            (function frame() {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#e11d48', '#be123c'], // Rose colors
                    shapes: ['heart']
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#e11d48', '#be123c'],
                    shapes: ['heart']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        } else if (type === 'stars') {
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = end - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                    shapes: ['star'],
                    colors: ['#FFD700', '#FFA500']
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                    shapes: ['star'],
                    colors: ['#FFD700', '#FFA500']
                });
            }, 250);
        } else if (type === 'confetti') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#e11d48', '#10b981', '#3b82f6', '#f59e0b']
            });
        }
    };

    const handleUnlock = async (e) => {
        e.preventDefault();
        
        // Rate Limiting: Check if too many attempts
        if (checkRateLimit(`pin_${id}`)) {
            const remaining = getRemainingAttempts(`pin_${id}`);
            setError(`Zu viele Versuche. Bitte warte eine Stunde. (${remaining} Versuche übrig)`);
            return;
        }
        
        if (gift && pin === gift.accessCode) {
            // Success: Reset rate limit
            resetRateLimit(`pin_${id}`);
            setUnlocked(true);

            // Mark as viewed when unlocked with PIN
            if (!gift.viewed && !isPreview) {
                markGiftAsViewed(id).catch(err => console.error("Error marking as viewed", err));
            }

            if (gift.openingAnimation && gift.openingAnimation !== 'none') {
                setTimeout(() => triggerAnimation(gift.openingAnimation), 500);
            }
        } else {
            const remaining = getRemainingAttempts(`pin_${id}`);
            setError(`Falscher PIN Code. (${remaining} Versuche übrig)`);
        }
    };

    const toggleFontSize = () => {
        setFontSizeLevel((prev) => (prev + 1) % 3);
    };

    const getFontSizeClass = () => {
        switch (fontSizeLevel) {
            case 1: return 'text-lg md:text-xl leading-relaxed';
            case 2: return 'text-xl md:text-2xl leading-loose';
            default: return 'text-sm md:text-base leading-relaxed';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-950">
                <Loader className="h-8 w-8 animate-spin text-rose-500" />
            </div>
        );
    }

    if (!gift) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Geschenk nicht gefunden</h1>
                    <p className="mt-2 text-stone-500">Bitte überprüfe den Link.</p>
                </div>
            </div>
        );
    }

    const isBracelet = gift?.productType === 'bracelet' || (gift?.engravingText && gift.engravingText.length > 0);

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-rose-500/30">
            {!unlocked ? (
                <div className="min-h-screen flex items-center justify-center p-4 bg-stone-950 text-stone-100">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-sm w-full bg-stone-900/60 backdrop-blur-xl border border-stone-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -z-10"></div>

                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-800 border border-stone-700 mb-6 shadow-inner">
                            <Lock className="h-6 w-6 text-rose-500" />
                        </div>
                        <h1 className="text-2xl font-serif italic text-stone-100 mb-2">Deine Nachricht</h1>
                        <p className="text-stone-400 mb-8 text-sm font-light">Eine persönliche Botschaft wartet auf dich.</p>

                        <form onSubmit={handleUnlock} className="space-y-4">
                            <input
                                type="text"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value);
                                    setError('');
                                }}
                                className="block w-full text-center text-3xl tracking-widest bg-stone-950/50 border border-stone-700 text-white rounded-xl py-4 focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 outline-none transition-all placeholder-stone-700 font-mono uppercase"
                                placeholder="CODE"
                            />
                            {error && (
                                <div className="text-rose-500 text-xs font-medium tracking-wide">{error}</div>
                            )}
                            <button
                                type="submit"
                                className="w-full py-4 px-4 rounded-xl text-sm font-medium tracking-wide text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all shadow-lg shadow-rose-900/20 mt-2"
                            >
                                Nachricht öffnen
                            </button>
                        </form>
                    </motion.div>
                </div>
            ) : (
                <>
                    {/* Size Toggle (Top Right) */}
                    <div className="fixed top-0 right-0 z-50 p-6 mix-blend-difference">
                        <button
                            onClick={toggleFontSize}
                            className="p-2 rounded-full hover:bg-white/10 text-stone-500 hover:text-stone-300 transition-all"
                            title="Schriftgröße ändern"
                        >
                            <Type className={`transition-all ${fontSizeLevel === 0 ? 'h-5 w-5' : fontSizeLevel === 1 ? 'h-6 w-6' : 'h-7 w-7'}`} />
                        </button>
                    </div>

                    {isBracelet ? (
                        /* BRACELET MODE (Dark Premium Theme) */
                        <div className="min-h-screen flex flex-col">
                            {/* Hero Section */}
                            <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="text-center space-y-8 max-w-4xl"
                                >
                                    <div className="inline-block mb-4">
                                        <Sparkles className="h-6 w-6 text-indigo-400 mx-auto animate-pulse" />
                                    </div>
                                    <h1 className="text-5xl md:text-7xl lg:text-8xl italic font-serif tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-stone-400">
                                        "{gift.engravingText || ""}"
                                    </h1>
                                </motion.div>

                                {/* Scroll Indicator */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2, duration: 1 }}
                                    className="absolute bottom-12 left-0 right-0 flex justify-center"
                                >
                                    <div className="flex flex-col items-center text-stone-500 text-xs tracking-[0.2em] uppercase animate-bounce">
                                        <span className="mb-2">Die Bedeutung</span>
                                        <div className="w-px h-8 bg-gradient-to-b from-stone-500 to-transparent"></div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Content Section */}
                            <div className="min-h-[80vh] bg-stone-900 flex flex-col items-center justify-center p-8 md:p-16">
                                <div className="max-w-2xl w-full space-y-8 mb-auto mt-auto">
                                    <div className="h-px w-24 bg-indigo-500 mb-8 opacity-50"></div>

                                    {/* MARKDOWN CONTENT */}
                                    <div className={`prose prose-invert prose-stone max-w-none ${getFontSizeClass()}`}>
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-6 leading-loose text-stone-300 font-light" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                                                h1: ({ node, ...props }) => <h1 className="text-3xl font-serif text-white mt-8 mb-4" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-2xl font-serif text-stone-200 mt-8 mb-4 border-b border-stone-800 pb-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-xl font-serif text-stone-200 mt-6 mb-3" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-stone-300" {...props} />,
                                                li: ({ node, ...props }) => <li className="pl-2" {...props} />,
                                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 italic text-stone-400 my-6 bg-stone-950/30 p-4 rounded-r-lg" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-indigo-400 hover:text-indigo-300 underline" {...props} />,
                                            }}
                                        >
                                            {gift.meaningText || ""}
                                        </ReactMarkdown>
                                    </div>

                                    <div className="flex justify-end mt-12">
                                        <Heart className="h-5 w-5 text-indigo-500 fill-current opacity-50" />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-20 text-center opacity-30 hover:opacity-100 transition-opacity pb-20">
                                    <a href="https://www.kamlimos.de" target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-[0.2em] font-light hover:text-white transition-colors">
                                        www.kamlimos.de
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* MUG MODE (Cinematic Dark Theme) */
                        <div className="min-h-screen bg-stone-950 flex flex-col">
                            {/* Hero Section */}
                            <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center space-y-6 max-w-4xl"
                                >
                                    <div className="inline-flex justify-center mb-4">
                                        <div className="w-px h-16 bg-gradient-to-b from-transparent via-rose-500 to-transparent opacity-50"></div>
                                    </div>
                                    <h2 className="text-5xl md:text-7xl font-serif italic text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-stone-500 tracking-tight leading-tight">
                                        {gift.headline ? (
                                            <ReactMarkdown className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight">{gift.headline || ''}</ReactMarkdown>
                                        ) : (
                                            <>Von Herzen<br />für dich</>
                                        )}
                                    </h2>
                                    <p className="text-lg text-stone-400 font-light tracking-wide mt-8">
                                        {gift.subheadline ? (
                                            <span>{gift.subheadline}</span>
                                        ) : (
                                            <>Eine Botschaft von <span className="font-medium text-rose-400 border-b border-rose-500/30 pb-0.5">{gift.senderName || gift.customerName}</span></>
                                        )}
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1, duration: 1 }}
                                    className="absolute bottom-12 left-0 right-0 flex justify-center"
                                >
                                    <div className="flex flex-col items-center text-stone-500 text-xs tracking-[0.2em] uppercase animate-bounce">
                                        <span className="mb-2">Nachricht öffnen</span>
                                        <div className="w-px h-8 bg-gradient-to-b from-stone-500 to-transparent"></div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Messages Section */}
                            <div className="min-h-screen bg-stone-900/50 flex flex-col items-center p-6 md:p-12 space-y-24 py-32">
                                {gift.messages?.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="max-w-2xl w-full"
                                    >
                                        <div className="bg-stone-900 backdrop-blur-sm rounded-[2rem] p-8 md:p-12 border border-stone-800 shadow-2xl relative overflow-hidden group hover:border-stone-700/50 transition-colors">
                                            {/* Glow Effect */}
                                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-700"></div>

                                            <div className="relative z-10">
                                                {/* Author Bubble */}
                                                <div className="flex items-center space-x-3 mb-8">
                                                    <div className="h-10 w-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-serif italic text-lg shadow-inner">
                                                        {msg.author.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500/80">
                                                            {msg.author}
                                                        </span>
                                                        <span className="text-[10px] text-stone-600 uppercase tracking-wider">
                                                            {msg.type === 'video' ? 'Video Botschaft' : 'Persönliche Worte'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                {msg.type === 'text' ? (
                                                    <div className="relative">
                                                        <span className="absolute -top-4 -left-2 text-6xl text-stone-800 font-serif opacity-50 user-select-none">"</span>
                                                        <p className={`${getFontSizeClass()} text-stone-200 font-light leading-loose whitespace-pre-wrap pl-4 border-l-2 border-stone-800`}>
                                                            {msg.content}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-2xl overflow-hidden shadow-2xl bg-black border border-stone-800 ring-1 ring-white/5">
                                                        {msg.content.includes('youtube') || msg.content.includes('youtu.be') ? (
                                                            <div className="aspect-w-16 aspect-h-9">
                                                                <iframe
                                                                    src={msg.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                                    title="Video"
                                                                    className="w-full h-full min-h-[250px]"
                                                                    allowFullScreen
                                                                    frameBorder="0"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                ></iframe>
                                                            </div>
                                                        ) : (
                                                            <a href={msg.content} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-16 text-stone-400 hover:text-white transition-colors group/video">
                                                                <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mb-4 group-hover/video:scale-110 group-hover/video:bg-rose-600 transition-all duration-300">
                                                                    <Play className="h-6 w-6 ml-1 text-inherit" />
                                                                </div>
                                                                <span className="uppercase tracking-widest text-xs font-bold">Video öffnen</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Footer */}
                                <div className="mt-20 text-center opacity-30 hover:opacity-100 transition-opacity">
                                    <Sparkles className="h-6 w-6 mx-auto mb-4 animate-pulse text-stone-500" />
                                    <a href="https://www.kamlimos.de" target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-[0.2em] font-light hover:text-white transition-colors">
                                        www.kamlimos.de
                                    </a>
                                </div>
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
