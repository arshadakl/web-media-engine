import React, { useState } from 'react';
import { EditEntry } from '../../core/timeline/timeline-types';
import { Check, Filter, Play, Search, X } from 'lucide-react';

interface CutListPanelProps {
  edlEntries: EditEntry[];
  onSeek: (timeMs: number) => void;
  onToggleOverride: (startMs: number, endMs: number, currentAction: 'keep' | 'cut') => void;
  currentTimeMs: number;
}

export const CutListPanel: React.FC<CutListPanelProps> = ({
  edlEntries,
  onSeek,
  onToggleOverride,
  currentTimeMs,
}) => {
  const [filter, setFilter] = useState<'all' | 'keep' | 'cut'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = edlEntries.filter((entry) => {
    if (filter !== 'all' && entry.action !== filter) return false;
    if (searchTerm) {
      const startStr = (entry.startMs / 1000).toFixed(1);
      const endStr = (entry.endMs / 1000).toFixed(1);
      return startStr.includes(searchTerm) || endStr.includes(searchTerm);
    }
    return true;
  });

  const formatSec = (ms: number) => {
    const totalSec = ms / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  return (
    <div className="bg-[#12141d] border border-[#202233] rounded-2xl p-4 space-y-3 shadow-md flex flex-col h-[380px] select-none">
      {/* Search & Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#202233]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#271d4d] border border-[#412e80] text-indigo-400 flex items-center justify-center">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            EDL SEQUENCE BIN
          </h3>
          <span className="px-2 py-0.5 rounded-lg text-[10px] bg-[#181928] text-zinc-400 font-mono font-bold border border-[#24273b]">
            {filteredEntries.length} CLIPS
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Filter Buttons */}
          <div className="flex items-center bg-[#0e1017] p-0.5 rounded-xl border border-[#202233]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${filter === 'all' ? 'bg-[#212438] text-indigo-300' : 'text-zinc-400'}`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilter('keep')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${filter === 'keep' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80' : 'text-zinc-400'}`}
            >
              KEEP
            </button>
            <button
              onClick={() => setFilter('cut')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${filter === 'cut' ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80' : 'text-zinc-400'}`}
            >
              CUT
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search TC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-28 sm:w-32 bg-[#0e1017] border border-[#202233] rounded-xl pl-7 pr-2 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-[#2a2d45]">
        {filteredEntries.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500 italic">
            No EDL segments match filter.
          </div>
        ) : (
          filteredEntries.map((entry, idx) => {
            const isActive = currentTimeMs >= entry.startMs && currentTimeMs < entry.endMs;
            return (
              <div
                key={entry.id}
                onClick={() => onSeek(entry.startMs)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500/70 text-indigo-200 font-bold'
                    : 'bg-[#0e1017] hover:bg-[#161824] border-[#1d1f30] text-zinc-300'
                }`}
              >
                {/* Left: Index & Time */}
                <div className="flex items-center gap-2.5 font-mono">
                  <span className="text-[10px] text-zinc-500 font-bold w-6">#{idx + 1}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(entry.startMs);
                    }}
                    className="p-1 rounded-lg bg-[#181928] hover:bg-indigo-600 text-zinc-300 hover:text-white transition-colors"
                    title="Jump playhead"
                  >
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </button>
                  <div>
                    <span className="font-bold text-zinc-200">
                      {formatSec(entry.startMs)} → {formatSec(entry.endMs)}
                    </span>
                    <span className="text-[10px] text-zinc-500 ml-2 font-normal">
                      ({(entry.durationMs / 1000).toFixed(2)}s)
                    </span>
                  </div>
                </div>

                {/* Right: VAD Probability & Action Button */}
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-[10px] text-zinc-500">
                    VAD: {(entry.avgSpeechProb * 100).toFixed(0)}%
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleOverride(entry.startMs, entry.endMs, entry.action);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border transition-all ${
                      entry.action === 'keep'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-800'
                        : 'bg-rose-950/80 text-rose-400 border-rose-800/80 hover:bg-emerald-950 hover:text-emerald-400 hover:border-emerald-800'
                    }`}
                    title="Toggle restore / cut"
                  >
                    {entry.action === 'keep' ? (
                      <>
                        <Check className="w-2.5 h-2.5" />
                        <span>KEEP</span>
                      </>
                    ) : (
                      <>
                        <X className="w-2.5 h-2.5" />
                        <span>CUT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


