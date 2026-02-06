import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";

export default function TimeCapsuleCountdown({ unlockTime }) {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const update = () => setTimeLeft(unlockTime - Date.now());
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [unlockTime]);

    if (timeLeft <= 0) return null; // Logic in parent handles the switch to unlock mode

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const formatNumber = (num) => num.toString().padStart(2, "0");

    return (
        <div className="animate-in fade-in duration-700">
            <div className="mb-8 relative inline-flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                <div className="relative px-5 py-2 bg-stone-900 border border-indigo-500/30 rounded-full flex items-center gap-2 shadow-lg shadow-indigo-500/10">
                    <Lock className="w-3 h-3 text-indigo-400" />
                    <span className="text-indigo-300 text-[10px] font-bold tracking-[0.2em] uppercase">
                        Zeitkapsel
                    </span>
                </div>
            </div>

            <h1 className="text-3xl font-serif italic text-white mb-2 leading-tight">
                Noch versiegelt
            </h1>

            <p className="text-stone-400 mb-8 text-sm font-light leading-relaxed">
                Dieses Geschenk öffnet sich am <br />
                <span className="text-white font-medium border-b border-stone-800 pb-0.5">
                    {new Date(unlockTime).toLocaleDateString("de-DE", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </span>
                <span className="mx-1">um</span>
                <span className="text-white font-medium">
                    {new Date(unlockTime).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}{" "}
                    Uhr
                </span>
            </p>

            {/* Modern Grid Countdown */}
            <div className="grid grid-cols-4 gap-2 mb-8 max-w-[320px] mx-auto">
                <div className="flex flex-col items-center bg-stone-900/50 border border-stone-800 rounded-xl p-3 backdrop-blur-sm">
                    <span className="text-2xl font-mono font-bold text-white leading-none mb-1">
                        {days}
                    </span>
                    <span className="text-[9px] text-stone-500 uppercase tracking-wider">
                        {days === 1 ? "Tag" : "Tage"}
                    </span>
                </div>
                <div className="flex flex-col items-center bg-stone-900/50 border border-stone-800 rounded-xl p-3 backdrop-blur-sm">
                    <span className="text-2xl font-mono font-bold text-white leading-none mb-1">
                        {formatNumber(hours)}
                    </span>
                    <span className="text-[9px] text-stone-500 uppercase tracking-wider">
                        Std
                    </span>
                </div>
                <div className="flex flex-col items-center bg-stone-900/50 border border-stone-800 rounded-xl p-3 backdrop-blur-sm">
                    <span className="text-2xl font-mono font-bold text-white leading-none mb-1">
                        {formatNumber(minutes)}
                    </span>
                    <span className="text-[9px] text-stone-500 uppercase tracking-wider">
                        Min
                    </span>
                </div>
                <div className="flex flex-col items-center bg-stone-900/50 border border-stone-800 rounded-xl p-3 backdrop-blur-sm">
                    <span className="text-2xl font-mono font-bold text-white leading-none mb-1 text-rose-500">
                        {formatNumber(seconds)}
                    </span>
                    <span className="text-[9px] text-stone-500 uppercase tracking-wider">
                        Sek
                    </span>
                </div>
            </div>

            <div className="w-full text-center">
                <p className="text-xs text-stone-600 animate-pulse">
                    Bitte komm zum angegebenen Zeitpunkt zurück.
                </p>
            </div>
        </div>
    );
}
