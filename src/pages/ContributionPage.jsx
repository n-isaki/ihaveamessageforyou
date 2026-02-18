import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader, Gift, Send } from "lucide-react";
// eslint-disable-next-line no-unused-vars -- motion is used in JSX as <motion.div>
import { motion } from "framer-motion";

import { getGiftByContributionToken, addContribution } from "../services/gifts";

export default function ContributionPage() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [giftData, setGiftData] = useState(null);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);

    // Form State
    const [author, setAuthor] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!token) {
                setError("Ungültiger Link");
                setLoading(false);
                return;
            }

            try {
                const data = await getGiftByContributionToken(token);
                setGiftData(data);
            } catch (err) {
                console.error("Failed to load gift:", err);
                if (err.message && (err.message.includes("permission-denied") || err.message.includes("deaktiviert"))) {
                    setError("Diese Funktion ist für dieses Geschenk leider deaktiviert.");
                } else {
                    setError("Geschenk nicht gefunden oder Link abgelaufen.");
                }
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!author.trim() || !content.trim()) return;

        setSubmitting(true);
        try {
            await addContribution(giftData.giftId, {
                author: author.trim(),
                content: content.trim(),
                type: "text", // MVP: Text only first
                contributionToken: token, // Validate security rule
            });
            setSubmitted(true);
        } catch (err) {
            console.error("Failed to submit:", err);
            alert("Fehler beim Senden. Bitte versuche es erneut.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <Loader className="animate-spin text-rose-500 h-8 w-8" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-200">
                <div className="text-center">
                    <h1 className="text-white text-xl font-bold mb-4">Ups...</h1>
                    <p className="text-stone-400">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-3 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-all"
                    >
                        Erneut versuchen
                    </button>
                </div>
            </div>
        );
    }

    if (!giftData || !giftData.allowContributions) {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-200">
                <div className="text-center">
                    <h1 className="text-white text-xl font-bold mb-4">Geschenk nicht gefunden</h1>
                    <p className="text-stone-400">Das angefragte Geschenk konnte nicht gefunden werden.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-3 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-all"
                    >
                        Zurück zur Startseite
                    </button>
                </div>
            </div>
        );
    }

    if (!giftData.contributions || giftData.contributions.length === 0) {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-200">
                <div className="text-center">
                    <h1 className="text-white text-xl font-bold mb-4">Noch keine Beiträge</h1>
                    <p className="text-stone-400">Dieses Geschenk hat noch keine Beiträge. Sei der Erste, der eine Nachricht hinterlässt!</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-3 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-all"
                    >
                        Zurück zur Startseite
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 text-white font-sans selection:bg-rose-500/30">
            <div className="max-w-md mx-auto min-h-screen flex flex-col p-6">
                {/* Header with Branding */}
                <div className="text-center mb-6 pt-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-rose-900/20 mb-6 rotate-3">
                        <Gift className="text-white h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Für {giftData.recipientName}</h1>

                    <div className="bg-stone-900/60 p-5 rounded-2xl border border-stone-800/80 mt-6 text-left shadow-inner">
                        <p className="text-stone-300 text-sm leading-relaxed">
                            👋 <strong>Hallo!</strong> Du wurdest eingeladen, dieses Geschenk zu etwas ganz Besonderem zu machen.
                        </p>
                        <p className="text-stone-400 text-sm mt-2 leading-relaxed">
                            Hinterlasse eine persönliche Nachricht. Sie erscheint auf dem Geschenk, sobald {giftData.recipientName} den Code scannt.
                        </p>
                    </div>
                </div>

                {/* Success State or Form */}
                {submitted ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-stone-900/50 border border-green-500/30 rounded-2xl p-8 text-center backdrop-blur-sm"
                    >
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send className="text-green-400 h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Vielen Dank!</h2>
                        <p className="text-stone-300 mb-6">
                            Deine Nachricht wurde erfolgreich gespeichert und wird {giftData.recipientName}
                            erreichen.
                        </p>
                        <a
                            href="https://kamlimos.com"
                            className="inline-block bg-white text-stone-950 px-6 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                        >
                            Eigenes Geschenk erstellen
                        </a>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6 space-y-6 backdrop-blur-sm"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-stone-400 mb-2">
                                    Dein Name
                                </label>
                                <input
                                    type="text"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    placeholder="Wie heißt du?"
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-rose-500/50 outline-none transition-all placeholder-stone-600"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-400 mb-2">
                                    Deine Botschaft
                                </label>
                                <textarea
                                    rows={4}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Schreibe etwas Nettes..."
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-rose-500/50 outline-none transition-all placeholder-stone-600 resize-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-white text-stone-950 py-4 rounded-xl font-bold text-lg hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <Loader className="animate-spin h-5 w-5" />
                                ) : (
                                    <>
                                        <span>Absenden</span>
                                        <Send className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}

                <p className="mt-8 text-xs text-stone-600 text-center leading-relaxed">
                    Deine Nachricht wird zusammen mit den anderen auf dem Geschenk gespeichert.
                </p>
            </div>
        </div>
    );
}
