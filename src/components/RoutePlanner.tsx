import React, { useState, useEffect } from 'react';
import { TransitStop, TransitRoute, TripPlan } from '../types';
import { transitStops, transitRoutes } from '../transitData';
import { planTrip } from '../transitUtils';
import { ArrowLeftRight, Navigation, MapPin, DollarSign, Leaf, Clock, ArrowRight, Eye, Sparkles } from 'lucide-react';

interface RoutePlannerProps {
  stops: TransitStop[];
  routes: TransitRoute[];
  selectedStop: TransitStop | null;
  searchStartStop: string;
  searchEndStop: string;
  onSetStartStop: (stopId: string) => void;
  onSetEndStop: (stopId: string) => void;
  onSelectRoute: (route: TransitRoute | null) => void;
  onHighlightStops: (stopIds: string[]) => void;
}

export default function RoutePlanner({
  stops,
  routes,
  selectedStop,
  searchStartStop,
  searchEndStop,
  onSetStartStop,
  onSetEndStop,
  onSelectRoute,
  onHighlightStops,
}: RoutePlannerProps) {
  const [plans, setPlans] = useState<TripPlan[]>([]);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState<number | null>(null);
  const [activeTripStep, setActiveTripStep] = useState<number | null>(null);

  // Re-calculate plans when start or end stop changes
  useEffect(() => {
    if (searchStartStop && searchEndStop) {
      const computedPlans = planTrip(searchStartStop, searchEndStop);
      setPlans(computedPlans);
      setSelectedPlanIdx(computedPlans.length > 0 ? 0 : null);
    } else {
      setPlans([]);
      setSelectedPlanIdx(null);
    }
  }, [searchStartStop, searchEndStop]);

  const handleSwap = () => {
    const temp = searchStartStop;
    onSetStartStop(searchEndStop);
    onSetEndStop(temp);
  };

  const handleSelectPlan = (idx: number) => {
    setSelectedPlanIdx(idx);
    const plan = plans[idx];
    if (plan && plan.routes.length > 0) {
      // Find the first transit route and highlight it
      const routeId = plan.routes[0].routeId;
      const matchedRoute = routes.find(r => r.id === routeId);
      if (matchedRoute) {
        onSelectRoute(matchedRoute);
      }
      
      // Highlight all stops involved
      const stopsToHighlight = plan.routes.reduce<string[]>((acc, curr) => {
        if (!acc.includes(curr.startStopId)) acc.push(curr.startStopId);
        if (!acc.includes(curr.endStopId)) acc.push(curr.endStopId);
        return acc;
      }, []);
      onHighlightStops(stopsToHighlight);
    }
  };

  const setAsStart = () => {
    if (selectedStop) {
      onSetStartStop(selectedStop.id);
    }
  };

  const setAsEnd = () => {
    if (selectedStop) {
      onSetEndStop(selectedStop.id);
    }
  };

  return (
    <div className="space-y-5" id="route-planner-section">
      
      {/* 1. Quick Pin Tool from Map selection */}
      {selectedStop && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900 transition-all">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-indigo-600 animate-bounce" />
            <span>Selected: <strong>{selectedStop.name.split(' (')[0]}</strong></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={setAsStart}
              className="px-2.5 py-1 bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-lg font-medium transition cursor-pointer"
              id="planner-btn-setstart"
            >
              Set Start
            </button>
            <button
              onClick={setAsEnd}
              className="px-2.5 py-1 bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-lg font-medium transition cursor-pointer"
              id="planner-btn-setend"
            >
              Set End
            </button>
          </div>
        </div>
      )}

      {/* 2. Start & End Selection Controls */}
      <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl relative space-y-3 shadow-inner">
        
        {/* Start Station Selector */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
          <MapPin size={16} className="text-emerald-500 shrink-0" />
          <div className="flex-1">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Starting Stop</label>
            <select
              value={searchStartStop}
              onChange={(e) => onSetStartStop(e.target.value)}
              className="w-full text-slate-800 text-xs font-medium focus:outline-none bg-transparent cursor-pointer"
              id="select-start-stop"
            >
              <option value="">Choose origin stop...</option>
              {stops.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Floating Swap Button */}
        <div className="absolute right-8 top-1/2 -translate-y-[40%] z-10">
          <button
            onClick={handleSwap}
            className="p-2 bg-white text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-full shadow-md hover:shadow-lg transition-all transform hover:rotate-180 duration-300 cursor-pointer"
            title="Swap Origin and Destination"
            id="planner-btn-swap"
          >
            <ArrowLeftRight size={14} />
          </button>
        </div>

        {/* Destination Station Selector */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
          <Navigation size={16} className="text-red-500 shrink-0 rotate-45" />
          <div className="flex-1">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Destination Stop</label>
            <select
              value={searchEndStop}
              onChange={(e) => onSetEndStop(e.target.value)}
              className="w-full text-slate-800 text-xs font-medium focus:outline-none bg-transparent cursor-pointer"
              id="select-end-stop"
            >
              <option value="">Choose destination stop...</option>
              {stops.map(s => (
                <option key={s.id} value={s.id} disabled={s.id === searchStartStop}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. TRIP PLANS LIST */}
      {searchStartStop && searchEndStop && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Connections</h3>
          
          {plans.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-white text-slate-400 text-xs">
              No matching direct or transfer routes found between these locations.
            </div>
          ) : (
            plans.map((plan, idx) => {
              const isSelected = selectedPlanIdx === idx;
              const isMultiLeg = plan.routes.length > 1;

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectPlan(idx)}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-500/10 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                  id={`trip-plan-card-${idx}`}
                >
                  {/* Title & Timing info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-800 font-mono tracking-tight">{plan.totalDuration} mins</span>
                      {isMultiLeg && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-semibold rounded uppercase tracking-wider">
                          1 Transfer
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-700 font-mono">${plan.totalFare.toFixed(2)}</span>
                  </div>

                  {/* Route icons visualization (Legs) */}
                  <div className="flex items-center gap-2 mb-3.5 overflow-hidden">
                    {plan.routes.map((leg, legIdx) => {
                      const r = transitRoutes.find(route => route.id === leg.routeId);
                      return (
                        <React.Fragment key={legIdx}>
                          {legIdx > 0 && <ArrowRight size={12} className="text-slate-300 shrink-0" />}
                          <div
                            className="px-2 py-1 text-[10px] font-bold text-white rounded-md shrink-0 flex items-center gap-1.5"
                            style={{ backgroundColor: r?.color || '#cbd5e1' }}
                          >
                            <span>Line {r?.shortName}</span>
                            <span className="text-[9px] font-normal opacity-90">({leg.stopsCount} stops)</span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Eco-savings & active routing */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[10.5px]">
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <Leaf size={12} className="fill-emerald-50" />
                      <span>Saves {plan.carbonSaved}kg CO₂</span>
                    </div>
                    {isSelected && (
                      <span className="text-indigo-600 font-semibold flex items-center gap-1 animate-pulse">
                        <Sparkles size={11} /> Selected Option
                      </span>
                    )}
                  </div>

                  {/* Interactive Step-by-Step Guidance (if selected) */}
                  {isSelected && (
                    <div className="mt-4 pt-3.5 border-t border-slate-200/60 space-y-3.5">
                      <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Active Travel Steps</h4>
                      <div className="relative border-l-2 border-dashed border-slate-200 pl-4 ml-2 space-y-4 text-xs text-slate-600">
                        
                        {plan.routes.map((leg, legIdx) => {
                          const r = transitRoutes.find(route => route.id === leg.routeId);
                          const origin = transitStops.find(st => st.id === leg.startStopId);
                          const destination = transitStops.find(st => st.id === leg.endStopId);

                          return (
                            <div key={legIdx} className="relative space-y-1">
                              {/* Step Node Dot */}
                              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white"></span>
                              
                              <p className="text-slate-800 font-medium">
                                Board <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white font-mono" style={{ backgroundColor: r?.color }}>{r?.shortName} {r?.type}</span> at <span className="text-indigo-950 font-semibold">{origin?.name.split(' (')[0]}</span>
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Ride {leg.stopsCount} stops ({leg.duration} mins) • Departures {leg.departureTime}
                              </p>
                              
                              {/* Transfer warning / walking */}
                              {legIdx < plan.routes.length - 1 && (
                                <div className="py-2.5 my-1 px-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-[11px] font-mono">
                                  🔄 Transfer at <strong>Central Terminal</strong> (Allow 5 mins walking)
                                </div>
                              )}

                              {/* Terminal destination node */}
                              {legIdx === plan.routes.length - 1 && (
                                <div className="relative pt-2.5">
                                  <span className="absolute -left-[21px] top-3.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-white"></span>
                                  <p className="text-slate-800 font-medium">
                                    Arrive at <span className="text-indigo-950 font-semibold">{destination?.name.split(' (')[0]}</span>
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    Total estimated transit time: {plan.totalDuration} mins
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}

                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. Empty State Instructions */}
      {(!searchStartStop || !searchEndStop) && (
        <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-white text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Navigation size={18} className="rotate-45" />
          </div>
          <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
            Select a bus stop on the map or choose stations above to instantly plan your transit route, estimate fares, and calculate real-time ETAs.
          </p>
        </div>
      )}
    </div>
  );
}
