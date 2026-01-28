import React from 'react';
import ReactDOM from 'react-dom/client';
import Configurator from './Configurator';
import '../index.css'; // Include styles (Note: might affect page global styles if not careful)

const CONTAINER_ID = 'anima-configurator';

function initWidget() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) {
        console.warn(`Anima Widget: Container #${CONTAINER_ID} not found.`);
        return;
    }



    if (container.dataset.rendered === "true") return; // Prevent double render

    const productId = container.dataset.productId;
    const mode = container.dataset.mode || 'multimedia';

    const root = ReactDOM.createRoot(container);

    root.render(
        <React.StrictMode>
            <Configurator
                productId={productId}
                mode={mode}
                onSave={(id) => {
                    console.log("Gift Saved:", id);
                    // Find hidden input and set value logic is inside component, 
                    // but we can do extra stuff here if needed.
                }}
            />
        </React.StrictMode>
    );

    container.dataset.rendered = "true";
}

// Auto-init if DOM ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
} else {
    initWidget();
}

// Expose on window for manual init if needed
window.Anima = { init: initWidget };
