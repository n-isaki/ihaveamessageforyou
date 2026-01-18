import React, { useState } from 'react';
import { LayoutGrid, Kanban, Plus, ChevronDown, ChevronRight, Package, Watch, Heart, Zap, Coffee, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminSidebar({ activeView, onViewChange, onRefresh }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // Adjusted class logic: center content if collapsed
    const menuItemClass = (view) =>
        `flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeView === view
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20'
            : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900'
        } ${collapsed ? 'justify-center px-2' : ''}`;

    return (
        <div className={`${collapsed ? 'w-20' : 'w-64'} bg-stone-950 h-screen flex flex-col border-r border-stone-800 shrink-0 overflow-y-auto transition-all duration-300`}>
            {/* Logo */}
            <div className={`p-6 pb-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                {!collapsed && (
                    <div>
                        <h1 className="font-serif text-2xl font-bold text-white tracking-wider cursor-pointer" onClick={onRefresh}>
                            Kamlimos
                        </h1>
                        <p className="text-stone-600 text-xs mt-1 uppercase tracking-widest">Admin Console</p>
                    </div>
                )}
                {collapsed && (
                    <h1 className="font-serif text-2xl font-bold text-white tracking-wider cursor-pointer" onClick={() => setCollapsed(false)}>K</h1>
                )}

                {!collapsed && (
                    <button onClick={() => setCollapsed(true)} className="text-stone-600 hover:text-white transition-colors">
                        <ChevronsLeft className="h-5 w-5" />
                    </button>
                )}
            </div>

            {collapsed && (
                <button onClick={() => setCollapsed(false)} className="mx-auto mb-4 text-stone-600 hover:text-white">
                    <ChevronsRight className="h-5 w-5" />
                </button>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-6 mt-4">
                <div>
                    {!collapsed && <p className="px-4 text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2">Management</p>}
                    <button onClick={() => onViewChange('list')} className={menuItemClass('list')} title="Alle Aufträge">
                        <LayoutGrid className="h-5 w-5" />
                        {!collapsed && <span>Alle Aufträge</span>}
                    </button>
                    <button onClick={() => onViewChange('kanban')} className={menuItemClass('kanban')} title="Kanban Board">
                        <Kanban className="h-5 w-5" />
                        {!collapsed && <span>Kanban Board</span>}
                    </button>
                </div>

                <div>
                    {!collapsed && <p className="px-4 text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2">Aktionen</p>}

                    {/* Collapsible Create Menu */}
                    <div>
                        <button
                            onClick={() => !collapsed && setIsCreateOpen(!isCreateOpen)}
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
                                <Link to="/admin/create?project=tasse" className="flex items-center space-x-3 px-4 py-2 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-900 text-xs font-medium block">
                                    <Coffee className="h-3 w-3" />
                                    <span>Tasse</span>
                                </Link>
                                <Link to="/admin/create?project=ritual" className="flex items-center space-x-3 px-4 py-2 rounded-lg text-stone-500 hover:text-indigo-400 hover:bg-stone-900 text-xs font-medium block">
                                    <Watch className="h-3 w-3" />
                                    <span>Armband</span>
                                </Link>
                                <Link to="/admin/create?project=memoria" className="flex items-center space-x-3 px-4 py-2 rounded-lg text-stone-500 hover:text-stone-200 hover:bg-stone-900 text-xs font-medium block">
                                    <Heart className="h-3 w-3" />
                                    <span>Memoria</span>
                                </Link>
                                <Link to="/admin/create?project=dua" className="flex items-center space-x-3 px-4 py-2 rounded-lg text-stone-500 hover:text-emerald-400 hover:bg-stone-900 text-xs font-medium block">
                                    <Zap className="h-3 w-3" />
                                    <span>Noor Dua</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* User / Footer */}
            <div className="p-4 border-t border-stone-900">
                <div className={`flex items-center p-3 rounded-xl bg-stone-900/50 border border-stone-900 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold text-xs shrink-0">
                        A
                    </div>
                    {!collapsed && (
                        <div className="ml-3">
                            <p className="text-sm font-medium text-stone-200">Admin</p>
                            <p className="text-xs text-stone-600">Pro Version</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
