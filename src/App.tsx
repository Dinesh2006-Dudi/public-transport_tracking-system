import React, { useState, useEffect, useRef } from 'react';
import { TransitStop, TransitRoute, LiveBus, TransitAlert } from './types';
import { transitStops, transitRoutes, initialAlerts } from './transitData';
import { generateInitialBuses, updateBuses, calculateETAForStop } from './transitUtils';
import TransitMap from './components/TransitMap';
import RoutePlanner from './components/RoutePlanner';
import BusLineSelector from './components/BusLineSelector';
import LiveAlerts from './components/LiveAlerts';
import OfflineManager from './components/OfflineManager';
import {
  Compass, Map, AlertTriangle, DownloadCloud, Radio, Users, Check,
  Clock, Heart, Bell, MessageSquare, ShieldCheck, HelpCircle, Star, Sparkles,
  Wifi, WifiOff
} from 'lucide-react';

export default function App() {
  // --- 1. CORE APPLICATIONS STATES ---
  const [buses, setBuses] = useState<LiveBus[]>([]);
  const [alerts, setAlerts] = useState<TransitAlert[]>(initialAlerts);
  const [selectedStop, setSelectedStop] = useState<TransitStop | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TransitRoute | null>(null);
  const [selectedBus, setSelectedBus] = useState<LiveBus | null>(null);
  const [searchStartStop, setSearchStartStop] = useState<string>('');
  const [searchEndStop, setSearchEndStop] = useState<string>('');

  // --- 2. OFFLINE & CUSTOMIZATION STATES ---
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isMapDownloaded, setIsMapDownloaded] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [favoriteStops, setFavoriteStops] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'planner' | 'lines' | 'alerts' | 'offline'>('lines');
  const [headerSearchQuery, setHeaderSearchQuery] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  
  // --- 3. TOAST NOTIFICATION ENGINE STATES ---
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: 'info' | 'success' | 'alert' }[]>([]);
  const [notificationsSubscribed, setNotificationsSubscribed] = useState<{ busId: string; stopId: string; triggerMinutes: number }[]>([]);

  // Seed initial buses on component mount
  useEffect(() => {
    setBuses(generateInitialBuses());
    // Load favorites from local storage if any exist
    const savedFavs = localStorage.getItem('metro_favorite_stops');
    if (savedFavs) {
      try {
        setFavoriteStops(JSON.parse(savedFavs));
      } catch (e) {
        console.error("Error reading favorite stops from local storage", e);
      }
    }
  }, []);

  // --- 4. REAL-TIME SIMULATION LOOP ---
  useEffect(() => {
    const timer = setInterval(() => {
      setBuses(prevBuses => {
        const nextBuses = updateBuses(prevBuses, 0.012); // smooth incremental delta

        // Check proximity alerts for user subscriptions
        notificationsSubscribed.forEach(sub => {
          const matchingBus = nextBuses.find(b => b.id === sub.busId);
          if (matchingBus) {
            const currentETA = calculateETAForStop(matchingBus, sub.stopId);
            
            // If the bus is 2 minutes or less away, fire the toast and unsubscribe
            if (currentETA <= 2) {
              const stopObj = transitStops.find(s => s.id === sub.stopId);
              const routeObj = transitRoutes.find(r => r.id === matchingBus.routeId);
              
              triggerToast(
                '🔔 Arrival Reminder!',
                `Line ${routeObj?.shortName || ''} (${matchingBus.vehicleNumber}) is approaching ${stopObj?.name.split(' (')[0] || 'your stop'}! Estimated arrival: ${currentETA <= 1 ? 'Approaching now' : 'under 2 minutes'}.`,
                'success'
              );

              // Auto-remove subscription so it doesn't spam toasts
              setNotificationsSubscribed(prevSubs => prevSubs.filter(s => !(s.busId === sub.busId && s.stopId === sub.stopId)));
            }
          }
        });

        // If a bus is selected, update its referenced state coordinates live
        if (selectedBus) {
          const updatedSelectedBus = nextBuses.find(b => b.id === selectedBus.id);
          if (updatedSelectedBus) {
            setSelectedBus(updatedSelectedBus);
          }
        }

        return nextBuses;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [notificationsSubscribed, selectedBus]);

  // --- 5. TOAST ACTIONS ---
  const triggerToast = (title: string, message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const newToast = { id: `toast-${Date.now()}-${Math.random()}`, title, message, type };
    setToasts(prev => [newToast, ...prev]);

    // Auto clear toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- 6. USER-LEVEL ACTIONS ---
  const handleToggleFavorite = (stopId: string) => {
    let updated: string[] = [];
    if (favoriteStops.includes(stopId)) {
      updated = favoriteStops.filter(id => id !== stopId);
      triggerToast('Removed from Favorites', 'Stop removed from your dashboard quick-access.', 'info');
    } else {
      updated = [...favoriteStops, stopId];
      triggerToast('Added to Favorites', 'Stop saved. It will remain pinned in your local profile.', 'success');
    }
    setFavoriteStops(updated);
    localStorage.setItem('metro_favorite_stops', JSON.stringify(updated));
  };

  // Triggering the offline map progress bar downloader
  const handleStartDownload = () => {
    if (downloadProgress > 0) return; // already downloading
    setDownloadProgress(1);
    setIsMapDownloaded(false);

    let progress = 1;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsMapDownloaded(true);
        setDownloadProgress(0);
        triggerToast('Database Caching Complete!', 'Downloaded 14.2MB of vector maps and offline timetables successfully.', 'success');
      } else {
        setDownloadProgress(progress);
      }
    }, 250);
  };

  const handleToggleOfflineMode = (offline: boolean) => {
    if (offline && !isMapDownloaded) {
      triggerToast('Download Required', 'Please complete the Offline storage pack caching first!', 'alert');
      return;
    }
    setIsOfflineMode(offline);
    if (offline) {
      triggerToast('Entered Offline Mode', 'Municipal API suspended. Loading offline vectors and timetables.', 'alert');
    } else {
      triggerToast('Online Mode Restored', 'Re-established satellite API link and real-time transit telemetry.', 'success');
    }
  };

  const handleAddAlert = (newAlert: TransitAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
    triggerToast('Broadcast Success', `Service advisory broadcasted successfully for ${newAlert.routeId ? 'Line' : 'General network'}.`, 'success');
  };

  const handleClearAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    triggerToast('Bulletin Dismissed', 'You have acknowledged and archived this service alert.', 'info');
  };

  const handleToggleNotification = (busId: string, stopId: string) => {
    const isSubscribed = notificationsSubscribed.some(n => n.busId === busId && n.stopId === stopId);
    
    if (isSubscribed) {
      setNotificationsSubscribed(prev => prev.filter(n => !(n.busId === busId && n.stopId === stopId)));
      triggerToast('Proximity Alarm Disabled', 'Notification subscription cancelled.', 'info');
    } else {
      setNotificationsSubscribed(prev => [...prev, { busId, stopId, triggerMinutes: 2 }]);
      const stopObj = transitStops.find(s => s.id === stopId);
      triggerToast(
        '🔔 Proximity Alarm Set',
        `We will notify you immediately when this vehicle gets within 2 minutes of ${stopObj?.name.split(' (')[0]}.`,
        'success'
      );
    }
  };

  const handleSetRoutingStop = (stopId: string, role: 'start' | 'end') => {
    if (role === 'start') {
      setSearchStartStop(stopId);
      triggerToast('Origin Set', 'Stop configured as your trip starting point.', 'info');
    } else {
      setSearchEndStop(stopId);
      triggerToast('Destination Set', 'Stop configured as your trip destination.', 'info');
    }
    setActiveTab('planner');
  };

  // Helper: Clear selected node filters
  const handleClearSelected = () => {
    setSelectedStop(null);
    setSelectedBus(null);
  };

  // --- 7. RENDERING ACTIVE INSPECTORS ---
  const renderInspector = () => {
    if (selectedStop) {
      const isFav = favoriteStops.includes(selectedStop.id);
      return (
        <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-xl border border-slate-800 animate-fadeIn" id="stop-inspector-panel">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[9px] font-bold uppercase tracking-wider">
                Transit Station
              </span>
              <h3 className="text-base font-black tracking-tight text-white leading-tight">
                {selectedStop.name}
              </h3>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Favorite toggle */}
              <button
                onClick={() => handleToggleFavorite(selectedStop.id)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isFav ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Add to Favorite Station"
              >
                <Star size={14} className={isFav ? "fill-slate-950" : ""} />
              </button>
              <button
                onClick={handleClearSelected}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition text-xs font-bold font-mono"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Route connections badges */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connecting Lines</h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedStop.routes.map(routeId => {
                const r = transitRoutes.find(route => route.id === routeId);
                if (!r) return null;
                const isRouteSelected = selectedRoute?.id === r.id;

                return (
                  <button
                    key={routeId}
                    onClick={() => setSelectedRoute(isRouteSelected ? null : r)}
                    className={`px-2.5 py-1 text-[10px] font-bold text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      isRouteSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: r.color }}
                  >
                    <span>Line {r.shortName}</span>
                    <span className="text-[8.5px] font-normal opacity-85">({r.type})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amenities checklist */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Station Amenities</h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedStop.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10.5px] rounded-md flex items-center gap-1 border border-slate-800"
                >
                  <Check size={11} className="text-sky-400" />
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          {/* Directional routing buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-xs">
            <button
              onClick={() => handleSetRoutingStop(selectedStop.id, 'start')}
              className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
              id="inspector-btn-start"
            >
              <Compass size={13} /> Set as Start
            </button>
            <button
              onClick={() => handleSetRoutingStop(selectedStop.id, 'end')}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
              id="inspector-btn-end"
            >
              <Map size={13} /> Set as End
            </button>
          </div>
        </div>
      );
    }

    if (selectedBus) {
      const route = transitRoutes.find(r => r.id === selectedBus.routeId);
      const nextStop = transitStops.find(s => s.id === selectedBus.nextStopId);
      const capacityText = selectedBus.loadFactor < 40 ? 'Low' : selectedBus.loadFactor < 75 ? 'Moderate' : 'High';
      const capacityColor = selectedBus.loadFactor < 40 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : selectedBus.loadFactor < 75 ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

      return (
        <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-xl border border-slate-800 animate-fadeIn" id="bus-inspector-panel">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase text-white font-mono" style={{ backgroundColor: route?.color }}>
                  Line {route?.shortName}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {selectedBus.vehicleNumber}
                </span>
              </div>
              <h3 className="text-base font-black tracking-tight text-white leading-tight">
                {route?.name.split(' - ')[1]}
              </h3>
            </div>
            
            <button
              onClick={handleClearSelected}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition text-xs font-bold font-mono"
            >
              ✕
            </button>
          </div>

          {/* Running indicators */}
          <div className="grid grid-cols-2 gap-3 py-1 text-xs">
            <div className="p-2.5 bg-slate-800/60 rounded-xl space-y-0.5 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold tracking-wider uppercase">Live Speed</span>
              <span className="text-sm font-black text-white font-mono">{selectedBus.speed.toFixed(0)} km/h</span>
            </div>
            <div className="p-2.5 bg-slate-800/60 rounded-xl space-y-0.5 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold tracking-wider uppercase">Punctuality</span>
              <span className={`text-sm font-black font-mono ${selectedBus.status === 'On Time' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedBus.status === 'On Time' ? 'On Time' : `Delayed +${selectedBus.delayMinutes}m`}
              </span>
            </div>
          </div>

          {/* Capacity gauge */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Passenger Load Factor</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md ${capacityColor}`}>
                {capacityText} ({selectedBus.loadFactor}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${selectedBus.loadFactor}%`,
                  backgroundColor: route?.color || '#3b82f6'
                }}
              ></div>
            </div>
          </div>

          {/* Upcoming Stop arrival countdown */}
          {nextStop && (
            <div className="p-3 bg-slate-950/40 border border-slate-900/40 rounded-xl space-y-1">
              <span className="text-[9.5px] font-bold text-blue-400 uppercase tracking-wider block">Approaching Next Station</span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{nextStop.name.split(' (')[0]}</span>
                <span className="font-mono text-emerald-400 font-extrabold text-sm">
                  {calculateETAForStop(selectedBus, nextStop.id) <= 1 ? 'Arriving Now' : `${calculateETAForStop(selectedBus, nextStop.id)} mins`}
                </span>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleToggleNotification(selectedBus.id, nextStop.id)}
                  className="px-2.5 py-1 text-[10.5px] bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg flex items-center gap-1.5 transition font-semibold"
                >
                  <Bell size={11} /> Pin Alarm Reminder
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default State - Help & Summary
    return (
      <div className="p-5 border border-slate-200 rounded-2xl space-y-4 bg-white shadow-sm font-sans" id="transit-help-panel">
        <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
          <Sparkles size={16} className="text-blue-600 shrink-0" />
          <span>Metro City Information Desk</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Welcome to the Public Transport Tracker. Explore schedules, route networks, and live ETA countdowns for Metro City:
        </p>

        <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-700 font-medium">
          <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5 border border-slate-100">
            <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wide font-mono">4 Lines</span>
            <p className="text-[11px] text-slate-500 leading-snug">Full Express & Outer loop circle links</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5 border border-slate-100">
            <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wide font-mono">7 Terminals</span>
            <p className="text-[11px] text-slate-500 leading-snug">Equipped with ticket kiosks & Wi-Fi</p>
          </div>
        </div>

        {favoriteStops.length > 0 && (
          <div className="space-y-1.5 pt-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Star size={11} className="fill-amber-400 text-amber-500" /> My Pinned Stations
            </h4>
            <div className="grid gap-1.5">
              {favoriteStops.map(id => {
                const stopObj = transitStops.find(s => s.id === id);
                if (!stopObj) return null;
                return (
                  <div
                    key={id}
                    onClick={() => setSelectedStop(stopObj)}
                    className="p-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-100 border border-slate-100 rounded-xl text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="font-semibold text-slate-800">{stopObj.name.split(' (')[0]}</span>
                    <span className="text-[9px] font-mono text-slate-400">Lines: {stopObj.routes.map(r => r.split('-')[1].toUpperCase()).join(', ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- 8. PRIMARY APP VIEW ---
  const filteredHeaderStops = headerSearchQuery
    ? transitStops.filter(s => s.name.toLowerCase().includes(headerSearchQuery.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased" id="main-app-root">
      
      {/* 1. TOP NAVIGATION HEADER (PROFESSIONAL POLISH TRANSITFLOW STYLING) */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 md:px-6 shrink-0 shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11.05a2.5 2.5 0 014.9 0H17a1 1 0 001-1V5a1 1 0 00-1-1H3z"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight leading-none text-white">TransitFlow</span>
            <span className="text-[9.5px] text-blue-400 font-bold tracking-widest mt-0.5 uppercase">Metrolink Live</span>
          </div>
        </div>

        {/* Interactive Search Autocomplete */}
        <div className="flex-1 max-w-lg px-4 md:px-12 relative hidden sm:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for station, route, or destination..."
              value={headerSearchQuery}
              onChange={(e) => {
                setHeaderSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-xs text-white focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 focus:outline-none"
              id="header-stop-search"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          {/* Autocomplete Dropdown list */}
          {showSearchDropdown && filteredHeaderStops.length > 0 && (
            <div className="absolute left-4 right-4 md:left-12 md:right-12 mt-1.5 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fadeIn max-h-60 overflow-y-auto">
              <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Matching Stations ({filteredHeaderStops.length})
              </div>
              {filteredHeaderStops.map(stop => (
                <button
                  key={stop.id}
                  onClick={() => {
                    setSelectedStop(stop);
                    setHeaderSearchQuery('');
                    setShowSearchDropdown(false);
                    triggerToast('Station Selected', `Centered on ${stop.name.split(' (')[0]}.`, 'success');
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-xs font-semibold flex items-center justify-between border-b border-slate-100/60 last:border-none cursor-pointer"
                >
                  <span className="text-slate-800">{stop.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Lines: {stop.routes.map(r => r.split('-')[1].toUpperCase()).join(', ')}</span>
                </button>
              ))}
            </div>
          )}

          {showSearchDropdown && headerSearchQuery && filteredHeaderStops.length === 0 && (
            <div className="absolute left-4 right-4 md:left-12 md:right-12 mt-1.5 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-4 text-center text-xs text-slate-400 z-50">
              No stations match "{headerSearchQuery}"
            </div>
          )}
        </div>

        {/* Right Side Header Quick Actions and Diagnostics */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <button 
            onClick={() => { setActiveTab('lines'); }} 
            className={`hover:text-blue-400 transition cursor-pointer hidden md:inline-block ${activeTab === 'lines' ? 'text-blue-400 font-bold' : 'text-slate-300'}`}
          >
            Routes
          </button>
          <button 
            onClick={() => { setActiveTab('planner'); }} 
            className={`hover:text-blue-400 transition cursor-pointer hidden md:inline-block ${activeTab === 'planner' ? 'text-blue-400 font-bold' : 'text-slate-300'}`}
          >
            Schedules
          </button>
          <button 
            onClick={() => { setActiveTab('planner'); }} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-bold transition shadow-md shadow-blue-900/20 cursor-pointer text-[11px]"
          >
            Plan Trip
          </button>

          {/* Mini active link stream badge */}
          <div className="ml-2 pl-2 border-l border-slate-800">
            {isOfflineMode ? (
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 block animate-pulse" title="Offline mode active"></span>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse" title="Telesync streaming verified"></span>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT AND CONTAINERS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: THE MAP & LIVE DETAILS NODE (COL 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Map view wrapper */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Interactive Grid Map ({isOfflineMode ? 'Offline local vectors' : 'GPS Tracking Satellite'})
              </h2>
              <span className="text-[10.5px] text-blue-600 font-semibold flex items-center gap-1 font-mono">
                {buses.length} vehicles moving
              </span>
            </div>

            <TransitMap
              stops={transitStops}
              routes={transitRoutes}
              buses={buses}
              selectedStop={selectedStop}
              selectedRoute={selectedRoute}
              selectedBus={selectedBus}
              onSelectStop={setSelectedStop}
              onSelectBus={setSelectedBus}
              isOfflineMode={isOfflineMode}
              favoriteStops={favoriteStops}
              onToggleFavorite={handleToggleFavorite}
              onSetRoutingStop={handleSetRoutingStop}
            />
          </div>

          {/* Node Inspector Panel */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
              Live Station & Fleet Inspector
            </h2>
            {renderInspector()}
          </div>

        </div>

        {/* RIGHT COLUMN: TRANSIT COMMAND PANEL SIDEBAR (COL 5 - PROFESSIONAL POLISH LIGHT AND DARK SIDEBAR) */}
        <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
          
          {/* Sidebar Tabs Headers */}
          <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 p-1">
            <button
              onClick={() => setActiveTab('lines')}
              className={`py-3.5 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'lines'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
              id="tab-btn-lines"
            >
              <Users size={16} />
              <span>Bus Lines</span>
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`py-3.5 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
              id="tab-btn-planner"
            >
              <Compass size={16} />
              <span>Planner</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-3.5 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
              id="tab-btn-alerts"
            >
              <AlertTriangle size={16} />
              <span>Alerts</span>
            </button>
            <button
              onClick={() => setActiveTab('offline')}
              className={`py-3.5 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'offline'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
              id="tab-btn-offline"
            >
              <DownloadCloud size={16} />
              <span>Offline DB</span>
            </button>
          </div>

          {/* Sidebar Active Tab viewport */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[720px]">
            {activeTab === 'lines' && (
              <BusLineSelector
                routes={transitRoutes}
                stops={transitStops}
                buses={buses}
                selectedRoute={selectedRoute}
                selectedStop={selectedStop}
                onSelectRoute={setSelectedRoute}
                onSelectStop={setSelectedStop}
                notificationsSubscribed={notificationsSubscribed}
                onToggleNotification={handleToggleNotification}
              />
            )}

            {activeTab === 'planner' && (
              <RoutePlanner
                stops={transitStops}
                routes={transitRoutes}
                selectedStop={selectedStop}
                searchStartStop={searchStartStop}
                searchEndStop={searchEndStop}
                onSetStartStop={setSearchStartStop}
                onSetEndStop={setSearchEndStop}
                onSelectRoute={setSelectedRoute}
                onHighlightStops={(stopIds) => {
                  if (stopIds.length > 0) {
                    const matchedStop = transitStops.find(s => s.id === stopIds[0]);
                    if (matchedStop) setSelectedStop(matchedStop);
                  }
                }}
              />
            )}

            {activeTab === 'alerts' && (
              <LiveAlerts
                alerts={alerts}
                onAddAlert={handleAddAlert}
                onClearAlert={handleClearAlert}
              />
            )}

            {activeTab === 'offline' && (
              <OfflineManager
                isOfflineMode={isOfflineMode}
                isMapDownloaded={isMapDownloaded}
                downloadProgress={downloadProgress}
                onToggleOffline={handleToggleOfflineMode}
                onStartDownload={handleStartDownload}
              />
            )}
          </div>

        </div>

      </main>

      {/* 3. FLOAT SYSTEM NOTIFICATIONS (TOASTS) PANEL */}
      <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full space-y-2 pointer-events-none" id="toasts-portal">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 pointer-events-auto transition duration-300 animate-slideUp bg-white ${
              toast.type === 'success' 
                ? 'border-emerald-200 bg-emerald-50/95 text-slate-800' 
                : toast.type === 'alert' 
                ? 'border-amber-200 bg-amber-50/95 text-slate-800' 
                : 'border-slate-200 bg-white/95 text-slate-800'
            }`}
          >
            <div className="flex-1 space-y-0.5">
              <span className="text-xs font-bold block text-slate-900">{toast.title}</span>
              <p className="text-[11px] leading-snug text-slate-600 font-sans">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold font-mono px-1 shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* 4. PROFESSIONAL POLISH BOTTOM STATUS BAR */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500 uppercase tracking-tight">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> 
            GPS Satellite Link Active
          </span>
          <span className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> 
            Municipal Server Synchronized
          </span>
          <span className="hidden sm:inline border-l border-slate-200 pl-4">
            Data Revisions: July 2026 UTC
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          System v4.2.1-stable • © 2026 TransitFlow Dispatch Systems
        </div>
      </footer>

    </div>
  );
}
