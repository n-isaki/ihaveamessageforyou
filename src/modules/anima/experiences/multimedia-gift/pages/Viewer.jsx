import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getGiftById, markGiftAsViewed } from "@/services/gifts";
import { verifyGiftPin } from "@/services/pinSecurity";
import {
  Lock,
  Play,
  Loader,
  Heart,
  Sparkles,
  Type,
  X,
  ChevronDown,
} from "lucide-react";
// eslint-disable-next-line no-unused-vars -- motion is used in JSX as <motion.div>
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import ReactMarkdown from "react-markdown";
import {
  checkRateLimit,
  resetRateLimit,
  getRemainingAttempts,
} from "@/utils/security";

export default function GiftReveal({ initialData }) {
  const { id } = useParams();
  const [gift, setGift] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // 0=Normal, 1=Large, 2=Extra Large
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const isPreview = !!initialData;
  const messagesEndRef = useRef(null);
  const contentStartRef = useRef(null);
  const [showMoreHint, setShowMoreHint] = useState(true);
  const albumImages = gift?.albumImages || [];

  const scrollToContent = () => {
    contentStartRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Mehr Inhalt unten? (Album + Nachrichten, oder mehrere Nachrichten, oder mehrere Album-Bilder)
  const hasMoreBelow =
    (albumImages.length > 0 && (gift?.messages?.length ?? 0) > 0) ||
    (gift?.messages?.length ?? 0) > 1 ||
    albumImages.length > 1;

  // "Mehr unten"-Hinweis ausblenden, wenn Nutzer bis zum Ende gescrollt hat
  useEffect(() => {
    if (!hasMoreBelow || !messagesEndRef.current) return;
    const el = messagesEndRef.current;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setShowMoreHint(false);
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMoreBelow]);

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
    if (gift && gift.productType === "bracelet") {
      setUnlocked(true);
      if (!gift.viewed && !isPreview) {
        markGiftAsViewed(id).catch((err) =>
          console.error("Error marking as viewed", err)
        );
      }
    }
  }, [gift, id, isPreview]);

  // Redirect to Setup if empty and unlocked (Scan-to-Setup)
  useEffect(() => {
    if (
      gift &&
      !gift.locked &&
      (!gift.messages || gift.messages.length === 0) &&
      gift.productType !== "bracelet" &&
      !isPreview
    ) {
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

    if (type === "hearts") {
      (function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#e11d48", "#be123c"], // Rose colors
          shapes: ["heart"],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#e11d48", "#be123c"],
          shapes: ["heart"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } else if (type === "stars") {
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
          shapes: ["star"],
          colors: ["#FFD700", "#FFA500"],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          shapes: ["star"],
          colors: ["#FFD700", "#FFA500"],
        });
      }, 250);
    } else if (type === "confetti") {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#e11d48", "#10b981", "#3b82f6", "#f59e0b"],
      });
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();

    if (!gift || !pin) {
      setError("Bitte gib einen PIN Code ein.");
      return;
    }

    if (!id) {
      setError("Geschenk-ID fehlt.");
      return;
    }

    // Rate Limiting: Check if too many attempts
    if (checkRateLimit(`pin_${id}`)) {
      const remaining = getRemainingAttempts(`pin_${id}`);
      setError(
        `Zu viele Versuche. Bitte warte eine Stunde. (${remaining} Versuche übrig)`
      );
      return;
    }

    setIsVerifyingPin(true);
    setError("");

    try {
      // Verify PIN server-side (supports both hashed and plain text for backward compatibility)
      console.log("Verifying PIN for gift:", {
        id,
        pinLength: pin.length,
        hasGift: !!gift,
      });
      const isValid = await verifyGiftPin(id, pin.trim());

      if (isValid) {
        // Success: Reset rate limit
        resetRateLimit(`pin_${id}`);
        setUnlocked(true);

        // Mark as viewed when unlocked with PIN
        if (!gift.viewed && !isPreview) {
          markGiftAsViewed(id).catch((err) =>
            console.error("Error marking as viewed", err)
          );
        }

        if (gift.openingAnimation && gift.openingAnimation !== "none") {
          setTimeout(() => triggerAnimation(gift.openingAnimation), 500);
        }
      } else {
        const remaining = getRemainingAttempts(`pin_${id}`);
        setError(`Falscher PIN Code. (${remaining} Versuche übrig)`);
      }
    } catch (error) {
      console.error("Error verifying PIN:", error);
      // Fallback to client-side comparison for backward compatibility
      if (gift && pin === gift.accessCode) {
        resetRateLimit(`pin_${id}`);
        setUnlocked(true);
        if (!gift.viewed && !isPreview) {
          markGiftAsViewed(id).catch((err) =>
            console.error("Error marking as viewed", err)
          );
        }
        if (gift.openingAnimation && gift.openingAnimation !== "none") {
          setTimeout(() => triggerAnimation(gift.openingAnimation), 500);
        }
      } else {
        const remaining = getRemainingAttempts(`pin_${id}`);
        setError(`Falscher PIN Code. (${remaining} Versuche übrig)`);
      }
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const toggleFontSize = () => {
    setFontSizeLevel((prev) => (prev + 1) % 3);
  };

  const getFontSizeClass = () => {
    switch (fontSizeLevel) {
      case 1:
        return "text-lg md:text-xl leading-relaxed";
      case 2:
        return "text-xl md:text-2xl leading-loose";
      default:
        return "text-sm md:text-base leading-relaxed";
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

  const isBracelet =
    gift?.productType === "bracelet" ||
    (gift?.engravingText && gift.engravingText.length > 0);

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
            <h1 className="text-2xl font-serif italic text-stone-100 mb-2">
              Deine Nachricht
            </h1>
            <p className="text-stone-400 mb-8 text-sm font-light">
              Eine persönliche Botschaft wartet auf dich.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="text"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError("");
                }}
                disabled={isVerifyingPin}
                className="block w-full text-center text-3xl tracking-widest bg-stone-950/50 border border-stone-700 text-white rounded-xl py-4 focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 outline-none transition-all placeholder-stone-700 font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="CODE"
              />
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-rose-500 text-xs font-medium tracking-wide"
                >
                  {error}
                </motion.div>
              )}
              {isVerifyingPin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 py-2"
                >
                  <div className="relative">
                    <Loader className="h-6 w-6 animate-spin text-rose-500" />
                    <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-md animate-pulse"></div>
                  </div>
                  <p className="text-stone-400 text-sm font-light tracking-wide">
                    Nachricht wird geladen...
                  </p>
                </motion.div>
              )}
              <button
                type="submit"
                disabled={isVerifyingPin || !pin}
                className="w-full py-4 px-4 rounded-xl text-sm font-medium tracking-wide text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all shadow-lg shadow-rose-900/20 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-600 relative overflow-hidden"
              >
                {isVerifyingPin ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Wird geladen...</span>
                  </span>
                ) : (
                  "Nachricht öffnen"
                )}
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
              <Type
                className={`transition-all ${
                  fontSizeLevel === 0
                    ? "h-5 w-5"
                    : fontSizeLevel === 1
                    ? "h-6 w-6"
                    : "h-7 w-7"
                }`}
              />
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
                  <div
                    className={`prose prose-invert prose-stone max-w-none ${getFontSizeClass()}`}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ ...props }) => (
                          <p
                            className="mb-6 leading-loose text-stone-300 font-light"
                            {...props}
                          />
                        ),
                        strong: ({ ...props }) => (
                          <strong
                            className="font-semibold text-white"
                            {...props}
                          />
                        ),
                        h1: ({ ...props }) => (
                          <h1
                            className="text-3xl font-serif text-white mt-8 mb-4"
                            {...props}
                          />
                        ),
                        h2: ({ ...props }) => (
                          <h2
                            className="text-2xl font-serif text-stone-200 mt-8 mb-4 border-b border-stone-800 pb-2"
                            {...props}
                          />
                        ),
                        h3: ({ ...props }) => (
                          <h3
                            className="text-xl font-serif text-stone-200 mt-6 mb-3"
                            {...props}
                          />
                        ),
                        ul: ({ ...props }) => (
                          <ul
                            className="list-disc pl-6 mb-6 space-y-2 text-stone-300"
                            {...props}
                          />
                        ),
                        li: ({ ...props }) => (
                          <li className="pl-2" {...props} />
                        ),
                        blockquote: ({ ...props }) => (
                          <blockquote
                            className="border-l-4 border-indigo-500 pl-4 py-1 italic text-stone-400 my-6 bg-stone-950/30 p-4 rounded-r-lg"
                            {...props}
                          />
                        ),
                        a: ({ ...props }) => (
                          <a
                            className="text-indigo-400 hover:text-indigo-300 underline"
                            {...props}
                          />
                        ),
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
          ) : (
            /* MUG MODE (Cinematic Dark Theme) */
            <div className="min-h-screen bg-stone-950 flex flex-col">
              {/* Hero Section – nur wenn Headline oder Subheadline Inhalt haben (nach Trim) */}
              {((typeof gift.headline === "string" && gift.headline.trim()) ||
                (typeof gift.subheadline === "string" &&
                  gift.subheadline.trim())) && (
                <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6 max-w-4xl"
                  >
                    <div className="inline-flex justify-center mb-4">
                      <div className="w-px h-16 bg-gradient-to-b from-transparent via-rose-500 to-transparent opacity-50"></div>
                    </div>
                    {typeof gift.headline === "string" &&
                      gift.headline.trim() && (
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
              {(() => {
                const hasHero =
                  (typeof gift.headline === "string" && gift.headline.trim()) ||
                  (typeof gift.subheadline === "string" &&
                    gift.subheadline.trim());
                return (
                  <div
                    ref={contentStartRef}
                    className={`bg-stone-900/50 flex flex-col items-center p-6 md:p-12 space-y-24 ${
                      hasHero
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
                                        .replace(
                                          "youtu.be/",
                                          "youtube.com/embed/"
                                        )}
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
                    <div ref={messagesEndRef} />
                  </div>
                );
              })()}

              {/* Mobile: Hinweis "Mehr unten", wenn noch weiterer Inhalt existiert */}
              {hasMoreBelow && showMoreHint && (
                <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none">
                  <div className="h-24 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent" />
                </div>
              )}
              {hasMoreBelow && showMoreHint && (
                <button
                  type="button"
                  onClick={() =>
                    window.scrollBy({
                      top: window.innerHeight * 0.75,
                      behavior: "smooth",
                    })
                  }
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden flex flex-col items-center gap-1 py-2 px-4 rounded-full bg-stone-800/95 backdrop-blur border border-stone-700 text-stone-300 text-xs font-medium tracking-wide shadow-lg active:scale-95 transition-transform"
                  aria-label="Weiter nach unten scrollen"
                >
                  <ChevronDown className="h-5 w-5 animate-bounce" />
                  <span>Mehr unten</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
