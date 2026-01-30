import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ChevronRight, ChevronDown, ChevronUp, FileText, Folder, FolderOpen, 
    Code, Layout, Package, Globe, Settings, Image, 
    FileJson, FileCode, Info, ExternalLink, Search,
    Zap, Layers, Grid, Box, X, Store, Menu
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

// Theme-Struktur Definition
const themeStructure = {
    templates: {
        icon: FileJson,
        color: 'text-blue-500',
        description: 'Templates definieren die Struktur einer Seite (z.B. Produktseite, Collection-Seite)',
        files: [
            { name: 'collection.json', description: 'Template für Collection-Seiten (z.B. Tassen-Kollektion)', example: 'Wird verwendet wenn jemand /collections/tassen besucht' },
            { name: 'product.json', description: 'Standard Produktseiten-Template', example: 'Für normale Produkte ohne spezielle Features' },
            { name: 'product.anima-wizard.json', description: 'Produktseite mit Anima Wizard', example: 'Für Produkte mit Konfigurator (z.B. personalisierte Tassen)' },
            { name: 'index.json', description: 'Startseite Template', example: 'Die Homepage deines Shops' },
            { name: 'cart.json', description: 'Warenkorb-Seite', example: 'Zeigt alle Produkte im Warenkorb' },
            { name: 'page.json', description: 'Standard Seiten-Template', example: 'Für statische Seiten wie "Über uns"' },
            { name: 'page.contact.json', description: 'Kontakt-Seite', example: 'Spezielles Template für Kontaktformular' },
            { name: 'search.json', description: 'Suchergebnisse-Seite', example: 'Zeigt Ergebnisse der Shop-Suche' },
            { name: 'blog.json', description: 'Blog-Übersichtsseite', example: 'Liste aller Blog-Artikel' },
            { name: 'article.json', description: 'Einzelner Blog-Artikel', example: 'Ein spezifischer Blog-Post' },
            { name: 'list-collections.json', description: 'Alle Collections Übersicht', example: 'Zeigt alle Kollektionen auf einer Seite' },
            { name: '404.json', description: 'Fehlerseite (nicht gefunden)', example: 'Wird angezeigt wenn Seite nicht existiert' },
            { name: 'password.liquid', description: 'Password-geschützte Seite', example: 'Für Shops im Wartungsmodus' },
            { name: 'gift_card.liquid', description: 'Geschenkgutschein Template', example: 'Zeigt Geschenkgutschein-Details' },
        ]
    },
    sections: {
        icon: Layout,
        color: 'text-purple-500',
        description: 'Sections sind wiederverwendbare Komponenten, die in Templates verwendet werden',
        files: [
            { name: 'main-collection.liquid', description: 'Haupt-Section für Collection-Seiten', example: 'Zeigt Produktliste einer Collection', usedIn: ['collection.json'] },
            { name: 'hero.liquid', description: 'Hero-Banner Section', example: 'Großer Banner oben auf der Seite', usedIn: ['index.json', 'collection.json'] },
            { name: 'product-information.liquid', description: 'Produktinformationen Section', example: 'Titel, Preis, Beschreibung eines Produkts', usedIn: ['product.json'] },
            { name: 'anima-product-wizard.liquid', description: 'Anima Konfigurator Section', example: 'Der interaktive Produkt-Konfigurator', usedIn: ['product.anima-wizard.json'] },
            { name: 'header.liquid', description: 'Shop Header', example: 'Navigation, Logo, Warenkorb-Icon', usedIn: ['theme.liquid'] },
            { name: 'footer.liquid', description: 'Shop Footer', example: 'Links, Copyright, Newsletter', usedIn: ['theme.liquid'] },
            { name: 'quick-add-modal.liquid', description: 'Schnell-Hinzufügen Modal', example: 'Modal zum schnellen Hinzufügen zum Warenkorb', usedIn: ['collection.json'] },
            { name: 'slideshow.liquid', description: 'Bildershow Section', example: 'Rotierende Bilder/Banner', usedIn: ['index.json'] },
            { name: 'search-results.liquid', description: 'Suchergebnisse Section', example: 'Zeigt gefundene Produkte', usedIn: ['search.json'] },
        ]
    },
    snippets: {
        icon: Code,
        color: 'text-green-500',
        description: 'Snippets sind kleine wiederverwendbare Code-Stücke, die in Sections verwendet werden',
        files: [
            { name: 'product-card.liquid', description: 'Produktkarte Komponente', example: 'Zeigt ein einzelnes Produkt in einer Liste', usedIn: ['main-collection.liquid'] },
            { name: 'quick-add-modal.liquid', description: 'Modal für schnelles Hinzufügen', example: 'Modal-Dialog für Quick-Add', usedIn: ['product-card.liquid'] },
            { name: 'button.liquid', description: 'Button Komponente', example: 'Wiederverwendbarer Button', usedIn: ['viele Sections'] },
            { name: 'price.liquid', description: 'Preis-Anzeige', example: 'Formatiert Preise korrekt', usedIn: ['product-card.liquid', 'product-information.liquid'] },
            { name: 'collection-card.liquid', description: 'Collection-Karte', example: 'Zeigt eine Collection-Vorschau', usedIn: ['list-collections.json'] },
            { name: 'scripts.liquid', description: 'JavaScript Einbindung', example: 'Lädt alle benötigten JS-Dateien', usedIn: ['theme.liquid'] },
            { name: 'anima-conditional-fields.js', description: 'Conditional Fields Logic', example: 'Zeigt/versteckt Felder basierend auf Auswahl', usedIn: ['scripts.liquid'] },
        ]
    },
    blocks: {
        icon: Box,
        color: 'text-orange-500',
        description: 'Blocks sind die kleinsten Einheiten - sie können innerhalb von Sections platziert werden',
        files: [
            { name: 'text.liquid', description: 'Text Block', example: 'Ein Text-Element in einer Section', usedIn: ['hero.liquid', 'section.liquid'] },
            { name: 'button.liquid', description: 'Button Block', example: 'Ein Button-Element', usedIn: ['hero.liquid'] },
            { name: 'product-title.liquid', description: 'Produkttitel Block', example: 'Zeigt den Produktnamen', usedIn: ['product-information.liquid'] },
            { name: 'price.liquid', description: 'Preis Block', example: 'Zeigt den Produktpreis', usedIn: ['product-information.liquid'] },
            { name: 'collection-title.liquid', description: 'Collection-Titel Block', example: 'Zeigt den Collection-Namen', usedIn: ['collection-card.liquid'] },
            { name: 'product-custom-property.liquid', description: 'Custom Property Feld', example: 'Eingabefeld für Personalisierung', usedIn: ['product-information.liquid'] },
        ]
    },
    assets: {
        icon: Image,
        color: 'text-pink-500',
        description: 'Statische Dateien: JavaScript, CSS, Bilder, SVG',
        files: [
            { name: 'anima-conditional-fields.js', description: 'Conditional Fields JavaScript', example: 'Logik für bedingte Felder im Modal' },
            { name: '*.css', description: 'Stylesheet Dateien', example: 'Alle CSS-Styles für das Theme' },
            { name: '*.svg', description: 'SVG Icons und Grafiken', example: 'Vektorgrafiken für Icons' },
            { name: '*.js', description: 'JavaScript Dateien', example: 'Interaktive Funktionalität' },
        ]
    },
    locales: {
        icon: Globe,
        color: 'text-cyan-500',
        description: 'Übersetzungen für verschiedene Sprachen',
        files: [
            { name: 'de.json', description: 'Deutsche Übersetzungen', example: 'Alle deutschen Texte' },
            { name: 'en.default.json', description: 'Englische Standard-Übersetzungen', example: 'Fallback-Sprache' },
            { name: '*.schema.json', description: 'Schema-Übersetzungen', example: 'Übersetzungen für Theme-Editor Labels' },
        ]
    },
    config: {
        icon: Settings,
        color: 'text-yellow-500',
        description: 'Theme-Konfiguration und Einstellungen',
        files: [
            { name: 'settings_schema.json', description: 'Theme-Editor Schema', example: 'Definiert welche Einstellungen im Theme-Editor verfügbar sind' },
            { name: 'settings_data.json', description: 'Gespeicherte Theme-Einstellungen', example: 'Aktuelle Werte aller Theme-Einstellungen' },
        ]
    },
    layout: {
        icon: Layers,
        color: 'text-indigo-500',
        description: 'Layout-Dateien definieren die Grundstruktur aller Seiten',
        files: [
            { name: 'theme.liquid', description: 'Haupt-Layout für alle Seiten', example: 'Enthält Header, Footer, wird von allen Templates verwendet' },
            { name: 'password.liquid', description: 'Layout für Password-Seiten', example: 'Spezielles Layout für Wartungsmodus' },
        ]
    }
};

