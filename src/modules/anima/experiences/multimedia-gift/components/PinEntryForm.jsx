import React, { useState } from "react";
import { Loader } from "lucide-react";
// eslint-disable-next-line no-unused-vars -- motion is used in JSX as <motion.div>
import { motion } from "framer-motion";

export default function PinEntryForm({
  onUnlock,
  error: externalError,
  setError,
}) {
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isVerifying || !pin.trim()) return;

    setIsVerifying(true);
    try {
      await onUnlock(pin);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e) => {
    setPin(e.target.value);
    if (setError) setError("");
  };

  return (
    <>
      <h1 className="text-2xl font-serif italic text-stone-100 mb-2">
        Deine Nachricht
      </h1>
      <p className="text-stone-400 mb-2 text-sm font-light">
        Eine persönliche Botschaft wartet auf dich.
      </p>
      <p className="text-stone-500 mb-6 text-xs font-light">
        Wo findest du den Code? Auf der Geschenkkarte (z.B. neben dem QR-Code)
        oder in der Nachricht des Absenders.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={pin}
          onChange={handleInputChange}
          disabled={isVerifying}
          className="block w-full text-center text-3xl tracking-widest bg-stone-950/50 border border-stone-700 text-white rounded-xl py-4 focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 outline-none transition-all placeholder-stone-700 font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="CODE"
        />
        {externalError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-rose-500 text-xs font-medium tracking-wide"
          >
            {externalError}
          </motion.div>
        )}
        {isVerifying && (
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
          disabled={isVerifying || !pin}
          className="w-full py-4 px-4 rounded-xl text-sm font-medium tracking-wide text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all shadow-lg shadow-rose-900/20 mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-600 relative overflow-hidden"
        >
          {isVerifying ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Wird geladen...</span>
            </span>
          ) : (
            "Nachricht öffnen"
          )}
        </button>
      </form>
    </>
  );
}
