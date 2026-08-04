import React, { useEffect, useRef, useState } from 'react';
import { EditEntry, TimelineStats } from '../../core/timeline/timeline-types';
import { computeRMSFromPCM } from '../../core/audio/rms';
import { VADFrame } from '../../core/vad/vad-types';
import { Eye, EyeOff, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';

interface WaveformCanvasProps {
  pcmData: Float32Array | null;
  edlEntries: EditEntry[];
  vadFrames: VADFrame[];
  currentTimeMs: number;
  totalDurationMs: number;
  onSeek: (timeMs: number) => void;
  onToggleOverride: (startMs: number, endMs: number, currentAction: 'keep' | 'cut') => void;
  stats: TimelineStats;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  pcmData,
  edlEntries,
  vadFrames,
  currentTimeMs,
  totalDurationMs,
  onSeek,
  onToggleOverride,
  stats,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; timeMs: number; entry: EditEntry | null; prob: number } | null>(null);
  const [showProbCurve, setShowProbCurve] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current || totalDurationMs <= 0) return;

    const width = containerRef.current.clientWidth;
    const height = 180;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0f1017';
    ctx.fillRect(0, 0, width, height);

    const totalWidthPixels = width * zoomLevel;

    const rulerHeight = 24;
    const trackH = 34;
    const edlY = rulerHeight;
    const audioY = edlY + trackH + 2;
    const vadY = audioY + trackH + 2;

    // 1. SMPTE Time Ruler
    ctx.fillStyle = '#141620';
    ctx.fillRect(0, 0, width, rulerHeight);
    ctx.fillStyle = '#212335';
    ctx.fillRect(0, rulerHeight - 1, width, 1);

    ctx.fillStyle = '#717a8a';
    ctx.font = '10px monospace';

    const intervalSec = zoomLevel > 4 ? 0.5 : zoomLevel > 2 ? 1 : zoomLevel > 1 ? 5 : 10;
    const totalSec = totalDurationMs / 1000;
    for (let sec = 0; sec <= totalSec; sec += intervalSec) {
      const x = (sec / totalSec) * totalWidthPixels;
      ctx.fillStyle = '#2c2e45';
      ctx.fillRect(x, rulerHeight - 8, 1, 8);

      const mins = Math.floor(sec / 60);
      const remainderSec = Math.floor(sec % 60);
      const frames = Math.floor((sec % 1) * 30);
      const label = `${mins.toString().padStart(2, '0')}:${remainderSec.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
      ctx.fillStyle = '#8b95a5';
      ctx.fillText(label, x + 3, 14);
    }

    // 2. Track Background Lanes
    [edlY, audioY, vadY].forEach((yPos) => {
      ctx.fillStyle = '#12141f';
      ctx.fillRect(0, yPos, width, trackH);
      ctx.fillStyle = '#1f2233';
      ctx.fillRect(0, yPos + trackH - 1, width, 1);
    });

    // 3. EDL Blocks
    edlEntries.forEach((entry) => {
      const startX = (entry.startMs / totalDurationMs) * totalWidthPixels;
      const endX = (entry.endMs / totalDurationMs) * totalWidthPixels;
      const segWidth = Math.max(2, endX - startX);

      if (entry.action === 'keep') {
        if (entry.isCompressedPause) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.fillRect(startX, edlY, segWidth, trackH);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(startX, edlY, segWidth, 3);
        } else {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
          ctx.fillRect(startX, edlY, segWidth, trackH);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(startX, edlY, segWidth, 3);
        }
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(startX, edlY, segWidth, trackH);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(startX, edlY, segWidth, 3);
      }

      ctx.fillStyle = '#0f1017';
      ctx.fillRect(startX, edlY, 1, trackH);
    });

    // 4. Audio RMS Waveform Track
    if (pcmData && pcmData.length > 0) {
      const numBins = Math.floor(totalWidthPixels);
      const { rmsValues, maxRms } = computeRMSFromPCM(pcmData, numBins);
      const centerY = audioY + trackH / 2;
      const scaleY = maxRms > 0 ? (trackH - 6) / (2 * maxRms) : 1;

      ctx.fillStyle = '#38bdf8';
      for (let b = 0; b < numBins; b++) {
        const x = b;
        const rms = rmsValues[b] || 0;
        const barHeight = Math.max(2, rms * scaleY);
        ctx.fillRect(x, centerY - barHeight / 2, 1, barHeight);
      }
    }

    // 5. VAD Speech Probability Curve
    if (showProbCurve && vadFrames.length > 0) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      vadFrames.forEach((frame, idx) => {
        const x = (frame.startMs / totalDurationMs) * totalWidthPixels;
        const y = vadY + trackH - frame.speechProb * (trackH - 6) - 3;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 6. Active Playhead Line & Cursor
    const playheadX = (currentTimeMs / totalDurationMs) * totalWidthPixels;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, 0);
    ctx.lineTo(playheadX + 6, 0);
    ctx.lineTo(playheadX, 10);
    ctx.closePath();
    ctx.fill();
  }, [pcmData, edlEntries, vadFrames, currentTimeMs, totalDurationMs, zoomLevel, showProbCurve]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || totalDurationMs <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const totalWidthPixels = rect.width * zoomLevel;
    const clickRatio = clickX / totalWidthPixels;
    const targetMs = clickRatio * totalDurationMs;

    if (e.shiftKey) {
      const clickedEntry = edlEntries.find((entry) => targetMs >= entry.startMs && targetMs <= entry.endMs);
      if (clickedEntry) {
        onToggleOverride(clickedEntry.startMs, clickedEntry.endMs, clickedEntry.action);
      }
    } else {
      onSeek(targetMs);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || totalDurationMs <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const totalWidthPixels = rect.width * zoomLevel;
    const timeMs = (hoverX / totalWidthPixels) * totalDurationMs;

    const entry = edlEntries.find((item) => timeMs >= item.startMs && timeMs <= item.endMs) || null;
    const frame = vadFrames.find((f) => timeMs >= f.startMs && timeMs <= f.endMs);

    setHoverInfo({
      x: e.clientX,
      y: e.clientY,
      timeMs,
      entry,
      prob: frame ? frame.speechProb : entry ? entry.avgSpeechProb : 0,
    });
  };

  const formatTimestamp = (ms: number) => {
    const totalSec = ms / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#12141d] border border-[#202233] rounded-2xl p-4 space-y-3 shadow-md select-none">
      {/* Studio Timeline Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
        {/* Track Headers Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-zinc-200 font-bold">Keep ({stats.totalKeeps})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-zinc-200 font-bold">Cut ({stats.totalCuts})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-zinc-200 font-bold">Compressed Pause</span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => setShowProbCurve(!showProbCurve)}
            className={`px-2.5 py-1 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
              showProbCurve ? 'bg-amber-950/80 text-amber-400 border-amber-800/80' : 'bg-[#181928] text-zinc-400 border-[#24273b]'
            }`}
          >
            {showProbCurve ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>VAD Track</span>
          </button>

          <div className="flex items-center bg-[#181928] rounded-xl p-0.5 border border-[#24273b]">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              className="p-1 hover:bg-[#23263b] text-zinc-300 rounded-lg"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-amber-400 text-xs font-bold">{zoomLevel.toFixed(1)}x</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(8, z + 0.5))}
              className="p-1 hover:bg-[#23263b] text-zinc-300 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 bg-[#181928] hover:bg-[#23263b] text-zinc-400 rounded-xl border border-[#24273b]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-Track Container */}
      <div className="flex border border-[#202233] rounded-xl bg-[#0f1017] overflow-hidden">
        {/* Track Headers Column */}
        <div className="w-20 shrink-0 bg-[#12141d] border-r border-[#202233] flex flex-col text-[10px] font-mono font-bold text-zinc-400 select-none">
          <div className="h-[24px] border-b border-[#1f2233] flex items-center justify-center text-zinc-500 text-[9px] bg-[#0e0f17]">
            SWIPE
          </div>
          <div className="h-[34px] border-b border-[#1f2233] flex items-center justify-center text-indigo-400 bg-[#131522]">
            EDL
          </div>
          <div className="h-[34px] border-b border-[#1f2233] flex items-center justify-center text-sky-400 bg-[#131522]">
            AI RMS
          </div>
          <div className="h-[34px] border-b border-[#1f2233] flex items-center justify-center text-amber-400 bg-[#131522]">
            VAD AI
          </div>
        </div>

        {/* Scrollable Timeline Canvas */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-x-auto cursor-crosshair scrollbar-thin scrollbar-thumb-[#2a2d45]"
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverInfo(null)}
            className="block w-full h-[180px]"
          />

          {hoverInfo && (
            <div
              className="fixed z-50 pointer-events-none bg-[#090a0d] border border-[#30334d] text-white rounded-xl p-2.5 text-xs shadow-2xl font-mono space-y-1 transform -translate-x-1/2 -translate-y-full mt-[-8px]"
              style={{ left: `${hoverInfo.x}px`, top: `${hoverInfo.y}px` }}
            >
              <div className="text-amber-400 font-bold">{formatTimestamp(hoverInfo.timeMs)}</div>
              {hoverInfo.entry && (
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    hoverInfo.entry.action === 'keep' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    {hoverInfo.entry.action}
                  </span>
                  <span className="text-zinc-300 text-[11px]">
                    VAD: {(hoverInfo.prob * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between text-xs font-mono text-zinc-400">
        <span>Playback: <strong className="text-amber-400">{formatTimestamp(currentTimeMs)}</strong></span>
        <span>Duration: {formatTimestamp(totalDurationMs)}</span>
      </div>
    </div>
  );
};

