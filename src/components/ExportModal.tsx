import React, { useState } from 'react';
import { EditEntry, TimelineStats } from '../../core/timeline/timeline-types';
import { exportEDLToJson, generateFFmpegCliScript } from '../../core/timeline/edl';
import { HybridExporter, ExportProgress } from '../../core/export/hybrid-exporter';
import confetti from 'canvas-confetti';
import { Check, Copy, Download, FileCode, Film, Sparkles, Terminal, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoElement: HTMLVideoElement | null;
  edlEntries: EditEntry[];
  stats: TimelineStats;
  filename: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoElement,
  edlEntries,
  stats,
  filename,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'ffmpeg' | 'edl'>('video');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedEdl, setCopiedEdl] = useState(false);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    if (!videoElement) return;

    setIsExporting(true);
    setProgress({
      currentStep: 'Initializing canvas video renderer...',
      percent: 0,
      processedSegments: 0,
      totalSegments: edlEntries.filter((e) => e.action === 'keep').length,
      currentSegmentTimeMs: 0,
      totalKeepDurationMs: stats.outputDurationMs,
    });

    try {
      const exporter = new HybridExporter();
      const blob = await exporter.renderVideoFromEDL(
        videoElement,
        edlEntries,
        {},
        (prog) => setProgress(prog)
      );

      const url = URL.createObjectURL(blob);
      setExportedUrl(url);
      setIsExporting(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
      alert('Export failed. Please try playing preview first or check browser permissions.');
    }
  };

  const ffmpegScript = generateFFmpegCliScript(edlEntries, filename || 'input.mp4');
  const edlJson = exportEDLToJson(edlEntries, filename || 'video.mp4', stats.originalDurationMs);

  const copyToClipboard = (text: string, type: 'ffmpeg' | 'edl') => {
    navigator.clipboard.writeText(text);
    if (type === 'ffmpeg') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedEdl(true);
      setTimeout(() => setCopiedEdl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#14161c] border border-[#262a35] rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-2xl relative overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262a35]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1e222d] border border-amber-500/50 flex items-center justify-center text-amber-500">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                EXPORT SILENCE-CUT TIMELINE
              </h2>
              <p className="text-[10px] text-zinc-400">
                {stats.totalCuts} SILENCES CUT • SAVED {(stats.timeSavedMs / 1000).toFixed(1)}s ({stats.timeSavedPercent.toFixed(0)}%)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded hover:bg-[#222633] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0b0c0f] p-0.5 rounded border border-[#262a35] text-xs font-bold">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'video' ? 'bg-[#2b303e] text-amber-400 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>BROWSER RENDER</span>
          </button>
          <button
            onClick={() => setActiveTab('ffmpeg')}
            className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'ffmpeg' ? 'bg-[#2b303e] text-amber-400 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>FFMPEG CLI</span>
          </button>
          <button
            onClick={() => setActiveTab('edl')}
            className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'edl' ? 'bg-[#2b303e] text-amber-400 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>EDL JSON</span>
          </button>
        </div>

        {/* Tab 1: Direct Browser Render */}
        {activeTab === 'video' && (
          <div className="space-y-3 py-1">
            {exportedUrl ? (
              <div className="bg-emerald-950/30 border border-emerald-800/60 rounded p-4 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded bg-emerald-500 text-black flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">EXPORT RENDER COMPLETE</h3>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    Your video sequence has been stitched locally without silences.
                  </p>
                </div>
                <div className="pt-1 flex justify-center gap-3">
                  <a
                    href={exportedUrl}
                    download={`silence_cut_${filename || 'video.webm'}`}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded shadow transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    DOWNLOAD RENDERED VIDEO
                  </a>
                </div>
              </div>
            ) : isExporting ? (
              <div className="bg-[#0b0c0f] p-5 rounded border border-[#262a35] text-center space-y-3">
                <Sparkles className="w-6 h-6 text-amber-400 mx-auto animate-spin" />
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase">{progress?.currentStep}</h3>
                  <div className="w-full bg-[#181b22] rounded h-2 overflow-hidden border border-[#272b36]">
                    <div
                      className="bg-amber-500 h-full transition-all duration-200"
                      style={{ width: `${progress?.percent || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-amber-400 font-bold">{progress?.percent}% RENDERED</p>
                </div>
              </div>
            ) : (
              <div className="bg-[#0b0c0f] p-4 rounded border border-[#262a35] space-y-3">
                <div className="text-xs text-zinc-300 space-y-1">
                  <p className="font-bold text-zinc-100">STUDIO BROWSER RENDER PIPELINE:</p>
                  <ul className="list-disc list-inside text-zinc-400 space-y-0.5 text-[11px]">
                    <li>Stitches {stats.totalKeeps} keep segments seamlessly.</li>
                    <li>Generates native WebM/MP4 media file.</li>
                    <li>Runs 100% locally on WebAudio + Canvas renderer.</li>
                  </ul>
                </div>
                <button
                  onClick={handleStartExport}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded shadow transition-all"
                >
                  START LOCAL BROWSER RENDER
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: FFmpeg CLI Script */}
        {activeTab === 'ffmpeg' && (
          <div className="space-y-2 py-1">
            <p className="text-xs text-zinc-300">
              Native terminal stream-copy command for lossless FFmpeg export:
            </p>
            <div className="relative">
              <pre className="bg-[#0b0c0f] border border-[#262a35] p-3 rounded text-[11px] font-mono text-amber-300 overflow-x-auto max-h-44">
                {ffmpegScript}
              </pre>
              <button
                onClick={() => copyToClipboard(ffmpegScript, 'ffmpeg')}
                className="absolute top-2 right-2 px-2.5 py-1 bg-[#1f232d] hover:bg-[#2c3242] text-zinc-200 text-[10px] font-bold rounded border border-[#2e3444] flex items-center gap-1 transition-colors"
              >
                {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedScript ? 'COPIED' : 'COPY SCRIPT'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: EDL JSON */}
        {activeTab === 'edl' && (
          <div className="space-y-2 py-1">
            <p className="text-xs text-zinc-300">
              Open Edit Decision List (EDL) JSON schema:
            </p>
            <div className="relative">
              <pre className="bg-[#0b0c0f] border border-[#262a35] p-3 rounded text-[11px] font-mono text-cyan-400 overflow-x-auto max-h-44">
                {edlJson}
              </pre>
              <button
                onClick={() => copyToClipboard(edlJson, 'edl')}
                className="absolute top-2 right-2 px-2.5 py-1 bg-[#1f232d] hover:bg-[#2c3242] text-zinc-200 text-[10px] font-bold rounded border border-[#2e3444] flex items-center gap-1 transition-colors"
              >
                {copiedEdl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEdl ? 'COPIED' : 'COPY JSON'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

