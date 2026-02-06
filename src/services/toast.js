
let toastId = 0;
const toasts = [];
const listeners = [];

function notifyListeners() {
    listeners.forEach(listener => listener([...toasts]));
}

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

export const toast = {
    success: (message) => addToast({ type: 'success', message }),
    error: (message) => addToast({ type: 'error', message }),
    info: (message) => addToast({ type: 'info', message }),
    copy: (message) => addToast({ type: 'copy', message }),
    remove: (id) => removeToast(id)
};

export const subscribe = (listener) => {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
};

export const getToasts = () => [...toasts];
