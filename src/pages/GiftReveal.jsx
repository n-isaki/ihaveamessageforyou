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
    const [confirmationSent, setConfirmationSent] = useState(false);

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
            // We don't mark as viewed automatically anymore
        } else {
            setError("Falscher PIN Code. Bitte versuche es erneut.");
        }
    };

    const handleSendConfirmation = async () => {
        if (!gift || confirmationSent) return;

        try {
            setConfirmationSent(true);

            // Mark as viewed in DB
            if (!gift.viewed) {
                await markGiftAsViewed(id);
            }

            // Send notification email
            console.log("Sending notification email...");
            await sendNotificationEmail(gift);

        } catch (error) {
            console.error("Error sending confirmation:", error);
            // Optionally handle error state here, but we keep the button as "sent" to not confuse user
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

    if (!unlocked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 mb-6">
                        <Lock className="h-10 w-10 text-rose-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-stone-900 mb-2">Ein Geschenk für dich</h1>
                    <p className="text-stone-500 mb-8">Gib deinen persönlichen PIN Code ein, um deine Nachricht zu sehen.</p>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <input
                            type="text"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value);
                                setError('');
                            }}
                            className="block w-full text-center text-2xl tracking-widest border border-stone-300 rounded-lg py-3 focus:ring-rose-500 focus:border-rose-500 outline-none"
                            placeholder="1234"
                            maxLength={4}
                        />
                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
                        >
                            Geschenk öffnen
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Hero Section */}
            <div className="bg-rose-600 text-white py-12 px-4 text-center relative overflow-hidden">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="relative z-10"
                >
                    <Heart className="h-16 w-16 mx-auto mb-4 text-rose-200 fill-current" />
                    <h1 className="text-4xl font-bold mb-2">Für {gift.recipientName}</h1>
                    <p className="text-rose-100">Eine Nachricht von {gift.customerName}</p>
                </motion.div>

                {/* Decorative circles */}
                <div className="absolute top-0 left-0 -ml-20 -mt-20 w-64 h-64 rounded-full bg-rose-500 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-64 h-64 rounded-full bg-rose-700 opacity-50 blur-3xl"></div>
            </div>

            {/* Content Timeline */}
            <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
                {gift.messages?.map((msg, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.3 }}
                        className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                    >
                        <div className={`max-w-lg w-full bg-white rounded-2xl shadow-lg overflow-hidden ${index % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'
                            }`}>
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index % 2 === 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                        }`}>
                                        {msg.author.charAt(0)}
                                    </div>
                                    <span className="ml-3 font-medium text-stone-900">{msg.author}</span>
                                </div>

                                {msg.type === 'text' ? (
                                    <p className="text-stone-600 text-lg leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </p>
                                ) : (
                                    <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
                                        {msg.content.includes('youtube') || msg.content.includes('youtu.be') ? (
                                            <iframe
                                                src={msg.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                title="Video Message"
                                                className="w-full h-full min-h-[300px]"
                                                allowFullScreen
                                            ></iframe>
                                        ) : (
                                            <div className="flex items-center justify-center h-48 bg-stone-100">
                                                <a
                                                    href={msg.content}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center text-rose-600 hover:text-rose-700"
                                                >
                                                    <Play className="h-12 w-12 mr-2" />
                                                    Video ansehen
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Confirmation Button Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (gift.messages?.length || 0) * 0.3 + 0.5 }}
                    className="flex justify-center pt-8 pb-12"
                >
                    {!confirmationSent && !gift.viewed ? (
                        <button
                            onClick={handleSendConfirmation}
                            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white transition-all duration-200 bg-emerald-500 rounded-full shadow-lg hover:bg-emerald-600 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                            <span className="mr-2">💌</span>
                            Nachricht gelesen & Freude teilen
                            <div className="absolute inset-0 rounded-full ring-4 ring-white/30 group-hover:ring-white/50 transition-all"></div>
                        </button>
                    ) : (
                        <div className="text-center animate-fade-in">
                            <div className="inline-flex items-center justify-center px-8 py-3 bg-stone-100 rounded-full text-emerald-600 font-medium shadow-inner">
                                <span className="mr-2">✨</span>
                                Danke! Die Bestätigung wurde gesendet.
                            </div>
                            <p className="mt-2 text-sm text-stone-400">
                                {gift.customerName} freut sich, dass du die Nachricht gesehen hast.
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
