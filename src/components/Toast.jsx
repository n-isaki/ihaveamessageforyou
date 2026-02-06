import React, { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Copy, AlertCircle } from "lucide-react";
import { subscribe, getToasts, toast } from "../services/toast";

export function ToastContainer() {
  const [toastList, setToastList] = useState(() => getToasts());

  useEffect(() => {
    const unsubscribe = subscribe(setToastList);
    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence>
        {toastList.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mb-3"
          >
            <div
              className={`
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm
              min-w-[280px] max-w-[400px]
              ${t.type === "success" ? "bg-emerald-500 text-white" : ""}
              ${t.type === "error" ? "bg-red-500 text-white" : ""}
              ${t.type === "info" ? "bg-blue-500 text-white" : ""}
              ${t.type === "copy" ? "bg-violet-500 text-white" : ""}
            `}
            >
              {t.type === "success" && <Check className="h-5 w-5 shrink-0" />}
              {t.type === "error" && (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              {t.type === "copy" && <Copy className="h-5 w-5 shrink-0" />}
              {t.type === "info" && (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}

              <p className="text-sm font-medium flex-1">{t.message}</p>

              <button
                onClick={() => toast.remove(t.id)}
                className="shrink-0 hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