function FileTreeItem({ item, level = 0, onSelect }) {
    const [isOpen, setIsOpen] = useState(level < 2);
    const isFolder = item.files || item.children;
    
    return (
        <div>
            <div 
                className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors ${level > 0 ? 'ml-4' : ''}`}
                onClick={() => {
                    if (isFolder) setIsOpen(!isOpen);
                    if (onSelect) onSelect(item);
                }}
            >
                {isFolder ? (
                    isOpen ? <ChevronDown className="h-4 w-4 text-stone-400" /> : <ChevronRight className="h-4 w-4 text-stone-400" />
                ) : (
                    <div className="w-4" />
                )}
                {isFolder ? (
                    isOpen ? <FolderOpen className={`h-4 w-4 ${item.color || 'text-stone-500'}`} /> : <Folder className={`h-4 w-4 ${item.color || 'text-stone-500'}`} />
                ) : (
                    <FileText className="h-4 w-4 text-stone-400" />
                )}
                <span className="text-sm font-medium text-stone-700">{item.name}</span>
                {item.description && (
                    <span className="text-xs text-stone-500 ml-2 truncate">{item.description}</span>
                )}
            </div>
            {isOpen && isFolder && (
                <div className="ml-4">
                    {item.files?.map((file, idx) => (
                        <FileTreeItem key={idx} item={file} level={level + 1} onSelect={onSelect} />
                    ))}
                    {item.children?.map((child, idx) => (
                        <FileTreeItem key={idx} item={child} level={level + 1} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CategoryCard({ category, categoryKey, isExpanded, onToggle, onFileSelect }) {
    const Icon = category.icon;
    
    return (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${category.color}`} />
                    <div className="text-left">
                        <h3 className="font-semibold text-stone-900 capitalize">{categoryKey}</h3>
                        <p className="text-xs text-stone-500 mt-0.5">{category.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded">
                        {category.files?.length || 0} Dateien
                    </span>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-stone-400" /> : <ChevronDown className="h-5 w-5 text-stone-400" />}
                </div>
            </button>
            
            {isExpanded && (
                <div className="border-t border-stone-200 p-4 space-y-2 max-h-96 overflow-y-auto">
                    {category.files?.map((file, idx) => (
                        <div
                            key={idx}
                            onClick={() => onFileSelect(file)}
                            className="p-3 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-stone-50 cursor-pointer transition-all group"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileCode className="h-4 w-4 text-stone-400 group-hover:text-stone-600" />
                                        <span className="font-medium text-stone-900 text-sm">{file.name}</span>
                                    </div>
                                    <p className="text-xs text-stone-600 mb-2">{file.description}</p>
                                    {file.example && (
                                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                            <p className="text-xs text-blue-900">
                                                <strong className="font-semibold">Beispiel:</strong> {file.example}
                                            </p>
                                        </div>
                                    )}
                                    {file.usedIn && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {file.usedIn.map((template, tIdx) => (
                                                <span key={tIdx} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                                    {template}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function FileDetail({ file, onClose }) {
    if (!file) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-stone-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileCode className="h-6 w-6 text-stone-600" />
                        <h2 className="text-xl font-bold text-stone-900">{file.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-stone-600" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <h3 className="font-semibold text-stone-900 mb-2">Beschreibung</h3>
                        <p className="text-stone-600">{file.description}</p>
                    </div>
                    {file.example && (
                        <div>
                            <h3 className="font-semibold text-stone-900 mb-2">Beispiel-Verwendung</h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-blue-900">{file.example}</p>
                            </div>
                        </div>
                    )}
                    {file.usedIn && (
                        <div>
                            <h3 className="font-semibold text-stone-900 mb-2">Verwendet in</h3>
                            <div className="flex flex-wrap gap-2">
                                {file.usedIn.map((template, idx) => (
                                    <span key={idx} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium">
                                        {template}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ShopifyThemeExplorer() {
    const [expandedCategories, setExpandedCategories] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    const toggleCategory = (key) => {
        setExpandedCategories(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };
    
    const filteredStructure = searchQuery ? 
        Object.fromEntries(
            Object.entries(themeStructure).map(([key, category]) => [
                key,
                {
                    ...category,
                    files: category.files?.filter(file => 
                        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        file.description.toLowerCase().includes(searchQuery.toLowerCase())
                    ) || []
                }
            ]).filter(([key, category]) => category.files?.length > 0)
        ) : themeStructure;
    
    return (
        <div className="flex bg-stone-50 min-h-screen font-sans">
            <AdminSidebar 
                activeView="shopify"
                onViewChange={() => {}}
                onRefresh={() => window.location.reload()}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            
            <main className="flex-1 overflow-y-auto h-screen p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-stone-600 hover:bg-stone-200 rounded-lg">
                                <Menu className="h-6 w-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <Store className="h-8 w-8 text-rose-600" />
                                <div>
                                    <h1 className="text-3xl font-bold text-stone-900">Shopify Theme Explorer</h1>
                                    <p className="text-stone-500 mt-1">
                                        Entdecke und verstehe die Struktur deines Shopify Themes
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
                            <input
                                type="text"
                                placeholder="Suche nach Dateien oder Beschreibungen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    
                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-1">Wie funktioniert ein Shopify Theme?</h3>
                                <p className="text-sm text-blue-800">
                                    Ein Shopify Theme besteht aus verschiedenen Komponenten, die zusammenarbeiten:
                                    <strong>Templates</strong> definieren Seiten-Strukturen, <strong>Sections</strong> sind wiederverwendbare Komponenten,
                                    <strong>Snippets</strong> sind kleine Code-Stücke, und <strong>Blocks</strong> sind die kleinsten Einheiten.
                                    Klicke auf die Kategorien unten, um mehr zu erfahren!
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Categories */}
                    <div className="space-y-4">
                        {Object.entries(filteredStructure).map(([key, category]) => (
                            <CategoryCard
                                key={key}
                                category={category}
                                categoryKey={key}
                                isExpanded={expandedCategories[key]}
                                onToggle={() => toggleCategory(key)}
                                onFileSelect={setSelectedFile}
                            />
                        ))}
                    </div>
                    
                    {/* Connection Diagram */}
                    <div className="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                            <Zap className="h-6 w-6 text-purple-600" />
                            Wie alles zusammenhängt
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                <h3 className="font-semibold text-stone-900 mb-2">1. Template</h3>
                                <p className="text-sm text-stone-600">
                                    Ein Template (z.B. <code className="bg-stone-100 px-1 rounded">collection.json</code>) definiert welche Sections verwendet werden
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                <h3 className="font-semibold text-stone-900 mb-2">2. Section</h3>
                                <p className="text-sm text-stone-600">
                                    Eine Section (z.B. <code className="bg-stone-100 px-1 rounded">main-collection.liquid</code>) verwendet Snippets und Blocks
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                <h3 className="font-semibold text-stone-900 mb-2">3. Snippet/Block</h3>
                                <p className="text-sm text-stone-600">
                                    Snippets und Blocks enthalten den eigentlichen Code und HTML-Struktur
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-sm text-stone-600">
                                <strong>Beispiel:</strong> Wenn jemand <code className="bg-white px-2 py-1 rounded border">/collections/tassen</code> besucht,
                                wird <code className="bg-white px-2 py-1 rounded border">collection.json</code> geladen,
                                welches <code className="bg-white px-2 py-1 rounded border">main-collection.liquid</code> verwendet,
                                welches wiederum <code className="bg-white px-2 py-1 rounded border">product-card.liquid</code> für jedes Produkt rendert.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            
            {selectedFile && (
                <FileDetail file={selectedFile} onClose={() => setSelectedFile(null)} />
            )}
        </div>
    );
}
