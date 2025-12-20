import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGiftById, updateGift } from '@/services/gifts';
import { MessageSquare, Sparkles, Send, ArrowRight, Loader } from 'lucide-react';

export default function RitualChat() {
    const { id } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState('intro'); // intro, chat, selection, done
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Willkommen im Archiv der Bindungen. Ich bin der Archivar. Für wen ist dieses Band bestimmt?' }
    ]);
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        loadGift();
    }, [id]);

    const loadGift = async () => {
        try {
            const data = await getGiftById(id);
            setGift(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;

        // Add user message
        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');

        // Simulate AI Response (Dummy Logic)
        setTimeout(() => {
            if (newMessages.length < 4) {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Ich verstehe. Erzähl mir mehr über diesen Moment. Was verbindet euch?' }]);
            } else {
                setStep('selection');
                setSuggestions([
                    "Ich halte dich nicht fest, ich halte zu dir.",
                    "Verbunden durch Zeit, getrennt durch nichts.",
                    "Für immer mein Anker, egal wo du bist."
                ]);
            }
        }, 1000);
    };

    const handleSelect = async (text) => {
        try {
            await updateGift(id, {
                engravingText: text,
                status: 'ready_for_production'
            });
            setStep('done');
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;

    if (step === 'done') {
        return (
            <div className="min-h-screen bg-stone-900 flex items-center justify-center text-white p-6">
                <div className="text-center max-w-md">
                    <Sparkles className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-serif mb-4">Es ist vollbracht.</h1>
                    <p className="text-stone-400 mb-8">Deine Worte wurden im Archiv versiegelt. Das Armband wird nun graviert.</p>
                    <div className="bg-stone-800 p-6 rounded-lg border border-stone-700">
                        <p className="font-mono text-lg text-emerald-400">"{gift?.engravingText || '...'}"</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
            {/* Header */}
            <div className="bg-white border-b border-stone-200 p-4 sticky top-0 z-10">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <span className="font-serif font-bold text-stone-900">Der Archivar</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-md mx-auto w-full pb-32">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-stone-900 text-white rounded-br-none'
                                : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none shadow-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input / Selection Area */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4">
                <div className="max-w-md mx-auto">
                    {step === 'selection' ? (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Vorschläge des Archivs</p>
                            {suggestions.map((text, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(text)}
                                    className="w-full p-4 text-left border rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-sm font-medium text-stone-800 flex justify-between group"
                                >
                                    <span>"{text}"</span>
                                    <ArrowRight className="h-5 w-5 text-stone-300 group-hover:text-emerald-500" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Antworte dem Archivar..."
                                className="flex-1 border-stone-200 rounded-full px-4 py-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="p-3 bg-stone-900 text-white rounded-full disabled:opacity-50 hover:bg-stone-800 transition-colors"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
