
import React from 'react';
import { Heart } from 'lucide-react';

export const MemoriaExperience = {
    id: 'memoria',
    label: 'Memoria',
    icon: Heart,
    colors: { bg: 'bg-stone-100', text: 'text-stone-600' },
    isSetupRequired: false,

    getViewerUrl: (gift) => {
        const isDev = window.location.hostname.includes('localhost') ||
            window.location.hostname.includes('127.0.0.1') ||
            window.location.hostname.includes('staging');
        return isDev ? `/v/${gift.id}` : `https://memoria.kamlimos.com/v/${gift.id}`;
    },

    renderDetails: (gift) => (
        <>
            <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Verstorbener</span> {gift.deceasedName || '-'}</div>
            <div><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Lebensdaten</span> {gift.lifeDates || '-'}</div>
            <div className="col-span-2"><span className="text-xs text-stone-400 font-bold uppercase block mb-1">Geschichte</span> <p className="line-clamp-2">{gift.meaningText || '-'}</p></div>
        </>
    )
};
