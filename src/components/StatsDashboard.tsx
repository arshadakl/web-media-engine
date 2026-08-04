import React from 'react';
import { TimelineStats } from '../../core/timeline/timeline-types';
import { BarChart3, Percent, Scissors, Zap } from 'lucide-react';

interface StatsDashboardProps {
  stats: TimelineStats;
  originalSizeBytes?: number;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, originalSizeBytes = 0 }) => {
  const formatTime = (ms: number) => {
    const totalSec = Math.round(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  const estimatedOutputSizeMB =
    originalSizeBytes > 0 && stats.originalDurationMs > 0
      ? ((originalSizeBytes * (stats.outputDurationMs / stats.originalDurationMs)) / (1024 * 1024)).toFixed(1)
      : '0.0';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 select-none">
      {/* Metric 1: Original Duration */}
      <div className="bg-[#12141d] border border-[#202233] rounded-2xl p-4 space-y-1.5 shadow-md">
        <div className="text-zinc-400 text-xs font-mono font-medium tracking-wide">
          ORiGiNaL
        </div>
        <div className="text-xl font-bold text-white font-sans">
          {formatTime(stats.originalDurationMs)}
        </div>
        <div className="text-[11px] text-zinc-500 font-sans">Unprocessed source clip</div>
      </div>

      {/* Metric 2: Export Duration */}
      <div className="bg-[#12141d] border border-[#202233] rounded-2xl p-4 space-y-1.5 shadow-md">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono font-medium tracking-wide">
          <span>Final Cut</span>
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
        </div>
        <div className="text-xl font-bold text-white font-sans">
          {formatTime(stats.outputDurationMs)}
        </div>
        <div className="text-[11px] text-zinc-500 font-sans">Pure speech content</div>
      </div>

      {/* Metric 3: Time Saved */}
      <div className="bg-[#12141d] border border-[#202233] rounded-2xl p-4 space-y-1.5 shadow-md">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono font-medium tracking-wide">
          <span>Time Saved</span>
          <Percent className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl font-bold text-emerald-400 font-sans">
          {stats.timeSavedPercent.toFixed(1)}%
        </div>
        <div className="text-[11px] text-emerald-500 font-mono">
          -{formatTime(stats.timeSavedMs)} cut
        </div>
      </div>

      {/* Metric 4: Total Cuts */}
      <div className="bg-[#12141d] border border-[#202233] rounded-2xl p-4 space-y-1.5 shadow-md">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono font-medium tracking-wide">
          <span>Cuts Removed</span>
          <Scissors className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <div className="text-xl font-bold text-rose-500 font-sans">
          {stats.totalCuts}
        </div>
        <div className="text-[11px] text-zinc-500 font-sans">
          Avg {(stats.averageCutDurationMs / 1000).toFixed(1)}s per cut
        </div>
      </div>

      {/* Metric 5: Estimated File Size */}
      <div className="bg-[#12141d] border border-[#202233] rounded-2xl p-4 space-y-1.5 shadow-md col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono font-medium tracking-wide">
          <span>Est. Size</span>
          <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="text-xl font-bold text-sky-400 font-sans">
          {estimatedOutputSizeMB} MB
        </div>
        <div className="text-[11px] text-zinc-500 font-sans">
          {originalSizeBytes > 0 ? `${(originalSizeBytes / (1024 * 1024)).toFixed(1)} MB original` : 'Calculated on bitrate'}
        </div>
      </div>
    </div>
  );
};


