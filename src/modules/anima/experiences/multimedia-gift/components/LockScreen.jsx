import React from "react";
// eslint-disable-next-line no-unused-vars -- motion is used in JSX as <motion.div>
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import TimeCapsuleCountdown from "./TimeCapsuleCountdown";
import PinEntryForm from "./PinEntryForm";

export default function LockScreen({ gift, onUnlock, error, setError, isTimeLocked, unlockTime }) {
    if (!gift) return null;

    return (
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

                {/* TIME CAPSULE LOGIC */}
                {isTimeLocked ? (
                    <TimeCapsuleCountdown unlockTime={unlockTime} />
                ) : (
                    <PinEntryForm onUnlock={onUnlock} error={error} setError={setError} />
                )}
            </motion.div>
        </div>
    );
}
