import React, { useState } from 'react';
import { LayoutGrid, Kanban, Plus, ChevronDown, ChevronRight, Package, Watch, Heart, Zap, Coffee, ChevronsLeft, ChevronsRight, LogOut, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminSidebar({ activeView, onViewChange, onRefresh, isOpen, onClose }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // Adjusted class logic: center content if collapsed
    const menuItemClass = (view) =>
        `flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeView === view
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20'
            : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900'
        } ${collapsed ? 'justify-center px-2' : ''}`;

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 bg-stone-950 h-screen flex flex-col border-r border-stone-800 shrink-0 overflow-y-auto transition-all duration-300
                md:static md:translate-x-0 
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                ${collapsed ? 'md:w-20' : 'md:w-64'}
                w-72
            `}>
                {/* Logo */}
                <div className={`p-6 pb-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    {!collapsed && (
                        <div>
                            <h1 className="font-sans text-xl font-light text-white tracking-[0.25em] uppercase cursor-pointer" onClick={onRefresh}>
                                KAMLIMOS
                            </h1>
                            <p className="text-stone-600 text-[10px] mt-1 uppercase tracking-widest font-bold">Admin Console</p>
                        </div>
                    )}
                    {collapsed && (
                        <h1 className="font-sans text-xl font-bold text-white tracking-widest cursor-pointer" onClick={() => setCollapsed(false)}>K</h1>
                    )}

                    {/* Desktop Collapse Toggle */}
                    <div className="hidden md:block">
                        {!collapsed && (
                            <button onClick={() => setCollapsed(true)} className="text-stone-600 hover:text-white transition-colors">
                                <ChevronsLeft className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {/* Mobile Close Button */}
                    <button onClick={onClose} className="md:hidden text-stone-500 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Desktop Expand Button (when collapsed) */}
                <div className="hidden md:block">
                    {collapsed && (
                        <button onClick={() => setCollapsed(false)} className="mx-auto mb-4 text-stone-600 hover:text-white block">
                            <ChevronsRight className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-6 mt-4">
                    <div>
                        {!collapsed && <p className="px-4 text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2">Management</p>}
                        <button onClick={() => { onViewChange('list'); onClose?.(); }} className={menuItemClass('list')} title="Alle Aufträge">
                            <LayoutGrid className="h-5 w-5" />
                            {!collapsed && <span>Alle Aufträge</span>}
                        </button>
                        <button onClick={() => { onViewChange('kanban'); onClose?.(); }} className={menuItemClass('kanban')} title="Kanban Board">
                            <Kanban className="h-5 w-5" />
                            {!collapsed && <span>Kanban Board</span>}
                        </button>
                    </div>

                    <div>
                        {!collapsed && <p className="px-4 text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2">Aktionen</p>}

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
                                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-900 transition-all font-medium text-sm ${collapsed ? 'justify-center px-2' : ''}`}
                                title="Neuer Auftrag"
                            >
                                <div className="flex items-center space-x-3">
                                    <Plus className="h-5 w-5" />
                                    {!collapsed && <span>Neuer Auftrag</span>}
                                </div>
                                {!collapsed && (isCreateOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                            </button>

                            {!collapsed && isCreateOpen && (
                                <div className="pl-4 mt-1 space-y-1">
                                    <Link to="/admin/create?project=tasse" onClick={onClose} className="flex items-center space-x-3 px-4 py-2 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-900 text-xs font-medium block">
                                        <Coffee className="h-3 w-3" />
                                        <span>Tasse</span>
                                    </Link>
                                    <Link to="/admin/create?project=ritual" onClick={onClose} className="flex items-center space-x-3 px-4 py-2 rounded-lg text-stone-500 hover:text-indigo-400 hover:bg-stone-900 text-xs font-medium block">
                                        <Watch className="h-3 w-3" />
                                        <span>Armband</span>
                                    </Link>
                                    <Link to="/admin/create?project=memoria" onClick={onClose} className="flex items-center space-x-3 px-4 py-2 rounded-lg text-stone-500 hover:text-stone-200 hover:bg-stone-900 text-xs font-medium block">
                                        <Heart className="h-3 w-3" />
                                        <span>Memoria</span>
                                    </Link>
                                    <Link to="/admin/create?project=noor" onClick={onClose} className="flex items-center space-x-3 px-4 py-2 rounded-lg text-stone-500 hover:text-emerald-400 hover:bg-stone-900 text-xs font-medium block">
                                        <Zap className="h-3 w-3" />
                                        <span>Noor</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* User / Footer */}
                <div className="p-4 border-t border-stone-900">
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
                        className={`flex items-center w-full p-3 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-stone-900 transition-all group ${collapsed ? 'justify-center' : ''}`}
                        title="Abmelden"
                    >
                        <LogOut className="h-5 w-5 group-hover:text-rose-500 transition-colors" />
                        {!collapsed && <span className="ml-3 font-medium text-sm">Abmelden</span>}
                    </button>
                </div>
            </div>
        </>
    );
}
