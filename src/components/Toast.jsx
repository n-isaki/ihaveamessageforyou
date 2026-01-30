import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Copy, AlertCircle } from 'lucide-react';

let toastId = 0;
const toasts = [];
const listeners = [];

export const toast = {
  success: (message) => addToast({ type: 'success', message }),
  error: (message) => addToast({ type: 'error', message }),
  info: (message) => addToast({ type: 'info', message }),
  copy: (message) => addToast({ type: 'copy', message }),
};

function addToast({ type, message }) {
  const id = toastId++;
  const newToast = { id, type, message };
  toasts.push(newToast);
  notifyListeners();
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    removeToast(id);
  }, 3000);
  
  return id;
}

function removeToast(id) {
  const index = toasts.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    notifyListeners();
  }
}

function notifyListeners() {
  listeners.forEach(listener => listener([...toasts]));
}

export function ToastContainer() {
  const [toastList, setToastList] = React.useState([]);

  useEffect(() => {
    listeners.push(setToastList);
    setToastList([...toasts]);
    
    return () => {
      const index = listeners.indexOf(setToastList);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence>
        {toastList.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mb-3"
          >
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm
              min-w-[280px] max-w-[400px]
              ${toast.type === 'success' ? 'bg-emerald-500 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
              ${toast.type === 'copy' ? 'bg-violet-500 text-white' : ''}
            `}>
              {toast.type === 'success' && <Check className="h-5 w-5 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
              {toast.type === 'copy' && <Copy className="h-5 w-5 shrink-0" />}
              {toast.type === 'info' && <AlertCircle className="h-5 w-5 shrink-0" />}
              
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              
              <button
                onClick={() => removeToast(toast.id)}
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
