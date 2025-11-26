import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById, markGiftAsViewed } from '../services/gifts';
import { sendNotificationEmail } from '../services/email';
import { Lock, Unlock, Play, Loader, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GiftReveal() {
    const { id } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [unlocked, setUnlocked] = useState(false);

    useEffect(() => {
        const fetchGift = async () => {
            console.log("Fetching gift with ID:", id);
            try {
                const data = await getGiftById(id);
                console.log("Fetch result:", data);
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
            console.error("No ID provided in URL");
            setLoading(false);
        }
    }, [id]);

    const handleUnlock = async (e) => {
        e.preventDefault();
        if (gift && pin === gift.accessCode) {
            setUnlocked(true);
            if (!gift.viewed) {
                // Mark as viewed in DB
                await markGiftAsViewed(id);

                // Send notification email
                console.log("Sending notification email...");
                await sendNotificationEmail(gift);
            }
        } else {
            setError("Falscher PIN Code. Bitte versuche es erneut.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <Loader className="h-8 w-8 animate-spin text-rose-600" />
            </div>
        );
    }

    if (!gift) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-stone-900">Geschenk nicht gefunden</h1>
                    <p className="mt-2 text-stone-600">Bitte überprüfe den Link oder scanne den QR-Code erneut.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 overflow-hidden">
            <AnimatePresence>
                {!unlocked ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="min-h-screen flex flex-col items-center justify-center p-4"
                    >
                        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
                            <div className="text-center">
                                <div className="mx-auto h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center">
                                    <Lock className="h-8 w-8 text-rose-600" />
                                </div>
                                <h2 className="mt-6 text-3xl font-serif font-bold text-stone-900">
                                    Für {gift.recipientName}
                                </h2>
                                <p className="mt-2 text-stone-600">
                                    Ein persönliches Geschenk wartet auf dich.
                                    <br />
                                    Bitte gib deinen PIN ein.
                                </p>
                            </div>

                            <form onSubmit={handleUnlock} className="mt-8 space-y-6">
                                <div>
                                    <input
                                        type="text"
                                        required
                                        value={pin}
                                        onChange={(e) => {
                                            setPin(e.target.value);
                                            setError('');
                                        }}
                                        className="appearance-none block w-full px-3 py-4 border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-rose-500 focus:border-rose-500 text-center text-2xl tracking-widest"
                                        placeholder="PIN"
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-500 text-sm text-center">{error}</div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                                >
                                    Geschenk öffnen
                                </button>
                            </form>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="min-h-screen bg-stone-50"
                    >
                        {/* Hero Section */}
                        <div className="bg-rose-600 text-white py-20 px-4 text-center relative overflow-hidden">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="relative z-10"
                            >
                                <Heart className="h-16 w-16 mx-auto mb-4 text-rose-200 animate-pulse" />
                                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">
                                    Alles Liebe, {gift.recipientName}!
                                </h1>
                                <p className="text-xl text-rose-100">
                                    Eine Nachricht von {gift.customerName}
                                </p>
                            </motion.div>

                            {/* Decorative circles */}
                            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-64 h-64 rounded-full bg-rose-500 opacity-50 blur-3xl"></div>
                            <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-64 h-64 rounded-full bg-rose-700 opacity-50 blur-3xl"></div>
                        </div>

                        {/* Timeline */}
                        <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
                            {gift.messages.map((msg, index) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + index * 0.2 }}
                                    className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-lg w-full ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'}`}>
                                        <div className={`bg-white p-6 rounded-2xl shadow-lg border-b-4 border-rose-100 relative ${index % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'
                                            }`}>
                                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
                                                {msg.author} sagt:
                                            </p>

                                            {msg.type === 'text' ? (
                                                <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap">
                                                    {msg.content}
                                                </p>
                                            ) : (
                                                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-black">
                                                    {/* Simple embed detection - in production use a proper library */}
                                                    {msg.content.includes('youtube') || msg.content.includes('youtu.be') ? (
                                                        <iframe
                                                            src={msg.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                            title="Video message"
                                                            className="w-full h-full min-h-[200px]"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    ) : (
                                                        <a
                                                            href={msg.content}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center h-full min-h-[200px] bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                                                        >
                                                            <Play className="h-12 w-12 opacity-80" />
                                                            <span className="ml-2">Video ansehen</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="text-center pb-12 text-stone-400 text-sm">
                            <p>Mit ❤️ erstellt</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
