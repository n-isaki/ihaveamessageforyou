
import React from 'react';
import { Watch } from 'lucide-react';

export const BraceletExperience = {
    id: 'bracelet',
    label: 'Armband',
    icon: Watch,
    colors: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    isSetupRequired: false,

    getViewerUrl: (gift) => {
        const isDev = window.location.hostname.includes('localhost') ||
            window.location.hostname.includes('127.0.0.1') ||
            window.location.hostname.includes('staging');
        return isDev ? `/v/${gift.id}` : `https://ritual.kamlimos.com/v/${gift.id}`;
    },

    renderDetails: (gift) => (
        <div className="col-span-2">
            <span className="text-xs text-stone-400 font-bold uppercase block mb-1">Gravur</span>
            <code className="bg-stone-100 px-2 py-1 rounded">{gift.engravingText || '-'}</code>
        </div>
    )
};
