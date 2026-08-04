import React from 'react';
import { LayoutDashboard, Download, Settings, Plus, ChevronDown } from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'exports' | 'settings';
  onChangeTab: (tab: 'dashboard' | 'exports' | 'settings') => void;
  onNewProject: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onChangeTab, onNewProject }) => {
  return (
    <aside className="w-64 bg-[#0e0f17] border-r border-[#1e202d] flex flex-col justify-between p-4 shrink-0 select-none min-h-screen">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#271d47] border border-[#3f326d] text-indigo-400">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2v20M8 6v12M4 10v4M16 6v12M20 10v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white font-sans">
              SilenceCutter
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider bg-[#261f42] text-indigo-300 border border-[#48397a] rounded-full">
              Pro NLE
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">v2.4.8</span>
          </div>
        </div>

        {/* New Project Action Button */}
        <button
          onClick={onNewProject}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>

        {/* Navigation Section */}
        <nav className="space-y-1">
          <button
            onClick={() => onChangeTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#181828] text-white border border-[#2e2a4a] shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#131420]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onChangeTab('exports')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'exports'
                ? 'bg-[#181828] text-white border border-[#2e2a4a] shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#131420]'
            }`}
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Exports</span>
          </button>

          <button
            onClick={() => onChangeTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-[#181828] text-white border border-[#2e2a4a] shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#131420]'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* User / Studio Profile Bottom Card */}
      <div className="bg-[#131422] border border-[#202236] rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#2b2852] border border-[#483d80] text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
            SC
          </div>
          <div className="text-left overflow-hidden">
            <div className="text-xs font-bold text-white leading-snug truncate">Studio Pro</div>
            <div className="text-[10px] text-zinc-400 truncate">studio@silencecutter.pro</div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
      </div>
    </aside>
  );
};
