import React, { useState, useRef, useEffect } from "react";
// eslint-disable-next-line no-unused-vars -- motion is used in JSX as <motion.div>
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Sparkles, Play, X } from "lucide-react";

export default function MugExperience({ gift, getFontSizeClass }) {
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const contentStartRef = useRef(null);

    const albumImages = gift?.albumImages || [];

    const scrollToContent = () => {
        contentStartRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    const hasHero =
        (typeof gift.headline === "string" && gift.headline.trim()) ||
        (typeof gift.subheadline === "string" && gift.subheadline.trim());

    return (
        <div className="min-h-screen bg-stone-950 flex flex-col">
            {/* Hero Section – nur wenn Headline oder Subheadline Inhalt haben (nach Trim) */}
            {hasHero && (
                <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-6 max-w-4xl"
                    >
                        <div className="inline-flex justify-center mb-4">
                            <div className="w-px h-16 bg-gradient-to-b from-transparent via-rose-500 to-transparent opacity-50"></div>
                        </div>
                        {typeof gift.headline === "string" && gift.headline.trim() && (
                            <h2 className="text-5xl md:text-7xl font-serif italic text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-stone-500 tracking-tight leading-tight">
                                <ReactMarkdown className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight">
                                    {gift.headline.trim()}
                                </ReactMarkdown>
                            </h2>
                        )}
                        {typeof gift.subheadline === "string" &&
                            gift.subheadline.trim() && (
                                <p className="text-lg text-stone-400 font-light tracking-wide mt-8">
                                    {gift.subheadline.trim()}
                                </p>
                            )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute bottom-12 left-0 right-0 flex justify-center"
                    >
                        <button
                            type="button"
                            onClick={scrollToContent}
                            className="flex flex-col items-center text-stone-500 text-xs tracking-[0.2em] uppercase animate-bounce hover:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-stone-950 rounded-lg py-2 px-3 transition-colors"
                            aria-label="Zum Inhalt scrollen"
                        >
                            <span className="mb-2">Nachricht öffnen</span>
                            <div className="w-px h-8 bg-gradient-to-b from-stone-500 to-transparent"></div>
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Messages Section – mit Hero: unterhalb; ohne Hero: zentriert, vollflächig */}
            <div
                ref={contentStartRef}
                className={`bg-stone-900/50 flex flex-col items-center p-6 md:p-12 space-y-24 ${hasHero
                        ? "min-h-screen py-32"
                        : "min-h-screen justify-center py-12 md:py-16 relative"
                    }`}
            >
                {!hasHero && (
                    <div
                        className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-transparent via-rose-500/40 to-transparent opacity-60 pointer-events-none"
                        aria-hidden="true"
                    />
                )}

                {/* Album: 1 Bild = groß mittig, mehrere = horizontal scrollbar (Mobile) */}
                {albumImages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="w-full max-w-4xl"
                    >
                        <div className="bg-stone-900/80 backdrop-blur-sm rounded-[2rem] p-4 md:p-10 border border-stone-800 shadow-2xl">
                            {albumImages.length === 1 ? (
                                /* Ein Bild: groß, mittig, schön auf Mobile */
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setLightboxIndex(0)}
                                        className="block w-full max-w-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-stone-900 rounded-2xl overflow-hidden"
                                    >
                                        <img
                                            src={albumImages[0]}
                                            alt=""
                                            loading="eager"
                                            className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
                                        />
                                    </button>
                                </div>
                            ) : (
                                /* Mehrere Bilder: horizontal scroll (Mobile: wischen), Desktop: Grid */
                                <div className="flex flex-nowrap gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1 md:flex-none md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0">
                                    {albumImages.map((url, index) => (
                                        <button
                                            key={url}
                                            type="button"
                                            onClick={() => setLightboxIndex(index)}
                                            className="flex-shrink-0 w-[82vw] max-w-[320px] aspect-square snap-center rounded-xl overflow-hidden border border-stone-700/80 hover:border-rose-500/40 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50 md:w-full md:max-w-none"
                                        >
                                            <img
                                                src={url}
                                                alt=""
                                                loading={index < 3 ? "eager" : "lazy"}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Lightbox */}
                {lightboxIndex !== null && albumImages[lightboxIndex] && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                        onClick={() => setLightboxIndex(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Bild vergrößert"
                    >
                        <button
                            type="button"
                            onClick={() => setLightboxIndex(null)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center hover:bg-stone-700 transition-colors"
                            aria-label="Schließen"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <img
                            src={albumImages[lightboxIndex]}
                            alt=""
                            className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

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
                                {/* Author only when present */}
                                {msg.author && msg.author.trim() && (
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="h-10 w-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-serif italic text-lg shadow-inner">
                                            {msg.author.trim().charAt(0)}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500/80">
                                            {msg.author.trim()}
                                        </span>
                                    </div>
                                )}

                                {/* Content – nur Inhalt, keine generischen Labels */}
                                {msg.type === "text" ? (
                                    <div className="relative">
                                        <span className="absolute -top-4 -left-2 text-6xl text-stone-800 font-serif opacity-50 user-select-none">
                                            "
                                        </span>
                                        <p
                                            className={`${getFontSizeClass()} text-stone-200 font-light leading-loose whitespace-pre-wrap pl-4 border-l-2 border-stone-800`}
                                        >
                                            {msg.content}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl overflow-hidden shadow-2xl bg-black border border-stone-800 ring-1 ring-white/5">
                                        {msg.content.includes("youtube") ||
                                            msg.content.includes("youtu.be") ? (
                                            <div className="aspect-w-16 aspect-h-9">
                                                <iframe
                                                    src={msg.content
                                                        .replace("watch?v=", "embed/")
                                                        .replace("youtu.be/", "youtube.com/embed/")}
                                                    title="Video"
                                                    className="w-full h-full min-h-[250px]"
                                                    allowFullScreen
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                ></iframe>
                                            </div>
                                        ) : (
                                            <a
                                                href={msg.content}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col items-center justify-center p-16 text-stone-400 hover:text-white transition-colors group/video"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mb-4 group-hover/video:scale-110 group-hover/video:bg-rose-600 transition-all duration-300">
                                                    <Play className="h-6 w-6 ml-1 text-inherit" />
                                                </div>
                                                <span className="uppercase tracking-widest text-xs font-bold">
                                                    Video öffnen
                                                </span>
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
                    <a
                        href="https://www.kamlimos.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs uppercase tracking-[0.2em] font-light hover:text-white transition-colors"
                    >
                        www.kamlimos.com
                    </a>
                </div>
            </div>
        </div>
    );
}
