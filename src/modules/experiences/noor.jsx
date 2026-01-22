
import React from 'react';
import { Zap } from 'lucide-react';

export const NoorExperience = {
    id: 'noor',
    label: 'Noor',
    icon: Zap,
    colors: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    isSetupRequired: false,

    getViewerUrl: (gift) => {
        const isDev = window.location.hostname.includes('localhost') ||
            window.location.hostname.includes('127.0.0.1') ||
            window.location.hostname.includes('staging');
        return isDev ? `/v/${gift.id}` : `https://noor.kamlimos.com/v/${gift.id}`;
    },

    renderDetails: (gift) => (
        <>
            <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Titel</span> {gift.title || '-'}</div>
            <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Audio</span> {gift.audioUrl ? '✅ Vorhanden' : '❌ Fehlt'}</div>
        </>
    )
};
