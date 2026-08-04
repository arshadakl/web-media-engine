import React, { useEffect, useMemo, useRef, useState } from 'react';
import { extractAudioFromMediaFile } from '../core/audio/extractor';
import { generateSyntheticSampleFile, SAMPLE_CLIPS } from '../core/utils/sample-generator';
import { logger } from '../core/utils/logger';
import { buildSegmentsFromFrames } from '../core/timeline/builder';
import { calculateTimelineStats, exportEDLToJson } from '../core/timeline/edl';
import { processTimelineRules } from '../core/timeline/merger';
import { DEFAULT_TIMELINE_SETTINGS, EditEntry, TimelineSettings, UserOverride } from '../core/timeline/timeline-types';
import { SileroVADEngine } from '../core/vad/silero';
import { VADFrame } from '../core/vad/vad-types';
import { CutListPanel } from './components/CutListPanel';
import { DebugPanel } from './components/DebugPanel';
import { ExportModal } from './components/ExportModal';
import { FileUploader } from './components/FileUploader';
import { Header } from './components/Header';
import { PreviewPlayer } from './components/PreviewPlayer';
import { SettingsPanel } from './components/SettingsPanel';
import { StatsDashboard } from './components/StatsDashboard';
import { WaveformCanvas } from './components/WaveformCanvas';
import { ProcessingState } from './types';
import { Check, Download, FileText, Layers, RefreshCw, Sparkles, Upload } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progressPercent: 0,
    stageMessage: '',
    pcmData: null,
    sampleRate: 16000,
    vadFrames: [],
    estimatedNoiseFloorDb: -50,
  });

  const [settings, setSettings] = useState<TimelineSettings>(DEFAULT_TIMELINE_SETTINGS);
  const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [compareMode, setCompareMode] = useState<'cut' | 'original'>('cut');

  const [activeTab, setActiveTab] = useState<'timeline' | 'cutlist'>('timeline');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Clean up Blob object URLs
  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  // Main Pipeline Handler: File Selection -> Audio Extraction -> Silero VAD Analysis -> EDL Timeline
  const handleProcessFile = async (inputFile: File) => {
    logger.info('App', `Loading media file: ${inputFile.name} (${(inputFile.size / (1024 * 1024)).toFixed(1)}MB)`);

    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }

    const objectUrl = URL.createObjectURL(inputFile);
    setFile(inputFile);
    setMediaUrl(objectUrl);
    setUserOverrides([]);
    setCurrentTimeMs(0);

    setProcessing({
      status: 'extracting',
      progressPercent: 10,
      stageMessage: 'Extracting audio track from video file...',
      pcmData: null,
      sampleRate: 16000,
      vadFrames: [],
      estimatedNoiseFloorDb: -50,
    });

    try {
      // Step 1: Extract Audio PCM from file using Web Audio API / OfflineAudioContext
      const { pcmData, sampleRate, durationSeconds } = await extractAudioFromMediaFile(inputFile, 16000, (pct) => {
        setProcessing((prev) => ({
          ...prev,
          progressPercent: Math.round(pct * 0.4), // 0-40%
        }));
      });

      setProcessing((prev) => ({
        ...prev,
        status: 'analyzing_vad',
        stageMessage: 'Running Silero AI Voice Activity Detection (VAD)...',
        progressPercent: 45,
        pcmData,
        sampleRate,
      }));

      // Step 2: Run Silero VAD Engine
      const vadEngine = new SileroVADEngine();
      await vadEngine.init();

      const frames = await vadEngine.processAudio(pcmData, sampleRate, (pct) => {
        setProcessing((prev) => ({
          ...prev,
          progressPercent: 45 + Math.round(pct * 0.55), // 45-100%
        }));
      });

      setProcessing({
        status: 'ready',
        progressPercent: 100,
        stageMessage: 'VAD Analysis Complete',
        pcmData,
        sampleRate,
        vadFrames: frames,
        estimatedNoiseFloorDb: vadEngine.getEstimatedNoiseFloorDb(),
      });

      logger.info('App', `Processing completed successfully with ${frames.length} VAD frames`);
    } catch (err) {
      logger.error('App', 'File processing pipeline error', err);
      setProcessing((prev) => ({
        ...prev,
        status: 'error',
        stageMessage: 'Failed to process file',
        errorMessage: err instanceof Error ? err.message : 'Unknown error occurred.',
      }));
    }
  };

  // Sample Clip Selector Handler
  const handleSelectSample = async (clipId: string) => {
    setProcessing({
      status: 'extracting',
      progressPercent: 5,
      stageMessage: 'Generating synthetic demo podcast clip...',
      pcmData: null,
      sampleRate: 16000,
      vadFrames: [],
      estimatedNoiseFloorDb: -50,
    });

    try {
      const sampleFile = await generateSyntheticSampleFile(clipId);
      await handleProcessFile(sampleFile);
    } catch (err) {
      logger.error('App', 'Sample generation failed', err);
    }
  };

  // Compute total duration in MS
  const totalDurationMs = useMemo(() => {
    if (!processing.pcmData || processing.sampleRate <= 0) return 0;
    return (processing.pcmData.length / processing.sampleRate) * 1000;
  }, [processing.pcmData, processing.sampleRate]);

  // Compute Initial Segments from VAD Frames
  const initialSegments = useMemo(() => {
    if (processing.vadFrames.length === 0) return [];
    return buildSegmentsFromFrames(processing.vadFrames);
  }, [processing.vadFrames]);

  // Process EDL Entries whenever settings or overrides change (Reactive & instant <50ms)
  const edlEntries = useMemo(() => {
    if (initialSegments.length === 0 || totalDurationMs <= 0) return [];
    return processTimelineRules(initialSegments, settings, totalDurationMs, userOverrides);
  }, [initialSegments, settings, totalDurationMs, userOverrides]);

  // Compute Timeline Statistics
  const stats = useMemo(() => {
    return calculateTimelineStats(edlEntries, totalDurationMs);
  }, [edlEntries, totalDurationMs]);

  // Toggle Manual Cut / Keep Override
  const handleToggleOverride = (startMs: number, endMs: number, currentAction: 'keep' | 'cut') => {
    const forcedAction = currentAction === 'keep' ? 'cut' : 'keep';
    setUserOverrides((prev) => [
      ...prev.filter((o) => !(o.startMs === startMs && o.endMs === endMs)),
      {
        id: `override_${Date.now()}`,
        startMs,
        endMs,
        forcedAction,
      },
    ]);
    logger.info('App', `Applied user override: ${startMs.toFixed(0)}-${endMs.toFixed(0)}ms forced to ${forcedAction}`);
  };

  // Hidden offscreen video for canvas export rendering
  const handleRegisterHiddenVideo = (el: HTMLVideoElement | null) => {
    videoElementRef.current = el;
  };

  return (
    <div className="min-h-screen bg-[#090a0d] text-zinc-100 flex flex-col font-sans select-none">
      {/* Header Bar */}
      <Header
        onSelectSample={handleSelectSample}
        onToggleDebug={() => setShowDebug(!showDebug)}
        showDebug={showDebug}
        hasLoadedFile={!!file && processing.status === 'ready'}
        onOpenExportModal={() => setShowExportModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* Debug Panel (if toggled) */}
        {showDebug && (
          <DebugPanel isOpen={showDebug} onClose={() => setShowDebug(false)} />
        )}

        {/* View 1: Ingestion / File Uploader if no file loaded or errored */}
        {(!file || processing.status === 'idle' || processing.status === 'extracting' || processing.status === 'analyzing_vad') && (
          <FileUploader
            onFileSelected={handleProcessFile}
            onSampleSelected={handleSelectSample}
            isProcessing={processing.status === 'extracting' || processing.status === 'analyzing_vad'}
            stageMessage={processing.stageMessage}
            progressPercent={processing.progressPercent}
          />
        )}

        {/* Error Notification */}
        {processing.status === 'error' && (
          <div className="max-w-xl mx-auto bg-rose-950/40 border border-rose-800 rounded-lg p-5 text-center space-y-3 font-mono">
            <div className="text-rose-400 font-bold text-xs uppercase">PROCESSING ENGINE FAILURE</div>
            <p className="text-xs text-zinc-300">{processing.errorMessage}</p>
            <button
              onClick={() => {
                setFile(null);
                setProcessing({
                  status: 'idle',
                  progressPercent: 0,
                  stageMessage: '',
                  pcmData: null,
                  sampleRate: 16000,
                  vadFrames: [],
                  estimatedNoiseFloorDb: -50,
                });
              }}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded shadow transition-all"
            >
              RETRY INGESTION
            </button>
          </div>
        )}

        {/* View 2: Full SilenceCutter Studio Dashboard when ready */}
        {file && processing.status === 'ready' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Top Info & File Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14161c] p-3 rounded-lg border border-[#262a35] font-mono">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#1e222d] border border-amber-500/50 flex items-center justify-center text-amber-500 font-bold text-xs uppercase">
                  {file.name.split('.').pop() || 'VID'}
                </div>
                <div>
                  <h2 className="text-xs font-bold text-zinc-100 line-clamp-1 uppercase">{file.name}</h2>
                  <p className="text-[11px] text-zinc-400">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB • {processing.vadFrames.length} VAD FRAMES
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-2.5 py-1 bg-[#1e222d] hover:bg-[#282d3b] text-zinc-300 rounded border border-[#2b303d] text-xs font-bold flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-amber-500" />
                  <span>CHANGE MEDIA</span>
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleProcessFile(f);
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded shadow transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT</span>
                </button>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <StatsDashboard stats={stats} originalSizeBytes={file.size} />

            {/* Multi-Track NLE Waveform Canvas */}
            <WaveformCanvas
              pcmData={processing.pcmData}
              edlEntries={edlEntries}
              vadFrames={processing.vadFrames}
              currentTimeMs={currentTimeMs}
              totalDurationMs={totalDurationMs}
              onSeek={(time) => setCurrentTimeMs(time)}
              onToggleOverride={handleToggleOverride}
              stats={stats}
            />

            {/* VAD Rules & Silence Parameters */}
            <SettingsPanel
              settings={settings}
              onUpdateSettings={(newSet) => setSettings((prev) => ({ ...prev, ...newSet }))}
              onResetSettings={() => setSettings(DEFAULT_TIMELINE_SETTINGS)}
              estimatedNoiseFloorDb={processing.estimatedNoiseFloorDb}
            />

            {/* Program Monitor Player & EDL Sequence Bin */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left 7 Cols: Studio Program Monitor */}
              <div className="lg:col-span-7">
                {mediaUrl && (
                  <PreviewPlayer
                    mediaUrl={mediaUrl}
                    edlEntries={edlEntries}
                    currentTimeMs={currentTimeMs}
                    onTimeUpdate={(t) => setCurrentTimeMs(t)}
                    playbackRate={playbackRate}
                    onChangePlaybackRate={(r) => setPlaybackRate(r)}
                    compareMode={compareMode}
                    onChangeCompareMode={(m) => setCompareMode(m)}
                  />
                )}
              </div>

              {/* Right 5 Cols: EDL Cut List Sequence Bin */}
              <div className="lg:col-span-5">
                <CutListPanel
                  edlEntries={edlEntries}
                  onSeek={(t) => setCurrentTimeMs(t)}
                  onToggleOverride={handleToggleOverride}
                  currentTimeMs={currentTimeMs}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Studio Status Bar Footer */}
      <footer className="mt-auto border-t border-[#1e222d] bg-[#0c0d10] p-2.5 text-center text-[11px] text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            SilenceCutter Pro NLE — High-Speed Browser WebAudio + Silero VAD Processing Engine
          </div>
          <div className="text-amber-500 font-bold">100% PRIVATE • ZERO CLOUD UPLOAD</div>
        </div>
      </footer>

      {/* Export Modal */}
      {showExportModal && mediaUrl && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          videoElement={videoElementRef.current}
          edlEntries={edlEntries}
          stats={stats}
          filename={file?.name || 'silence_removed.mp4'}
        />
      )}

      {/* Hidden Video Element for Export rendering context */}
      {mediaUrl && (
        <video
          ref={handleRegisterHiddenVideo}
          src={mediaUrl}
          playsInline
          muted
          className="hidden"
        />
      )}
    </div>
  );
}
