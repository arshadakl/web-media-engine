import React from 'react';
import { detectBrowserCapabilities } from '../../core/utils/browser-compat';
import { SAMPLE_CLIPS } from '../../core/utils/sample-generator';
import { Terminal, Zap, ChevronDown, Sliders } from 'lucide-react';

interface HeaderProps {
  onSelectSample: (clipId: string) => void;
  onToggleDebug: () => void;
  showDebug: boolean;
  hasLoadedFile: boolean;
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectSample,
  onToggleDebug,
  showDebug,
}) => {
  const caps = detectBrowserCapabilities();

  return (
    <header className="sticky top-0 z-30 bg-[#0e0f17] border-b border-[#1e202d] text-zinc-100 px-6 py-3 select-none">
      <div className="flex items-center justify-between gap-4">
        {/* Left Placeholder for Responsive Spacing */}
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#131521] border border-[#222538] rounded-full text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-zinc-300 font-medium">Silero ONNX VAD</span>
            <span className="text-zinc-600">•</span>
            <span className={caps.sharedArrayBuffer ? 'text-emerald-400' : 'text-zinc-300'}>
              {caps.sharedArrayBuffer ? 'SAB Worker' : 'AudioContext'}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-bold">16kHz PCM</span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Selector */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#131521] hover:bg-[#1a1d2e] text-zinc-200 border border-[#222538] rounded-xl text-xs font-medium font-sans transition-colors">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Sample Demo</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-[#131521] border border-[#272a42] rounded-2xl shadow-2xl p-2 hidden group-hover:block z-50 animate-fadeIn">
              <div className="text-[10px] font-bold text-zinc-400 px-3 py-1.5 uppercase tracking-wider font-mono border-b border-[#1e2133] mb-1">
                Instant Studio Test Clips
              </div>
              {SAMPLE_CLIPS.map((clip) => (
                <button
                  key={clip.id}
                  onClick={() => onSelectSample(clip.id)}
                  className="w-full text-left p-2.5 hover:bg-[#1f2238] rounded-xl transition-colors group/item"
                >
                  <div className="text-xs font-bold text-zinc-200 group-hover/item:text-indigo-400 font-sans">
                    {clip.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{clip.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* System Options */}
          <button
            onClick={onToggleDebug}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium font-sans transition-colors ${
              showDebug
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                : 'bg-[#131521] text-zinc-300 border-[#222538] hover:bg-[#1a1d2e]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span>System</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>
        </div>
      </div>
    </header>
  );
};


