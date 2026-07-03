import React, { useState } from 'react';
import { TransitAlert, TransitRoute } from '../types';
import { transitRoutes } from '../transitData';
import { AlertTriangle, Plus, BellRing, Info, ShieldAlert, CheckCircle, Flame } from 'lucide-react';

interface LiveAlertsProps {
  alerts: TransitAlert[];
  onAddAlert: (alert: TransitAlert) => void;
  onClearAlert: (id: string) => void;
}

export default function LiveAlerts({ alerts, onAddAlert, onClearAlert }: LiveAlertsProps) {
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportRouteId, setReportRouteId] = useState<string>('');
  const [reportSeverity, setReportSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [reportMessage, setReportMessage] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle || !reportMessage) return;

    const newAlert: TransitAlert = {
      id: `alert-user-${Date.now()}`,
      routeId: reportRouteId || undefined,
      type: 'delay',
      severity: reportSeverity,
      title: reportTitle,
      message: reportMessage,
      timestamp: 'Just Now',
    };

    onAddAlert(newAlert);
    
    // Reset form
    setReportTitle('');
    setReportRouteId('');
    setReportSeverity('medium');
    setReportMessage('');
    setIsFormOpen(false);
  };

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'all') return true;
    return a.severity === severityFilter;
  });

  const getSeverityStyle = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'border-rose-200 bg-rose-50/70 text-rose-900 shadow-rose-100/20';
      case 'medium':
        return 'border-amber-200 bg-amber-50/70 text-amber-900 shadow-amber-100/20';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-800';
    }
  };

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-100 text-rose-800 flex items-center gap-1 uppercase tracking-wider animate-pulse"><Flame size={10} /> Critical</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800 flex items-center gap-1 uppercase tracking-wider"><AlertTriangle size={10} /> Advisory</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-200 text-slate-700 uppercase tracking-wider">Minor</span>;
    }
  };

  return (
    <div className="space-y-4" id="live-alerts-section">
      
      {/* 1. SEVERITY FILTERS */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 flex-wrap">
        <div className="flex gap-1.5 text-xs">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
              severityFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter('high')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
              severityFilter === 'high'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setSeverityFilter('medium')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
              severityFilter === 'medium'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-600 border-slate-200 hover:bg-amber-50'
            }`}
          >
            Advisories
          </button>
        </div>

        {/* Report incident button toggle */}
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
          id="btn-report-incident"
        >
          <Plus size={14} />
          Report Obstruction
        </button>
      </div>

      {/* 2. REPORT INCIDENT MODAL FORM */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5 shadow-inner transition-all animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert size={14} className="text-indigo-600" /> Report Traffic Obstruction
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-[11px] font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Title</label>
              <input
                type="text"
                placeholder="e.g., Heavy Traffic Block"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
                id="input-alert-title"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Affecting Route</label>
              <select
                value={reportRouteId}
                onChange={(e) => setReportRouteId(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                id="select-alert-route"
              >
                <option value="">General Network</option>
                {transitRoutes.map(r => (
                  <option key={r.id} value={r.id}>Line {r.shortName} ({r.type})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Severity Level</label>
              <select
                value={reportSeverity}
                onChange={(e) => setReportSeverity(e.target.value as any)}
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                id="select-alert-severity"
              >
                <option value="low">Minor Announcement</option>
                <option value="medium">Medium Delay</option>
                <option value="high">Critical Hold</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition shadow cursor-pointer"
                id="btn-submit-incident"
              >
                Broadcast Alert
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detailed Description</label>
            <textarea
              placeholder="Provide exact crossroads and estimated delay for incoming commuters..."
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-16"
              required
              id="input-alert-desc"
            />
          </div>
        </form>
      )}

      {/* 3. ALERTS LIST */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-white text-center text-slate-400 text-xs">
            No active transit alerts found for this severity.
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const affectedRoute = transitRoutes.find(r => r.id === alert.routeId);

            return (
              <div
                key={alert.id}
                className={`p-3.5 border rounded-xl shadow-sm transition flex gap-3 ${getSeverityStyle(alert.severity)}`}
                id={`alert-card-${alert.id}`}
              >
                {/* Visual Icon indicator */}
                <div className="shrink-0 pt-0.5">
                  <div className={`p-2 rounded-lg ${
                    alert.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <BellRing size={16} />
                  </div>
                </div>

                {/* Card Text details */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tracking-tight">{alert.title}</span>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{alert.timestamp}</span>
                  </div>

                  <p className="text-xs opacity-90 leading-relaxed font-sans">{alert.message}</p>

                  {/* Route link badge */}
                  <div className="flex items-center justify-between pt-1">
                    {affectedRoute ? (
                      <div className="flex items-center gap-1 text-[10.5px]">
                        <span className="text-slate-400 font-mono">Applies to:</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white font-mono"
                          style={{ backgroundColor: affectedRoute.color }}
                        >
                          {affectedRoute.shortName} Line
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Info size={11} /> General Network Bulletin
                      </span>
                    )}

                    <button
                      onClick={() => onClearAlert(alert.id)}
                      className="text-[10px] text-slate-400 hover:text-indigo-600 transition font-bold"
                      id={`clear-alert-btn-${alert.id}`}
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
