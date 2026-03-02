import React from "react";
import { Coffee, Watch, Heart, Zap } from "lucide-react";

export default function ProductTypeSelection({ onSelect }) {
    const products = [
        {
            id: "tasse",
            title: "Tasse",
            description: "Eine personalisierte Tasse mit Multimedia-Inhalten.",
            icon: Coffee,
            color: "text-amber-600",
            bgHover: "hover:bg-amber-50",
            borderHover: "hover:border-amber-200",
            project: "kamlimos",
            productType: "mug",
        },
        {
            id: "armband",
            title: "Armband",
            description: "Ein verbundenes Armband mit versteckten Botschaften.",
            icon: Watch,
            color: "text-indigo-600",
            bgHover: "hover:bg-indigo-50",
            borderHover: "hover:border-indigo-200",
            project: "ritual",
            productType: "bracelet",
        },
        {
            id: "memoria",
            title: "Memoria",
            description: "Ein Gedenkprofil für einen geliebten Verstorbenen.",
            icon: Heart,
            color: "text-rose-600",
            bgHover: "hover:bg-rose-50",
            borderHover: "hover:border-rose-200",
            project: "memoria",
            productType: "memory-card",
        },
        {
            id: "noor",
            title: "Noor",
            description: "Ein spirituelles Geschenk mit Audio-Rezitationen.",
            icon: Zap,
            color: "text-emerald-600",
            bgHover: "hover:bg-emerald-50",
            borderHover: "hover:border-emerald-200",
            project: "noor",
            productType: "noor-audio",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="text-center mb-10">
                <h2 className="text-2xl justify-center font-bold text-stone-900 mb-2">
                    Was möchtest du erstellen?
                </h2>
                <p className="text-stone-500">
                    Wähle den Produkttyp für deinen neuen Auftrag.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                    <button
                        key={product.id}
                        type="button"
                        aria-label={`Auswählen: ${product.title}`}
                        onClick={() => onSelect(product.project, product.productType)}
                        className={`
              flex items-start text-left p-6 
              bg-white border rounded-2xl shadow-sm transition-all duration-200
              border-stone-200 ${product.bgHover} ${product.borderHover} group
            `}
                    >
                        <div
                            className={`
                p-3 rounded-xl bg-stone-50 group-hover:bg-white 
                transition-colors mr-4 ${product.color}
              `}
                        >
                            <product.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-stone-900 text-lg mb-1">
                                {product.title}
                            </h3>
                            <p className="text-sm text-stone-500">{product.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
