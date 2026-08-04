import React, { useCallback, useState } from 'react';
import { SAMPLE_CLIPS } from '../../core/utils/sample-generator';
import { Sparkles, UploadCloud, Folder, Mic, BookOpen, BarChart2, Play, Zap, Shield, Code, CheckCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  onSampleSelected: (clipId: string) => void;
  isProcessing: boolean;
  stageMessage?: string;
  progressPercent?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  onSampleSelected,
  isProcessing,
  stageMessage,
  progressPercent = 0,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (isProcessing) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected, isProcessing]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !isProcessing) {
      onFileSelected(file);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 select-none">
      {/* Primary Ingest Media Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-2xl border-2 border-dashed transition-all p-10 sm:p-14 text-center overflow-hidden bg-[#11121d] ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-950/20 scale-[1.005]'
            : 'border-[#2c2d4a] hover:border-[#3d3f66]'
        }`}
      >
        <input
          type="file"
          accept="video/*,audio/*,.mp4,.webm,.mov,.mkv,.avi,.mp3,.wav,.m4a,.ogg"
          onChange={handleFileInputChange}
          disabled={isProcessing}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />

        {isProcessing ? (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#2a2254] border border-[#4d3a96] flex items-center justify-center text-indigo-400 animate-spin">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white tracking-wide">{stageMessage || 'Analyzing media stream...'}</h3>
              <div className="w-80 mx-auto bg-[#090912] rounded-full h-2.5 overflow-hidden border border-[#22243d]">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs font-mono text-indigo-400 font-bold">{progressPercent}% COMPLETE</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#2d2459] border border-[#4e3c94] flex items-center justify-center text-indigo-400 shadow-xl">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Ingest Media File or Drag &amp; Drop</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Supports MP4, WebM, MOV, MKV, MP3, WAV up to 10 GB.
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Fast local WebAudio + VAD processing.
              </p>
            </div>
            <div className="pt-3">
              <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all">
                <Folder className="w-4 h-4" />
                Browse Local Storage
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-500 pt-1">
              or drag &amp; drop anywhere
            </p>
          </div>
        )}
      </div>

      {/* Demo Ingest Clips Section */}
      {!isProcessing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-indigo-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2v20M8 6v12M4 10v4M16 6v12M20 10v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Demo Ingest Clips
              </h3>
            </div>
            <span className="text-xs text-zinc-500 font-mono">1-click studio test</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAMPLE_CLIPS.map((clip, index) => {
              const icons = [Mic, BookOpen, BarChart2];
              const IconComp = icons[index % icons.length];
              const isBlue = index === 1;

              return (
                <button
                  key={clip.id}
                  onClick={() => onSampleSelected(clip.id)}
                  className="text-left p-4 bg-[#131420] hover:bg-[#18192a] border border-[#212335] hover:border-indigo-500/50 rounded-2xl transition-all group relative overflow-hidden flex flex-col justify-between h-44"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isBlue ? 'bg-[#1b2b48] text-sky-400 border border-[#2b4470]' : 'bg-[#291f4d] text-indigo-400 border border-[#43337a]'
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 font-sans">
                          {clip.title}
                        </h4>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow group-hover:scale-110 transition-transform shrink-0">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                    {clip.description}
                  </p>

                  {/* Simulated Waveform Bar Graphic */}
                  <div className="w-full h-8 flex items-end gap-0.5 my-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    {[30, 55, 20, 80, 95, 40, 15, 60, 90, 100, 70, 30, 10, 85, 95, 65, 40, 80, 90, 35, 15, 75, 90, 50, 20].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className={`flex-1 rounded-full ${
                          isBlue ? 'bg-sky-500/80' : 'bg-purple-500/80'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={isBlue ? 'text-sky-400 font-medium' : 'text-purple-400 font-medium'}>
                      ~{clip.expectedSilenceSec}s silence
                    </span>
                    <span className="text-zinc-500">{clip.durationSec}s duration</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Feature Highlights Row */}
      {!isProcessing && (
        <div className="bg-[#131420] border border-[#212335] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2b1b4d] border border-[#482c80] text-purple-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">High-Speed Engine</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Silero VAD + WebAudio Optimized for speed.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1b2c4d] border border-[#2c4780] text-sky-400 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Privacy First</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                100% private processing. Zero cloud upload.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#183d33] border border-[#266353] text-emerald-400 flex items-center justify-center shrink-0">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Developer Friendly</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                CLI, API, SDK &amp; Webhooks for automation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4d381b] border border-[#805d2c] text-amber-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">Production Ready</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Built for creators, studios &amp; enterprises.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


