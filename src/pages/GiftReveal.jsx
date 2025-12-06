import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById, markGiftAsViewed } from '../services/gifts';
import { sendNotificationEmail } from '../services/email';
import { Lock, Play, Loader, Heart, Check, Sparkles, Moon, Sun } from 'lucide-react';
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
    const [darkMode, setDarkMode] = useState(false); // Default Light Mode
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

    const toggleTheme = () => setDarkMode(!darkMode);

    // Wrapper class for theme
    const themeClass = darkMode ? 'dark' : '';

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-stone-950' : 'bg-stone-50'}`}>
                <Loader className="h-8 w-8 animate-spin text-rose-500" />
            </div>
        );
    }

    if (!gift) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900'}`}>
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Geschenk nicht gefunden</h1>
                    <p className={`mt-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Bitte überprüfe den Link.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={themeClass}>
            <div className="min-h-screen transition-colors duration-300 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-200 font-sans selection:bg-rose-500/30">

                {/* Theme Toggle (Always Visible) */}
                <button
                    onClick={toggleTheme}
                    className="fixed top-4 right-4 z-[60] p-2 rounded-full bg-white/80 dark:bg-stone-800/80 backdrop-blur shadow-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:scale-110 transition-all"
                >
                    {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {!unlocked ? (
                    <div className="min-h-screen flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-sm w-full bg-white/80 dark:bg-stone-900/50 backdrop-blur-lg border border-stone-200 dark:border-stone-800 rounded-3xl p-8 text-center shadow-2xl"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 mb-6">
                                <Lock className="h-8 w-8 text-rose-600 dark:text-rose-500" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Geschenk öffnen</h1>
                            <p className="text-stone-500 dark:text-stone-400 mb-8 text-sm">Gib deinen PIN Code ein.</p>

                            <form onSubmit={handleUnlock} className="space-y-4">
                                <input
                                    type="text"
                                    value={pin}
                                    onChange={(e) => {
                                        setPin(e.target.value);
                                        setError('');
                                    }}
                                    className="block w-full text-center text-3xl tracking-[0.5em] bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl py-4 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder-stone-300 dark:placeholder-stone-700"
                                    placeholder="••••"
                                    maxLength={4}
                                />
                                {error && (
                                    <div className="text-red-500 dark:text-red-400 text-xs font-medium">{error}</div>
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
                        {/* Header / Top Bar */}
                        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 py-4">
                            <div className="max-w-2xl mx-auto flex items-center justify-between pr-12"> {/* pr-12 for toggle space */}
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                                        {gift.customerName.charAt(0)}
                                    </div>
                                    <div>
                                        <h1 className="text-sm font-bold leading-none">{gift.customerName}</h1>
                                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">hat dir eine Nachricht gesendet</p>
                                    </div>
                                </div>
                                <Heart className="h-5 w-5 text-rose-500 fill-current animate-pulse" />
                            </div>
                        </div>

                        {/* Chat Content */}
                        <div className="max-w-2xl mx-auto px-4 pt-24 pb-32 space-y-6">
                            {/* Intro Message System */}
                            <div className="flex justify-center">
                                <span className="text-xs font-medium text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-900/50 px-3 py-1 rounded-full border border-stone-200 dark:border-stone-800">
                                    Für {gift.recipientName}
                                </span>
                            </div>

                            {gift.messages?.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: index * 0.2 }}
                                    className={`flex w-full ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${index % 2 === 0
                                        ? 'bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-800 rounded-tl-none text-stone-800 dark:text-stone-200'
                                        : 'bg-rose-500 dark:bg-rose-600 text-white rounded-tr-none shadow-rose-500/20'
                                        }`}>
                                        {/* Author Name (Small) */}
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70 ${index % 2 === 0 ? 'text-stone-400' : 'text-rose-100'
                                            }`}>
                                            {msg.author}
                                        </p>

                                        {msg.type === 'text' ? (
                                            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                        ) : (
                                            <div className="mt-1 rounded-xl overflow-hidden bg-black/5 dark:bg-black/20">
                                                {msg.content.includes('youtube') || msg.content.includes('youtu.be') ? (
                                                    <div className="aspect-w-16 aspect-h-9">
                                                        <iframe
                                                            src={msg.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                            title="Video"
                                                            className="w-full h-full min-h-[200px]"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                ) : (
                                                    <a
                                                        href={msg.content}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center p-8 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                                    >
                                                        <Play className="h-8 w-8 mr-2" />
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
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-stone-50 via-stone-50/90 to-transparent dark:from-stone-950 dark:via-stone-950/90">
                            <div className="max-w-sm mx-auto">
                                <AnimatePresence mode="wait">
                                    {!confirmationSent && !gift.viewed ? (
                                        <motion.button
                                            key="mark-read"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                            onClick={handleSendConfirmation}
                                            className="w-full flex items-center justify-center space-x-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 font-bold py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <Check className="h-5 w-5" />
                                            <span>Gelesen</span>
                                        </motion.button>
                                    ) : (
                                        <motion.div
                                            key="thanks"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex items-center justify-center space-x-2 bg-white/80 dark:bg-stone-900/80 backdrop-blur border border-stone-200 dark:border-stone-800 text-emerald-600 dark:text-emerald-400 font-medium py-4 rounded-2xl shadow-lg"
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
