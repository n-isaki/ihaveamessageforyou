import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById, markGiftAsViewed } from '../services/gifts';
import { sendNotificationEmail } from '../services/email';
import { Lock, Play, Loader, Heart, Check, Sparkles, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function GiftReveal() {
    const { id } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [confirmationSent, setConfirmationSent] = useState(false);
    const [fontSizeLevel, setFontSizeLevel] = useState(0); // 0=Normal, 1=Large, 2=Extra Large
    const messagesEndRef = useRef(null);

    useEffect(() => {
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
    }, [id]);

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
        if (gift && pin === gift.accessCode) {
            setUnlocked(true);
            if (gift.openingAnimation && gift.openingAnimation !== 'none') {
                setTimeout(() => triggerAnimation(gift.openingAnimation), 500);
            }
        } else {
            setError("Falscher PIN Code.");
        }
    };

    const handleSendConfirmation = async () => {
        if (!gift || confirmationSent) return;

        try {
            setConfirmationSent(true);
            if (!gift.viewed) {
                await markGiftAsViewed(id);
            }
            await sendNotificationEmail(gift);
        } catch (error) {
            console.error("Error sending confirmation:", error);
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
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader className="h-8 w-8 animate-spin text-rose-500" />
            </div>
        );
    }

    if (!gift) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Geschenk nicht gefunden</h1>
                    <p className="mt-2 text-stone-500">Bitte überprüfe den Link.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-rose-500/30">

                {!unlocked ? (
                    <div className="min-h-screen flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-sm w-full bg-white/80 backdrop-blur-lg border border-stone-200 rounded-3xl p-8 text-center shadow-2xl"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 mb-6">
                                <Lock className="h-8 w-8 text-rose-600" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Geschenk öffnen</h1>
                            <p className="text-stone-500 mb-8 text-sm">Gib deinen PIN Code ein.</p>

                            <form onSubmit={handleUnlock} className="space-y-4">
                                <input
                                    type="text"
                                    value={pin}
                                    onChange={(e) => {
                                        setPin(e.target.value);
                                        setError('');
                                    }}
                                    className="block w-full text-center text-3xl tracking-[0.5em] bg-stone-50 border border-stone-200 text-stone-900 rounded-xl py-4 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder-stone-300"
                                    placeholder="••••"
                                    maxLength={4}
                                />
                                {error && (
                                    <div className="text-red-500 text-xs font-medium">{error}</div>
                                )}
                                <button
                                    type="submit"
                                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                                >
                                    Entsperren
                                </button>
                            </form>
                        </motion.div>
                    </div>
                ) : (
                    <>
                        {/* Header / Top Bar - Minimalist */}
                        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="h-5 w-5 text-rose-500" />
                                <span className="font-serif italic text-lg text-stone-800">i have a message for you</span>
                            </div>
                            {/* Font Size Toggle moved here for better layout */}
                            <button
                                onClick={toggleFontSize}
                                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all"
                                title="Schriftgröße ändern"
                            >
                                <Type className={`transition-all ${fontSizeLevel === 0 ? 'h-5 w-5' : fontSizeLevel === 1 ? 'h-6 w-6' : 'h-7 w-7'}`} />
                            </button>
                        </div>

                        {/* Premium Content Layout */}
                        <div className="max-w-xl mx-auto px-6 pt-32 pb-40 space-y-12">

                            {/* Intro Text */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-4 mb-16"
                            >
                                <h2 className="text-4xl md:text-5xl font-serif text-stone-800 tracking-tight leading-tight">
                                    Von Herzen für dich
                                </h2>
                                <p className="text-lg text-stone-500 font-light">
                                    Eine persönliche Nachricht von <span className="font-medium text-rose-500">{gift.customerName}</span>
                                </p>
                                <div className="pt-8 flex justify-center">
                                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-stone-300 to-transparent"></div>
                                </div>
                            </motion.div>

                            {gift.messages?.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="bg-white rounded-3xl p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-stone-100 relative overflow-hidden group hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] transition-all duration-500"
                                >
                                    {/* Decorative background element */}
                                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-rose-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out"></div>

                                    <div className="relative z-10">
                                        {/* Author Label */}
                                        <div className="flex items-center space-x-2 mb-6">
                                            <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-xs">
                                                {msg.author.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
                                                {msg.author}
                                            </span>
                                        </div>

                                        {msg.type === 'text' ? (
                                            <p className={`${getFontSizeClass()} text-stone-700 font-medium leading-loose whitespace-pre-wrap`}>
                                                {msg.content}
                                            </p>
                                        ) : (
                                            <div className="rounded-2xl overflow-hidden shadow-lg bg-stone-900">
                                                {msg.content.includes('youtube') || msg.content.includes('youtu.be') ? (
                                                    <div className="aspect-w-16 aspect-h-9">
                                                        <iframe
                                                            src={msg.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                            title="Video"
                                                            className="w-full h-full min-h-[250px]"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                ) : (
                                                    <a
                                                        href={msg.content}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex flex-col items-center justify-center p-12 hover:bg-white/10 transition-colors text-white group"
                                                    >
                                                        <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                                            <Play className="h-8 w-8 fill-current" />
                                                        </div>
                                                        <span className="font-medium">Video abspielen</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-stone-50 via-stone-50/90 to-transparent">
                            <div className="max-w-sm mx-auto">
                                <AnimatePresence mode="wait">
                                    {!confirmationSent && !gift.viewed ? (
                                        <motion.button
                                            key="mark-read"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                            onClick={handleSendConfirmation}
                                            className="w-full flex items-center justify-center space-x-2 bg-stone-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <Check className="h-5 w-5" />
                                            <span>Gelesen</span>
                                        </motion.button>
                                    ) : (
                                        <motion.div
                                            key="thanks"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex items-center justify-center space-x-2 bg-white/80 backdrop-blur border border-stone-200 text-emerald-600 font-medium py-4 rounded-2xl shadow-lg"
                                        >
                                            <Sparkles className="h-5 w-5" />
                                            <span>Danke! Bestätigung gesendet.</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
