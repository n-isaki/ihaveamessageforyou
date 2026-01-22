import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getGiftById } from '../services/gifts';
import { Loader, Printer } from 'lucide-react';

export default function PrintGift() {
    const { id } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGift = async () => {
            try {
                const data = await getGiftById(id);
                setGift(data);
            } catch (error) {
                console.error("Failed to fetch gift", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGift();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-rose-600" />
            </div>
        );
    }

    if (!gift) {
        return <div className="text-center p-8">Gift not found</div>;
    }

    // Determine Domain based on Project
    let baseUrl = 'https://scan.kamlimos.com'; // Default for Mugs

    if (gift.project === 'noor' || gift.project === 'dua') {
        baseUrl = 'https://noor.kamlimos.com';
    } else if (gift.project === 'memoria') {
        baseUrl = 'https://memoria.kamlimos.com';
    } else if (gift.project === 'ritual' || gift.productType === 'bracelet') {
        baseUrl = 'https://ritual.kamlimos.com';
    }

    const giftUrl = `${baseUrl}/v/${gift.id}`;

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="no-print fixed top-4 right-4">
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-stone-800 hover:bg-stone-900"
                >
                    <Printer className="h-5 w-5 mr-2" /> Print
                </button>
            </div>

            <div className="max-w-2xl mx-auto border-4 border-rose-100 rounded-3xl p-12 text-center space-y-8 print:border-4 print:p-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-serif text-rose-600">Ein Geschenk für dich</h1>
                    <p className="text-xl text-stone-600">Scan mich, um deine Nachricht zu sehen!</p>
                </div>

                <div className="flex justify-center py-8">
                    <div className="p-4 bg-white rounded-xl shadow-lg border border-stone-100 print:shadow-none print:border-none">
                        <QRCodeSVG value={giftUrl} size={256} level="H" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="inline-block bg-stone-100 px-6 py-3 rounded-lg print:bg-transparent print:border print:border-stone-200">
                        <p className="text-sm text-stone-500 uppercase tracking-wider font-semibold">Dein PIN Code</p>
                        <p className="text-3xl font-mono font-bold text-stone-900 tracking-widest mt-1">{gift.accessCode}</p>
                    </div>

                    <p className="text-stone-500 text-sm mt-8">
                        Oder besuche <span className="font-mono text-stone-900">{window.location.origin}</span> und gib den Code ein.
                    </p>
                </div>

                <div className="pt-12 border-t border-stone-100 mt-12">
                    <p className="text-rose-400 font-serif italic">Von {gift.customerName}</p>
                </div>
            </div>

            <style>{`
        @media print {
          .no-print { display: none; }
          body { background: white; }
        }
      `}</style>
        </div>
    );
}
