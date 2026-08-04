import React, { useEffect, useRef, useState } from 'react';
import { EditEntry } from '../../core/timeline/timeline-types';
import { AudioMeter } from './AudioMeter';
import {
  FastForward,
  Film,
  Maximize2,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface PreviewPlayerProps {
  mediaUrl: string;
  edlEntries: EditEntry[];
  currentTimeMs: number;
  onTimeUpdate: (timeMs: number) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  compareMode: 'cut' | 'original';
  onChangeCompareMode: (mode: 'cut' | 'original') => void;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  mediaUrl,
  edlEntries,
  currentTimeMs,
  onTimeUpdate,
  playbackRate,
  onChangePlaybackRate,
  compareMode,
  onChangeCompareMode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Sync video currentTime when external seek occurs
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const currentSec = currentTimeMs / 1000;
    if (Math.abs(video.currentTime - currentSec) > 0.15) {
      video.currentTime = currentSec;
    }
  }, [currentTimeMs]);

  // Update playback rate on video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Smart seek loop across keep segments in 'cut' mode
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const currentMs = video.currentTime * 1000;
    onTimeUpdate(currentMs);

    if (compareMode === 'cut' && isPlaying) {
      // Check if current time falls in a cut region
      const currentEntry = edlEntries.find((e) => currentMs >= e.startMs && currentMs < e.endMs);
      if (currentEntry && currentEntry.action === 'cut') {
        // Find next keep entry
        const nextKeep = edlEntries.find((e) => e.startMs >= currentEntry.endMs && e.action === 'keep');
        if (nextKeep) {
          video.currentTime = nextKeep.startMs / 1000;
        } else if (isLooping) {
          const firstKeep = edlEntries.find((e) => e.action === 'keep');
          if (firstKeep) video.currentTime = firstKeep.startMs / 1000;
        } else {
          video.pause();
          setIsPlaying(false);
        }
      }
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const stepFrame = (frames: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    const frameTimeSec = 1 / 30; // 30fps default frame step
    video.currentTime = Math.max(0, video.currentTime + frames * frameTimeSec);
  };

  const jumpToCut = (direction: 'prev' | 'next') => {
    if (edlEntries.length === 0) return;
    if (direction === 'prev') {
      const prevEntries = edlEntries.filter((e) => e.startMs < currentTimeMs - 100);
      if (prevEntries.length > 0) {
        const target = prevEntries[prevEntries.length - 1];
        if (videoRef.current) videoRef.current.currentTime = target.startMs / 1000;
      }
    } else {
      const nextEntry = edlEntries.find((e) => e.startMs > currentTimeMs + 100);
      if (nextEntry && videoRef.current) {
        videoRef.current.currentTime = nextEntry.startMs / 1000;
      }
    }
  };

  // Convert MS to SMPTE Timecode (HH:MM:SS:FF at 30fps)
  const formatSMPTE = (ms: number) => {
    const totalSec = ms / 1000;
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    const frames = Math.floor((totalSec % 1) * 30);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#15171c] border border-[#272b35] rounded-lg p-3 space-y-2 shadow-xl select-none">
      {/* Viewport Header Bar */}
      <div className="flex items-center justify-between text-xs font-mono px-1 pb-2 border-b border-[#252933]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">Program Monitor</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 text-[10px]">1920x1080 @ 30fps</span>
        </div>

        {/* SMPTE Timecode Counter */}
        <div className="px-2.5 py-0.5 bg-[#0a0b0d] border border-[#2b2f3a] rounded text-amber-400 font-mono font-bold tracking-widest text-xs">
          {formatSMPTE(currentTimeMs)}
        </div>
      </div>

      {/* Video Viewport Container + Audio Meter Side Dock */}
      <div className="flex items-stretch gap-2">
        <div className="relative aspect-video flex-1 bg-[#090a0c] rounded border border-[#222630] overflow-hidden flex items-center justify-center group">
          <video
            ref={videoRef}
            src={mediaUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
            muted={isMuted}
            playsInline
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Mode Badge Overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border shadow ${
                compareMode === 'cut'
                  ? 'bg-emerald-950/90 text-emerald-400 border-emerald-700/80'
                  : 'bg-amber-950/90 text-amber-400 border-amber-700/80'
              }`}
            >
              {compareMode === 'cut' ? '✂ SILENCE CUT PREVIEW' : '🎬 ORIGINAL SOURCE'}
            </span>
          </div>

          {/* Center Big Play Button on Pause */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-amber-500/90 text-zinc-950 flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all border border-amber-300"
            >
              <Play className="w-7 h-7 ml-1 fill-current" />
            </button>
          )}
        </div>

        {/* Right Side VU Meter Dock */}
        <div className="w-12 shrink-0">
          <AudioMeter videoRef={videoRef} isPlaying={isPlaying} />
        </div>
      </div>

      {/* Studio Transport Control Console */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0d0e11] p-2 rounded border border-[#232731]">
        {/* Left: A/B Mode Toggle */}
        <div className="flex items-center bg-[#181b22] p-0.5 rounded border border-[#282d38] font-mono text-[11px]">
          <button
            onClick={() => onChangeCompareMode('cut')}
            className={`px-2.5 py-1 rounded transition-colors font-semibold ${
              compareMode === 'cut' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Cut EDL
          </button>
          <button
            onClick={() => onChangeCompareMode('original')}
            className={`px-2.5 py-1 rounded transition-colors font-semibold ${
              compareMode === 'original' ? 'bg-[#2b303d] text-zinc-200 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Source
          </button>
        </div>

        {/* Center: Frame-Accurate Transport Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => jumpToCut('prev')}
            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded hover:bg-[#1f232e] transition-colors"
            title="Jump to Previous Edit Cut (Prev Cut)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => stepFrame(-1)}
            className="px-2 py-1 bg-[#181b22] hover:bg-[#252a36] text-zinc-300 rounded border border-[#2b303d] text-[11px] font-mono font-bold transition-colors"
            title="Step Back 1 Frame (-1f)"
          >
            -1f
          </button>
          <button
            onClick={togglePlay}
            className="px-3.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold rounded shadow border border-amber-300 transition-all active:scale-95 text-xs flex items-center gap-1 font-mono uppercase"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={() => stepFrame(1)}
            className="px-2 py-1 bg-[#181b22] hover:bg-[#252a36] text-zinc-300 rounded border border-[#2b303d] text-[11px] font-mono font-bold transition-colors"
            title="Step Forward 1 Frame (+1f)"
          >
            +1f
          </button>
          <button
            onClick={() => jumpToCut('next')}
            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded hover:bg-[#1f232e] transition-colors"
            title="Jump to Next Edit Cut (Next Cut)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Playback Speed & Volume */}
        <div className="flex items-center gap-2">
          <select
            value={playbackRate}
            onChange={(e) => onChangePlaybackRate(Number(e.target.value))}
            className="bg-[#181b22] text-amber-400 border border-[#2b303d] rounded px-2 py-1 text-[11px] font-mono font-bold"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x (Norm)</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x (Fast)</option>
          </select>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-[#181b22] transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};

