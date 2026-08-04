import React, { useEffect, useState } from 'react';
import { detectBrowserCapabilities } from '../../core/utils/browser-compat';
import { LogEntry, logger } from '../../core/utils/logger';
import { memoryGuard } from '../../core/utils/memory-guard';
import { Activity, CheckCircle2, Cpu, HardDrive, Terminal, Trash2, XCircle } from 'lucide-react';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [memInfo, setMemInfo] = useState(memoryGuard.getMemoryInfo());
  const caps = detectBrowserCapabilities();

  useEffect(() => {
    if (!isOpen) return;

    setLogs(logger.getLogs());
    const unsubscribe = logger.subscribe((entry) => {
      setLogs((prev) => [...prev, entry]);
    });

    const interval = setInterval(() => {
      setMemInfo(memoryGuard.getMemoryInfo());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">Engine Diagnostics &amp; Memory Guard</h3>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800"
        >
          Close
        </button>
      </div>

      {/* Capabilities Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">Engine</div>
          <div className="text-slate-100 font-bold">{caps.browserName}</div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">SharedArrayBuffer</div>
          <div className="flex items-center gap-1">
            {caps.sharedArrayBuffer ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className={caps.sharedArrayBuffer ? 'text-emerald-400' : 'text-amber-400'}>
              {caps.sharedArrayBuffer ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">WebCodecs API</div>
          <div className="flex items-center gap-1">
            {caps.webCodecs ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className={caps.webCodecs ? 'text-emerald-400' : 'text-slate-400'}>
              {caps.webCodecs ? 'Native' : 'Fallback'}
            </span>
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
          <div className="text-slate-400 text-[10px] uppercase">JS Heap Memory</div>
          <div className="text-cyan-400 font-bold">
            {memInfo.usedJSHeapSize ? `${(memInfo.usedJSHeapSize / (1024 * 1024)).toFixed(0)} MB` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Structured Logs Stream */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Live Log Stream</span>
          <button
            onClick={() => {
              logger.clear();
              setLogs([]);
            }}
            className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[11px] space-y-1">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">No logs recorded yet.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2">
                <span className="text-slate-500 shrink-0">
                  {new Date(log.timestamp).toISOString().split('T')[1]?.slice(0, 8)}
                </span>
                <span
                  className={`px-1 rounded text-[9px] font-bold uppercase shrink-0 ${
                    log.level === 'ERROR'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : log.level === 'WARN'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : log.level === 'INFO'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-indigo-400 shrink-0">[{log.module}]</span>
                <span className="text-slate-200">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
