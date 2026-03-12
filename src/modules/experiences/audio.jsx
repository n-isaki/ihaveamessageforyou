import React from 'react';
import { Mic } from 'lucide-react';

export const AudioExperience = {
    id: 'audio',
    label: 'Audio',
    icon: Mic,
    colors: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    isSetupRequired: false,

    getViewerUrl: (gift) => {
        const isDev = window.location.hostname.includes('localhost') ||
            window.location.hostname.includes('127.0.0.1') ||
            window.location.hostname.includes('staging');

        // Da das Audio-Geschenk komplett generisch und "headless" ist, 
        // wird es meist unter scan.kamlimos.com bedient:
        return isDev ? `/view/${gift.id}` : `https://scan.kamlimos.com/view/${gift.id}`;
    },

    renderDetails: (gift) => (
        <>
            <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Titel</span> {gift.headline || '-'}</div>
            <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Nachricht</span> {gift.messages?.[0]?.content ? '✅ Vorhanden' : '-'}</div>
            <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Audio</span> {gift.audioUrl ? '✅ Vorhanden' : '❌ Fehlt'}</div>
        </>
    )
};
