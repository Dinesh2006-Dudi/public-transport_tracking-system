import React, { useState } from 'react';
import { DownloadCloud, WifiOff, Wifi, Info, HardDrive, CheckCircle2, AlertTriangle } from 'lucide-react';

interface OfflineManagerProps {
  isOfflineMode: boolean;
  isMapDownloaded: boolean;
  downloadProgress: number;
  onToggleOffline: (offline: boolean) => void;
  onStartDownload: () => void;
}

export default function OfflineManager({
  isOfflineMode,
  isMapDownloaded,
  downloadProgress,
  onToggleOffline,
  onStartDownload,
}: OfflineManagerProps) {
  const [syncTime, setSyncTime] = useState<string>('Not Synced');

  const handleDownload = () => {
    onStartDownload();
    const now = new Date();
    setSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  return (
    <div className="space-y-4" id="offline-manager-section">
      
      {/* 1. STATUS SUMMARY HEADER */}
      <div className={`p-4 border rounded-xl flex items-center justify-between gap-3 shadow-sm transition-colors ${
        isOfflineMode 
          ? 'bg-zinc-900 border-zinc-800 text-white' 
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isOfflineMode ? (
              <WifiOff size={18} className="text-zinc-400 shrink-0" />
            ) : (
              <Wifi size={18} className="text-sky-500 shrink-0" />
            )}
            <span className="text-sm font-bold tracking-tight">
              {isOfflineMode ? 'Running in Offline Mode' : 'Network Connection Active'}
            </span>
          </div>
          <p className={`text-[11px] leading-snug ${isOfflineMode ? 'text-zinc-400' : 'text-slate-500'}`}>
            {isOfflineMode 
              ? 'Pausing external API requests. Relying on local vector tiles.' 
              : 'Streaming live vehicle positions from active municipal servers.'}
          </p>
        </div>

        {/* Dynamic Toggle Button */}
        <button
          onClick={() => {
            if (isOfflineMode) {
              onToggleOffline(false);
            } else {
              // Permit offline toggle only if downloaded
              if (isMapDownloaded) {
                onToggleOffline(true);
              } else {
                alert("Please download the Offline Map bundle first before entering Offline Mode!");
              }
            }
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
            isOfflineMode 
              ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          id="btn-toggle-offline-mode"
        >
          {isOfflineMode ? 'Go Online' : 'Go Offline'}
        </button>
      </div>

      {/* 2. WARNING / EXPLANATORY CARD */}
      {isOfflineMode && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex gap-2.5 text-xs">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 pt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Local Database Offline Fallback</span>
            <p className="opacity-90 leading-relaxed font-sans">
              Routing, bus schedules, station lists, and coordinate nodes are currently loading from your phone's stored cache. <strong>Live GPS positions are being simulated locally</strong> to maintain complete navigation assistance without internet service.
            </p>
          </div>
        </div>
      )}

      {/* 3. DOWNLOAD BUNDLE INTERACTIVE PANEL */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4 shadow-sm">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <HardDrive size={12} /> Local Offline Storage Manager
        </h4>

        <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800">Metro City Central Transit Pack</span>
            <div className="text-[10px] text-slate-500 font-mono">
              Vector Map: 14.2 MB • Schedules & Routing DB: 2.1 MB
            </div>
            {isMapDownloaded && (
              <span className="text-[10px] text-sky-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 size={11} className="fill-sky-50" /> Sync verified! Last update: {syncTime}
              </span>
            )}
          </div>

          {/* Download button / progress indicator */}
          {downloadProgress === 0 && !isMapDownloaded ? (
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
              id="btn-start-offline-download"
            >
              <DownloadCloud size={13} /> Download Pack
            </button>
          ) : downloadProgress > 0 && downloadProgress < 100 ? (
            <div className="text-right">
              <span className="text-xs font-bold text-indigo-600 font-mono">{downloadProgress}%</span>
              <span className="block text-[9px] text-slate-400 font-mono">Caching...</span>
            </div>
          ) : (
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              id="btn-redownload-pack"
            >
              <DownloadCloud size={13} /> Update Pack
            </button>
          )}
        </div>

        {/* Progress Bar Animation */}
        {downloadProgress > 0 && downloadProgress < 100 && (
          <div className="space-y-1">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-150"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <span className="text-[9.5px] text-slate-400 font-mono flex items-center gap-1">
              <Info size={11} /> Storing offline map grid vectors into browser memory (IndexedDB/CacheStorage)
            </span>
          </div>
        )}

        {/* Benefits Explanations */}
        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
            <span className="font-bold text-slate-700 block">Subway Proof</span>
            <p className="text-[10px] text-slate-500 leading-snug">
              Keep checking bus timetables and active stations even deep inside subway tunnels with no network.
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
            <span className="font-bold text-slate-700 block">Dijkstra Routing</span>
            <p className="text-[10px] text-slate-500 leading-snug">
              Find alternative transfers offline using our compiled graph-search database stored directly on-device.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
