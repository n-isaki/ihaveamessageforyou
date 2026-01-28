# Architecture & Contribution Guide

## 👋 Welcome!
This project handles the Admin Dashboard for "Connected" products (Multimedia Mugs, Jewelry, Digital Memorials).
We recently refactored the codebase (Jan 2026) to be **modular** and **extensible**.

## 🏗 Core Concepts

### 1. The Experience Registry
Instead of hardcoding logic like `if (project === 'noor')` in the UI, we use an **Experience Registry**.
- **Definitions**: Located in `src/modules/experiences/` (e.g., `noor.jsx`, `tasse.jsx`).
- **Registry**: `src/modules/registry.js` resolves a gift object to its experience definition.

### 2. Component Architecture
- **`AdminDashboard.jsx`**: "Smart" Container. Handles Data Fetching, State (Filter/Sort), and Routing.
- **`AdminGiftTable.jsx`**: "Dumb" UI. Receives data and uses the **Registry** to decide how to render rows (Colors, Icons, Details).
- **`AdminStats.jsx`**: Visualizes key metrics.
- **`EtsyModal.jsx`**: Encapsulates external order simulation logic.

## 🚀 How to Add a New Product
To add a new product (e.g., "Digital Canvas"):

1.  **Create a Module**:
    Create `src/modules/experiences/canvas.jsx`.
    ```javascript
    import { Image } from 'lucide-react';
    export const CanvasExperience = {
        id: 'canvas',
        label: 'Digital Canvas',
        icon: Image,
        colors: { bg: 'bg-blue-100', text: 'text-blue-600' },
        isSetupRequired: true,
        getViewerUrl: (gift) => `https://canvas.kamlimos.com/v/${gift.id}`,
        renderDetails: (gift) => (
            <div>Title: {gift.canvasTitle}</div>
        )
    };
    ```

2.  **Register it**:
    Import it in `src/modules/registry.js` and add it to the `experiences` map.

3.  **Done!**
    The Dashboard will automatically render the new product with the correct colors, icons, and details link.

## 🛠 Tech Stack
- **React + Vite**
- **TailwindCSS** (Styling)
- **Firebase** (Backend/DB)
- **Framer Motion** (Animations)
