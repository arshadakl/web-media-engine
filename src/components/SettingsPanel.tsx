import React, { useState } from 'react';
import { TimelineSettings } from '../../core/timeline/timeline-types';
import { RotateCcw, Sliders, SlidersHorizontal } from 'lucide-react';

interface SettingsPanelProps {
  settings: TimelineSettings;
  onUpdateSettings: (newSettings: Partial<TimelineSettings>) => void;
  onResetSettings: () => void;
  estimatedNoiseFloorDb: number;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  estimatedNoiseFloorDb,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-[#12141d] border border-[#202233] rounded-2xl p-5 space-y-4 shadow-md select-none">
      <div className="flex items-center justify-between pb-3 border-b border-[#202233]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#271d4d] border border-[#412e80] text-indigo-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            VAD SILENCE REMOVAL PARAMETERS
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              showAdvanced ? 'bg-[#291f4d] text-indigo-300 border-[#43337a]' : 'bg-[#181928] text-zinc-300 border-[#24273b] hover:bg-[#202236]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Simple Mode' : 'Advanced Tuning'}</span>
          </button>
          <button
            onClick={onResetSettings}
            className="p-1.5 bg-[#181928] hover:bg-[#202236] text-zinc-400 rounded-xl border border-[#24273b] transition-colors"
            title="Reset to studio defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono">
        {/* Min Silence Duration Slider */}
        <div className="space-y-2 bg-[#0e1017] p-4 rounded-xl border border-[#1d1f30]">
          <div className="flex justify-between text-xs">
            <span className="font-sans font-semibold text-zinc-200">Min Silence Cut</span>
            <span className="text-indigo-400 font-bold">{settings.minSilenceMs} ms</span>
          </div>
          <input
            type="range"
            min="200"
            max="2000"
            step="50"
            value={settings.minSilenceMs}
            onChange={(e) => onUpdateSettings({ minSilenceMs: Number(e.target.value) })}
            className="w-full accent-indigo-500 bg-[#1e2033] rounded cursor-pointer h-1.5"
          />
          <p className="text-[10px] text-zinc-500 font-sans">Ignore pauses under this duration.</p>
        </div>

        {/* Speech Threshold Slider */}
        <div className="space-y-2 bg-[#0e1017] p-4 rounded-xl border border-[#1d1f30]">
          <div className="flex justify-between text-xs">
            <span className="font-sans font-semibold text-zinc-200">Speech Sensitivity</span>
            <span className="text-indigo-400 font-bold">{Math.round(settings.speechThreshold * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.30"
            max="0.95"
            step="0.05"
            value={settings.speechThreshold}
            onChange={(e) => onUpdateSettings({ speechThreshold: Number(e.target.value) })}
            className="w-full accent-indigo-500 bg-[#1e2033] rounded cursor-pointer h-1.5"
          />
          <p className="text-[10px] text-zinc-500 font-sans">Higher value = strict voice detection.</p>
        </div>

        {/* Padding Expansion Slider */}
        <div className="space-y-2 bg-[#0e1017] p-4 rounded-xl border border-[#1d1f30]">
          <div className="flex justify-between text-xs">
            <span className="font-sans font-semibold text-zinc-200">Padding Buffer</span>
            <span className="text-indigo-400 font-bold">±{settings.paddingMs} ms</span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="25"
            value={settings.paddingMs}
            onChange={(e) => onUpdateSettings({ paddingMs: Number(e.target.value) })}
            className="w-full accent-indigo-500 bg-[#1e2033] rounded cursor-pointer h-1.5"
          />
          <p className="text-[10px] text-zinc-500 font-sans">Breathing margin around speech boundaries.</p>
        </div>
      </div>

      {/* Advanced Tuning Options */}
      {showAdvanced && (
        <div className="pt-3 border-t border-[#202233] grid grid-cols-1 md:grid-cols-3 gap-4 font-mono animate-fadeIn">
          {/* Pause Compression Toggle & Controls */}
          <div className="space-y-2 bg-[#0e1017] p-4 rounded-xl border border-[#1d1f30]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-sans font-semibold text-zinc-200">Pause Compression</span>
              <input
                type="checkbox"
                checked={settings.enablePauseCompression}
                onChange={(e) => onUpdateSettings({ enablePauseCompression: e.target.checked })}
                className="accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </div>
            {settings.enablePauseCompression && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Target Length</span>
                  <span className="text-indigo-400 font-bold">{settings.targetPauseDurationMs} ms</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="600"
                  step="25"
                  value={settings.targetPauseDurationMs}
                  onChange={(e) => onUpdateSettings({ targetPauseDurationMs: Number(e.target.value) })}
                  className="w-full accent-indigo-500 bg-[#1e2033] rounded cursor-pointer h-1.5"
                />
              </div>
            )}
            <p className="text-[10px] text-zinc-500 font-sans">Compresses long pauses without cutting completely.</p>
          </div>

          {/* Merge Gap Slider */}
          <div className="space-y-2 bg-[#0e1017] p-4 rounded-xl border border-[#1d1f30]">
            <div className="flex justify-between text-xs">
              <span className="font-sans font-semibold text-zinc-200">Merge Gap Distance</span>
              <span className="text-indigo-400 font-bold">{settings.mergeGapMs} ms</span>
            </div>
            <input
              type="range"
              min="50"
              max="800"
              step="25"
              value={settings.mergeGapMs}
              onChange={(e) => onUpdateSettings({ mergeGapMs: Number(e.target.value) })}
              className="w-full accent-indigo-500 bg-[#1e2033] rounded cursor-pointer h-1.5"
            />
            <p className="text-[10px] text-zinc-500 font-sans">Merges adjacent speech segments.</p>
          </div>

          {/* Noise Floor Info */}
          <div className="space-y-2 bg-[#0e1017] p-4 rounded-xl border border-[#1d1f30] flex flex-col justify-between">
            <div className="flex justify-between text-xs">
              <span className="font-sans font-semibold text-zinc-200">Noise Floor Level</span>
              <span className="text-emerald-400 font-bold">{estimatedNoiseFloorDb.toFixed(1)} dB</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans">
              Calibrated ambient noise floor for adaptive hysteresis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


