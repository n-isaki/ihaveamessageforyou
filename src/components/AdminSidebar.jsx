import React, { useState } from 'react';
import { LayoutGrid, Kanban, Plus, ChevronDown, ChevronRight, Package, Watch, Heart, Zap, Coffee, ChevronsLeft, ChevronsRight, LogOut, X, Store } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function AdminSidebar({ activeView, onViewChange, onRefresh, isOpen, onClose }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();



    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container - Werkstatt Style */}
            <div className={`
                fixed inset-y-0 left-0 z-50 bg-[#2C2C2C] h-screen flex flex-col border-r border-[#3A3A3A] shrink-0 overflow-y-auto transition-all duration-300
                md:static md:translate-x-0 
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                ${collapsed ? 'md:w-20' : 'md:w-64'}
                w-72
            `}>
                {/* Logo - Werkstatt Style */}
                <div className={`p-6 pb-4 flex items-center border-b border-[#3A3A3A] ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    {!collapsed && (
                        <div>
                            <h1 className="font-sans text-lg font-medium text-white tracking-wide cursor-pointer" onClick={onRefresh}>
                                KAMLIMOS
                            </h1>
                            <p className="text-[#8A8A8A] text-[10px] mt-1 uppercase tracking-wider font-medium">Admin System</p>
                        </div>
                    )}
                    {collapsed && (
                        <h1 className="font-sans text-xl font-medium text-white tracking-wide cursor-pointer" onClick={() => setCollapsed(false)}>K</h1>
                    )}

                    {/* Desktop Collapse Toggle */}
                    <div className="hidden md:block">
                        {!collapsed && (
                            <button onClick={() => setCollapsed(true)} className="text-[#8A8A8A] hover:text-white transition-colors">
                                <ChevronsLeft className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Mobile Close Button */}
                    <button onClick={onClose} className="md:hidden text-[#8A8A8A] hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Desktop Expand Button (when collapsed) */}
                <div className="hidden md:block">
                    {collapsed && (
                        <button onClick={() => setCollapsed(false)} className="mx-auto mb-4 text-[#8A8A8A] hover:text-white block">
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Navigation - Werkstatt Style, systematisch organisiert */}
                <nav className="flex-1 px-4 space-y-1 mt-4">
                    {/* Gruppe 1: Hauptfunktionen */}
                    <div className="mb-6">
                        {!collapsed && (
                            <div className="px-4 mb-3">
                                <p className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Übersicht</p>
                            </div>
                        )}
                        <Link
                            to="/admin/dashboard?view=list"
                            onClick={() => { onViewChange?.('list'); onClose?.(); }}
                            className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${activeView === 'list' && location.pathname === '/admin/dashboard'
                                    ? 'bg-[#3A3A3A] text-white border-l-2 border-white'
                                    : 'text-[#B0B0B0] hover:text-white hover:bg-[#353535]'
                                } ${collapsed ? 'justify-center px-2' : ''}`}
                            title="Alle Aufträge"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            {!collapsed && <span>Alle Aufträge</span>}
                        </Link>
                        <Link
                            to="/admin/dashboard?view=kanban"
                            onClick={() => { onViewChange?.('kanban'); onClose?.(); }}
                            className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${activeView === 'kanban' && location.pathname === '/admin/dashboard'
                                    ? 'bg-[#3A3A3A] text-white border-l-2 border-white'
                                    : 'text-[#B0B0B0] hover:text-white hover:bg-[#353535]'
                                } ${collapsed ? 'justify-center px-2' : ''}`}
                            title="Kanban Board"
                        >
                            <Kanban className="h-4 w-4" />
                            {!collapsed && <span>Kanban Board</span>}
                        </Link>
                    </div>

                    {/* Trennlinie */}
                    {!collapsed && <div className="border-t border-[#3A3A3A] my-4"></div>}

                    {/* Gruppe 3: Tools */}
                    <div className="mb-6">
                        {!collapsed && (
                            <div className="px-4 mb-3">
                                <p className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Tools</p>
                            </div>
                        )}
                        <Link
                            to="/admin/dashboard"
                            onClick={onClose}
                            className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${location.pathname === '/admin/dashboard'
                                    ? 'bg-[#3A3A3A] text-white border-l-2 border-white'
                                    : 'text-[#B0B0B0] hover:text-white hover:bg-[#353535]'
                                } ${collapsed ? 'justify-center px-2' : ''}`}
                            title="Dashboard"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            {!collapsed && <span>Dashboard</span>}
                        </Link>
                        <Link
                            to="/admin/shopify"
                            onClick={onClose}
                            className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${location.pathname === '/admin/shopify'
                                    ? 'bg-[#3A3A3A] text-white border-l-2 border-white'
                                    : 'text-[#B0B0B0] hover:text-white hover:bg-[#353535]'
                                } ${collapsed ? 'justify-center px-2' : ''}`}
                            title="Shopify Theme Explorer"
                        >
                            <Store className="h-4 w-4" />
                            {!collapsed && <span>Shopify</span>}
                        </Link>
                    </div>

                    {/* Gruppe 4: Aktionen */}
                    <div>
                        {!collapsed && (
                            <div className="px-4 mb-3">
                                <p className="text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Aktionen</p>
                            </div>
                        )}

                        {/* Collapsible Create Menu */}
                        <div>
                            <button
                                onClick={() => {
                                    if (collapsed) {
                                        setCollapsed(false);
                                        setIsCreateOpen(true);
                                    } else {
                                        setIsCreateOpen(!isCreateOpen);
                                    }
                                }}
                                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#353535] transition-all font-medium text-sm ${collapsed ? 'justify-center px-2' : ''}`}
                                title="Neuer Auftrag"
                            >
                                <div className="flex items-center space-x-3">
                                    <Plus className="h-5 w-5" />
                                    {!collapsed && <span>Neuer Auftrag</span>}
                                </div>
                                {!collapsed && (isCreateOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                            </button>

                            {!collapsed && isCreateOpen && (
                                <div className="pl-4 mt-1 space-y-0.5">
                                    <Link to="/admin/create?project=tasse" onClick={onClose} className="flex items-center space-x-3 px-4 py-2 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#353535] text-xs font-medium block">
                                        <Coffee className="h-3 w-3" />
                                        <span>Tasse</span>
                                    </Link>
                                    <Link to="/admin/create?project=ritual" onClick={onClose} className="flex items-center space-x-3 px-4 py-2 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#353535] text-xs font-medium block">
                                        <Watch className="h-3 w-3" />
                                        <span>Armband</span>
                                    </Link>
                                    <Link to="/admin/create?project=memoria" onClick={onClose} className="flex items-center space-x-3 px-4 py-2 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#353535] text-xs font-medium block">
                                        <Heart className="h-3 w-3" />
                                        <span>Memoria</span>
                                    </Link>
                                    <Link to="/admin/create?project=noor" onClick={onClose} className="flex items-center space-x-3 px-4 py-2 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#353535] text-xs font-medium block">
                                        <Zap className="h-3 w-3" />
                                        <span>Noor</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Footer - Werkstatt Style */}
                <div className="p-4 border-t border-[#3A3A3A] mt-auto">
                    <button
                        onClick={async () => {
                            try {
                                const { signOut } = await import('firebase/auth');
                                const { auth } = await import('../firebase');
                                await signOut(auth);
                                window.location.reload();
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                        className={`flex items-center w-full px-4 py-2.5 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#353535] transition-all group ${collapsed ? 'justify-center px-2' : ''}`}
                        title="Abmelden"
                    >
                        <LogOut className="h-4 w-4" />
                        {!collapsed && <span className="ml-3 font-medium text-sm">Abmelden</span>}
                    </button>
                </div>
            </div>
        </>
    );
}
