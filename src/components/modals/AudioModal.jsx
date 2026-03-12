import React, { useState, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Upload, FileAudio } from "lucide-react";
import { createGift, updateGift, getGiftById } from "../../services/gifts";
import { uploadAudioFile } from "../../services/audioUpload";
import { v4 as uuidv4 } from "uuid";

export default function AudioModal({ isOpen, onClose, onSuccess }) {
    const [form, setForm] = useState({
        customerName: "",
        headline: "",
        message: "",
    });
    const [audioFile, setAudioFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("audio/")) {
                alert("Bitte wähle eine gültige Audio-Datei aus (z.B. MP3 oder WAV).");
                return;
            }
            setAudioFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            if (!file.type.startsWith("audio/")) {
                alert("Bitte wähle eine gültige Audio-Datei aus (z.B. MP3 oder WAV).");
                return;
            }
            setAudioFile(file);
        }
    };

    const handleSubmit = async () => {
        if (!audioFile) {
            alert("Bitte lade eine Audio-Datei hoch.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create the gift to get an ID
            const giftMessages = [];
            if (form.message.trim()) {
                giftMessages.push({
                    id: uuidv4(),
                    type: "text",
                    content: form.message.trim(),
                    title: "",
                    author: "System"
                });
            }

            const giftId = await createGift({
                project: "audio",
                productType: "audio-gift",
                customerName: form.customerName,
                recipientName: form.customerName,
                senderName: form.customerName,
                headline: form.headline,
                messages: giftMessages,
                status: "open",
                platform: "manual",
                isPublic: true,  // For generic audio, make it public by default (no PIN needed)
                locked: true,    // Instantly ready for the viewer
                setupStarted: true,
                setupCompletedAt: new Date(),
                viewed: false,
            });

            // 2. Upload the audio file using the new giftId
            const { url: audioUrl } = await uploadAudioFile(giftId, audioFile);

            // 3. Update the gift with the audio DB url
            await updateGift(giftId, { audioUrl });

            // 4. Generate Viewer Link
            await new Promise((resolve) => setTimeout(resolve, 500));
            const createdGift = await getGiftById(giftId);

            if (createdGift) {
                const isStaging =
                    window.location.hostname.includes("staging") ||
                    window.location.hostname.includes("localhost");
                const baseUrl = isStaging
                    ? window.location.origin
                    : "https://scan.kamlimos.com"; // Default for generic projects

                // Viewer Link (since it is instantly locked)
                const viewerUrl = `${baseUrl}/view/${giftId}`;
                const name = form.customerName || "Kunde";

                const outputMessage = `Hallo ${name},\n\nhier ist dein persönliches Audio:\n${viewerUrl}`;

                navigator.clipboard.writeText(outputMessage);
                alert(
                    `Audio-Geschenk erfolgreich erstellt!\n\nDer Link zum Abspielen wurde in die Zwischenablage kopiert.`
                );
            }

            onSuccess();
            onClose();
            setForm({
                customerName: "",
                headline: "",
                message: "",
            });
            setAudioFile(null);
        } catch (error) {
            console.error("Failed to create audio gift", error);
            alert(error.message || "Fehler beim Erstellen des Audio-Geschenks.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto pt-20 pb-20">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative my-auto"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-3 bg-stone-100 rounded-full">
                                <Mic className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold font-serif text-stone-900">
                                    Audio Upload
                                </h3>
                                <p className="text-stone-500 text-sm">Generisches Audio-Geschenk erstellen</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Kunden Name / Empfänger
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="z.B. Lisa Müller"
                                    value={form.customerName}
                                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Titel der Seite
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="z.B. Eine Nachricht für dich"
                                    value={form.headline}
                                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Nachricht / Text (Optional)
                                </label>
                                <textarea
                                    className="w-full p-3 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                                    placeholder="Zusätzlicher Text, der über oder unter dem Audio-Player angezeigt wird..."
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                />
                            </div>

                            {/* Audio Upload Box */}
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Audio-Datei
                                </label>
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${audioFile
                                            ? "border-indigo-500 bg-indigo-50 hover:bg-indigo-100"
                                            : "border-stone-300 hover:border-indigo-400 hover:bg-stone-50"
                                        }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="audio/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    {audioFile ? (
                                        <div className="flex flex-col items-center text-center">
                                            <FileAudio className="h-8 w-8 text-indigo-500 mb-2" />
                                            <span className="text-sm font-medium text-indigo-900 line-clamp-1">
                                                {audioFile.name}
                                            </span>
                                            <span className="text-xs text-indigo-500 mt-1">
                                                {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center">
                                            <Upload className="h-8 w-8 text-stone-400 mb-2" />
                                            <span className="text-sm font-medium text-stone-700">
                                                Datei auswählen oder hierher ziehen
                                            </span>
                                            <span className="text-xs text-stone-400 mt-1">
                                                MP3, WAV, etc. (Max. 50 MB)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !audioFile || !form.customerName.trim()}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-4 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                            >
                                {isSubmitting ? "Wird hochgeladen..." : "Audio-Geschenk Erstellen"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
