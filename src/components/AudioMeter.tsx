import React, { useEffect, useRef, useState } from 'react';

interface AudioMeterProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
}

export const AudioMeter: React.FC<AudioMeterProps> = ({ videoRef, isPlaying }) => {
  const [levelDb, setLevelDb] = useState(-60);
  const [peakDb, setPeakDb] = useState(-60);
  const animationFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setupAudioAnalyser = () => {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended' && isPlaying) {
          ctx.resume();
        }

        if (!analyserRef.current) {
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.8;
        }

        if (!sourceRef.current && video) {
          sourceRef.current = ctx.createMediaElementSource(video);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
        }
      } catch (err) {
        // Fallback for cross-origin or already attached elements
      }
    };

    if (isPlaying) {
      setupAudioAnalyser();
    }

    const updateMeter = () => {
      if (analyserRef.current && isPlaying) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length) / 255;
        const db = rms > 0 ? Math.max(-60, 20 * Math.log10(rms)) : -60;

        setLevelDb(db);
        setPeakDb((prev) => Math.max(db, prev - 0.8));
      } else if (!isPlaying) {
        setLevelDb(-60);
        setPeakDb((p) => Math.max(-60, p - 2));
      }

      animationFrameRef.current = requestAnimationFrame(updateMeter);
    };

    updateMeter();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoRef, isPlaying]);

  // DB Scale Bar Mapping (-60dB to 0dB)
  const calculatePercent = (db: number) => {
    if (db <= -60) return 0;
    if (db >= 0) return 100;
    return ((db + 60) / 60) * 100;
  };

  const currentLevelPct = calculatePercent(levelDb);
  const peakLevelPct = calculatePercent(peakDb);

  return (
    <div className="bg-[#12141d] border border-[#202233] rounded-2xl p-2.5 flex flex-col items-center justify-between h-full select-none text-[10px] font-mono shadow-md">
      <div className="text-[9px] font-bold tracking-wider text-indigo-400 uppercase pb-1 border-b border-[#202233] w-full text-center">
        VU METER
      </div>

      <div className="flex-1 my-2 flex items-center justify-center gap-1.5 w-full min-h-[140px]">
        {/* Left Channel Meter */}
        <div className="relative w-3 h-full bg-[#0a0b0f] rounded-lg border border-[#1f2233] overflow-hidden flex flex-col justify-end">
          <div
            className="w-full transition-all duration-75 bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500"
            style={{ height: `${currentLevelPct}%` }}
          />
          <div
            className="absolute left-0 right-0 h-[2px] bg-white shadow-sm"
            style={{ bottom: `${peakLevelPct}%` }}
          />
        </div>

        {/* Right Channel Meter */}
        <div className="relative w-3 h-full bg-[#0a0b0f] rounded-lg border border-[#1f2233] overflow-hidden flex flex-col justify-end">
          <div
            className="w-full transition-all duration-75 bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500"
            style={{ height: `${Math.max(0, currentLevelPct - (Math.random() * 2))}%` }}
          />
          <div
            className="absolute left-0 right-0 h-[2px] bg-white shadow-sm"
            style={{ bottom: `${peakLevelPct}%` }}
          />
        </div>

        {/* dB Scale Labels */}
        <div className="flex flex-col justify-between h-full text-[8px] text-zinc-500 pl-0.5 font-mono leading-none py-0.5">
          <span className={levelDb > -3 ? 'text-rose-400 font-bold' : ''}>0</span>
          <span>-6</span>
          <span>-12</span>
          <span>-24</span>
          <span>-36</span>
          <span>-60</span>
        </div>
      </div>

      <div className="text-[9px] font-mono text-zinc-400 font-bold pt-1 border-t border-[#202233] w-full text-center">
        {levelDb > -60 ? `${levelDb.toFixed(0)}dB` : 'MUTED'}
      </div>
    </div>
  );
};

