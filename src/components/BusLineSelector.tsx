import React from 'react';
import { TransitStop, TransitRoute, LiveBus } from '../types';
import { transitStops, transitRoutes } from '../transitData';
import { calculateETAForStop } from '../transitUtils';
import { Bus, Users, Clock, ShieldCheck, MapPin, AlertTriangle, Bell, BellOff, Info } from 'lucide-react';

interface BusLineSelectorProps {
  routes: TransitRoute[];
  stops: TransitStop[];
  buses: LiveBus[];
  selectedRoute: TransitRoute | null;
  selectedStop: TransitStop | null;
  onSelectRoute: (route: TransitRoute | null) => void;
  onSelectStop: (stop: TransitStop | null) => void;
  notificationsSubscribed: { busId: string; stopId: string; triggerMinutes: number }[];
  onToggleNotification: (busId: string, stopId: string) => void;
}

export default function BusLineSelector({
  routes,
  stops,
  buses,
  selectedRoute,
  selectedStop,
  onSelectRoute,
  onSelectStop,
  notificationsSubscribed,
  onToggleNotification,
}: BusLineSelectorProps) {
  
  // Find buses active on the selected route
  const activeBuses = buses.filter(b => b.routeId === selectedRoute?.id);

  // Helper to describe occupancy based on load factor
  const getLoadText = (factor: number) => {
    if (factor < 30) return { label: 'Many Seats Available', color: 'text-emerald-600 bg-emerald-50' };
    if (factor < 60) return { label: 'Moderate Seating', color: 'text-sky-600 bg-sky-50' };
    if (factor < 85) return { label: 'Standing Room Only', color: 'text-amber-600 bg-amber-50' };
    return { label: 'Near Capacity', color: 'text-red-600 bg-red-50' };
  };

  return (
    <div className="space-y-5" id="bus-line-selector-section">
      
      {/* 1. HORIZONTAL BUS LINE CHIPS */}
      <div className="grid grid-cols-2 gap-2">
        {routes.map(r => {
          const isSelected = selectedRoute?.id === r.id;
          const activeCount = buses.filter(b => b.routeId === r.id).length;

          return (
            <button
              key={r.id}
              onClick={() => onSelectRoute(isSelected ? null : r)}
              className={`p-3 rounded-xl border text-left transition duration-200 cursor-pointer ${
                isSelected
                  ? 'border-slate-800 bg-slate-900 text-white shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
              id={`route-chip-${r.id}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: r.color }}
                ></span>
                <span className={`text-[10.5px] font-bold tracking-wider uppercase opacity-75 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                  {r.type} Line
                </span>
              </div>
              <div className={`text-sm font-black font-sans leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                {r.shortName} - {r.name.split(' - ')[1]}
              </div>
              <div className={`text-[10px] font-mono mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                {activeCount} active vehicles
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. ROUTE DETAILS & LINEAR TIMELINE (IF SELECTED) */}
      {selectedRoute ? (
        <div className="space-y-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          
          {/* Header Quick Stats */}
          <div className="grid grid-cols-3 gap-2.5 text-center pb-3 border-b border-slate-100 text-[11px] font-mono">
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Frequency</span>
              <span className="font-extrabold text-slate-700">{selectedRoute.scheduleInterval} mins</span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Ticket Fare</span>
              <span className="font-extrabold text-slate-700">${selectedRoute.fare.toFixed(2)}</span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Accessibility</span>
              <span className="font-extrabold text-emerald-600">Adaptive Ramps</span>
            </div>
          </div>

          {/* Active Buses Panel */}
          {activeBuses.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bus size={12} /> Active Vehicles En-Route
              </h4>
              <div className="grid gap-2">
                {activeBuses.map(bus => {
                  const capacityInfo = getLoadText(bus.loadFactor);
                  return (
                    <div
                      key={bus.id}
                      className="p-2.5 border border-slate-100 bg-slate-50/50 rounded-lg flex items-center justify-between text-xs transition hover:bg-slate-50"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-700">{bus.vehicleNumber}</span>
                          <span className={`px-1 py-0.2 text-[9px] font-semibold rounded ${
                            bus.status === 'On Time' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {bus.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Speed: {bus.speed.toFixed(0)} km/h • Heading: {bus.heading.toFixed(0)}°
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${capacityInfo.color}`}>
                          {capacityInfo.label} ({bus.loadFactor}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VERTICAL TRANSIT TIMELINE */}
          <div className="pt-2 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Clock size={12} /> Linear Stop Timeline & Live ETAs
            </h4>

            <div className="relative pl-6 space-y-5">
              {/* Vertical connecting line */}
              <div
                className="absolute left-[9.5px] top-1.5 bottom-1.5 w-[3px] rounded-full"
                style={{ backgroundColor: selectedRoute.color }}
              ></div>

              {selectedRoute.stops.map((stopId, idx) => {
                const stop = stops.find(s => s.id === stopId);
                if (!stop) return null;

                const isStopSelected = selectedStop?.id === stop.id;

                // Find the nearest bus on this route heading towards this stop
                // Filter buses en-route on this route
                const routeBuses = buses.filter(b => b.routeId === selectedRoute.id);
                
                // For simplicity, find the minimum ETA computed among active buses
                const etas = routeBuses.map(bus => ({
                  busId: bus.id,
                  vehicleNumber: bus.vehicleNumber,
                  eta: calculateETAForStop(bus, stopId)
                })).sort((a, b) => a.eta - b.eta);

                const nextArrival = etas[0];
                const subsequentArrival = etas[1];

                const isSubscribed = nextArrival
                  ? notificationsSubscribed.some(n => n.busId === nextArrival.busId && n.stopId === stopId)
                  : false;

                return (
                  <div
                    key={stop.id}
                    onClick={() => onSelectStop(stop)}
                    className={`relative p-2 rounded-lg cursor-pointer transition ${
                      isStopSelected ? 'bg-indigo-50/40 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                    id={`timeline-stop-${stop.id}`}
                  >
                    {/* Circle Node indicator */}
                    <span
                      className="absolute -left-[21.5px] top-4.5 w-4 h-4 rounded-full border-[2.5px] border-white flex items-center justify-center shadow"
                      style={{ backgroundColor: selectedRoute.color }}
                    >
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </span>

                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 block hover:text-indigo-600 transition">
                          {stop.name.split(' (')[0]}
                        </span>
                        
                        {/* Interactive ETAs */}
                        {nextArrival ? (
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-[10.5px]">
                            <span className="text-emerald-600 font-bold">
                              {nextArrival.eta <= 1 ? 'Approaching now' : `${nextArrival.eta} mins`}
                            </span>
                            <span className="text-slate-400">({nextArrival.vehicleNumber})</span>
                            {subsequentArrival && (
                              <span className="text-slate-400 border-l border-slate-200 pl-2">
                                Next: {subsequentArrival.eta}m
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">No active buses at this hour</span>
                        )}
                      </div>

                      {/* Notification Alert Bell */}
                      {nextArrival && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleNotification(nextArrival.busId, stopId);
                          }}
                          className={`p-1.5 rounded-lg border transition ${
                            isSubscribed
                              ? 'bg-sky-50 border-sky-200 text-sky-600 shadow-sm animate-pulse'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                          title={isSubscribed ? "Disable arrival notification" : "Notify me when approaching"}
                        >
                          {isSubscribed ? <Bell size={13} className="fill-sky-100" /> : <BellOff size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-white text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Bus size={18} />
          </div>
          <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
            Choose any transit line above to view running vehicles, monitor schedules, and see dynamic station arrival times updated live!
          </p>
        </div>
      )}
    </div>
  );
}
