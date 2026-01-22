
import React from 'react';
import { Coffee } from 'lucide-react';

export const TasseExperience = {
    id: 'tasse',
    label: 'Multimedia Tasse',
    icon: Coffee,
    colors: { bg: 'bg-orange-100', text: 'text-orange-600' },
    isSetupRequired: true,

    getViewerUrl: (gift) => {
        const isDev = window.location.hostname.includes('localhost') ||
            window.location.hostname.includes('127.0.0.1') ||
            window.location.hostname.includes('staging');
        return isDev ? `/v/${gift.id}` : `https://scan.kamlimos.com/v/${gift.id}`;
    },

    renderDetails: (gift) => (
        <>
            <div>
                <span className="text-xs text-stone-400 font-bold uppercase block mb-1">Intro Titel</span>
                <span className="font-serif italic text-lg">{gift.headline || 'Standard'}</span>
            </div>
            <div>
                <span className="text-xs text-stone-400 font-bold uppercase block mb-1">Design</span>
                {gift.designImage ? <img src={gift.designImage} className="h-12 w-12 rounded border border-stone-200" /> : '-'}
            </div>
            <div>
                <span className="text-xs text-stone-400 font-bold uppercase block mb-1">Inhalte</span>
                {gift.messages?.length || 0} Beiträge
            </div>
        </>
    )
};
