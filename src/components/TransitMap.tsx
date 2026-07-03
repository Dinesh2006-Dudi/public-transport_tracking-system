import React, { useState, useRef, useEffect } from 'react';
import { TransitStop, TransitRoute, LiveBus } from '../types';
import { transitStops, transitRoutes } from '../transitData';
import { MapPin, Bus, Navigation, Star, RotateCcw, ZoomIn, ZoomOut, Info } from 'lucide-react';

interface TransitMapProps {
  stops: TransitStop[];
  routes: TransitRoute[];
  buses: LiveBus[];
  selectedStop: TransitStop | null;
  selectedRoute: TransitRoute | null;
  selectedBus: LiveBus | null;
  onSelectStop: (stop: TransitStop | null) => void;
  onSelectBus: (bus: LiveBus | null) => void;
  isOfflineMode: boolean;
  favoriteStops: string[];
  onToggleFavorite: (stopId: string) => void;
  onSetRoutingStop: (stopId: string, role: 'start' | 'end') => void;
}

export default function TransitMap({
  stops,
  routes,
  buses,
  selectedStop,
  selectedRoute,
  selectedBus,
  onSelectStop,
  onSelectBus,
  isOfflineMode,
  favoriteStops,
  onToggleFavorite,
  onSetRoutingStop,
}: TransitMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredStop, setHoveredStop] = useState<TransitStop | null>(null);
  const [hoveredBus, setHoveredBus] = useState<LiveBus | null>(null);
  
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Recenter map
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.6));
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    setZoom(prev => Math.max(0.6, Math.min(prev * zoomFactor, 3)));
  };

  return (
    <div className="relative w-full h-[520px] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden select-none shadow-inner group">
      {/* Offline Watermark */}
      {isOfflineMode && (
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-zinc-800 text-zinc-100 text-xs font-mono rounded-lg flex items-center gap-2 border border-zinc-700 shadow-lg animate-pulse">
          <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
          OFFLINE CACHED MAP MODE
        </div>
      )}

      {/* Interactive Floating Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2.5 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl shadow-md transition hover:bg-slate-50"
          title="Zoom In"
          id="map-btn-zoomin"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl shadow-md transition hover:bg-slate-50"
          title="Zoom Out"
          id="map-btn-zoomout"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={handleReset}
          className="p-2.5 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl shadow-md transition hover:bg-slate-50"
          title="Recenter Map"
          id="map-btn-recenter"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* SVG Canvas Map */}
      <svg
        ref={svgRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing transition-colors duration-500 ${
          isOfflineMode ? 'grayscale saturate-50' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        id="transit-svg-canvas"
      >
        {/* Transform Group for Pan & Zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          
          {/* 1. MAP BACKGROUND DECORATIONS */}
          {/* Grid lines for engineering feel */}
          <defs>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke={isOfflineMode ? "#e4e4e7" : "#f1f5f9"} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1000" height="1000" fill="url(#grid)" />

          {/* Metro River (Winding water body) */}
          <path
            d="M -100 350 Q 300 480, 500 500 T 1100 650 L 1100 800 L -100 800 Z"
            fill={isOfflineMode ? "#e4e4e7" : "#e0f2fe"}
            opacity={0.7}
          />
          {/* Inner River flow lines */}
          <path
            d="M -100 350 Q 300 480, 500 500 T 1100 650"
            fill="none"
            stroke={isOfflineMode ? "#d4d4d8" : "#bae6fd"}
            strokeWidth="3"
            strokeDasharray="10 15"
          />

          {/* Green Zones / Parks */}
          {/* Metro University Park */}
          <rect
            x="120"
            y="180"
            width="180"
            height="150"
            rx="12"
            fill={isOfflineMode ? "#f4f4f5" : "#f0fdf4"}
            stroke={isOfflineMode ? "#e4e4e7" : "#dcfce7"}
            strokeWidth="1.5"
          />
          <text x="210" y="210" fontSize="10" fontWeight="600" fill={isOfflineMode ? "#a1a1aa" : "#86efac"} textAnchor="middle" className="font-sans tracking-wide">
            UNIVERSITY CAMPUS
          </text>

          {/* Central Park */}
          <circle
            cx="500"
            cy="450"
            r="120"
            fill={isOfflineMode ? "#f4f4f5" : "#ecfdf5"}
            stroke={isOfflineMode ? "#e4e4e7" : "#d1fae5"}
            strokeWidth="1.5"
            opacity={0.4}
          />

          {/* Silicon Tech District */}
          <rect
            x="720"
            y="170"
            width="160"
            height="140"
            rx="12"
            fill={isOfflineMode ? "#f4f4f5" : "#fbf7ff"}
            stroke={isOfflineMode ? "#e4e4e7" : "#f3e8ff"}
            strokeWidth="1.5"
          />
          <text x="800" y="200" fontSize="10" fontWeight="600" fill={isOfflineMode ? "#a1a1aa" : "#d8b4fe"} textAnchor="middle" className="font-sans tracking-wide">
            SILICON TECH PARK
          </text>

          {/* Waterfront Marina Harbour */}
          <path
            d="M 50 680 L 250 680 L 250 820 L 50 820 Z"
            fill={isOfflineMode ? "#f4f4f5" : "#fffbeb"}
            stroke={isOfflineMode ? "#e4e4e7" : "#fef3c7"}
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="150" y="705" fontSize="10" fontWeight="600" fill={isOfflineMode ? "#a1a1aa" : "#fcd34d"} textAnchor="middle" className="font-sans tracking-wide">
            MARINA HARBOR
          </text>

          {/* Bridges crossing the river */}
          {/* Bridge 1: Center crossing */}
          <g transform="translate(500, 480) rotate(15)">
            <rect x="-40" y="-12" width="80" height="24" fill="#cbd5e1" rx="2" stroke="#94a3b8" strokeWidth="1" />
            <line x1="-40" y1="-8" x2="40" y2="-8" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="-40" y1="8" x2="40" y2="8" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* 2. TRANSIT ROUTE POLYLINES */}
          {routes.map(route => {
            const isHighlighted = !selectedRoute || selectedRoute.id === route.id;
            const routePathString = route.path.map(p => `${p.x},${p.y}`).join(' ');

            return (
              <g key={route.id} opacity={isHighlighted ? 1 : 0.22} className="transition-opacity duration-300">
                {/* Outer shadow glow line */}
                <polyline
                  points={routePathString}
                  fill="none"
                  stroke={route.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={selectedRoute?.id === route.id ? 0.45 : 0.15}
                  className={selectedRoute?.id === route.id ? "animate-pulse" : ""}
                />
                {/* Core transit line */}
                <polyline
                  points={routePathString}
                  fill="none"
                  stroke={route.color}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Route label on end nodes */}
                {route.path.length > 0 && (
                  <g transform={`translate(${route.path[0].x}, ${route.path[0].y - 12})`}>
                    <rect x="-14" y="-8" width="28" height="15" rx="4" fill={route.color} />
                    <text fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle" y="3" className="font-mono">
                      {route.shortName}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 3. TRANSIT STOPS (STATIONS) */}
          {stops.map(stop => {
            const isSelected = selectedStop?.id === stop.id;
            const isFavorite = favoriteStops.includes(stop.id);
            const isStopHighlighted = !selectedRoute || stop.routes.includes(selectedRoute.id);

            return (
              <g
                key={stop.id}
                transform={`translate(${stop.latLng.x}, ${stop.latLng.y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStop(stop);
                }}
                onMouseEnter={() => setHoveredStop(stop)}
                onMouseLeave={() => setHoveredStop(null)}
                opacity={isStopHighlighted ? 1 : 0.35}
              >
                {/* Glowing selection circle */}
                {isSelected && (
                  <circle
                    r="18"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                    className="animate-ping"
                    opacity={0.6}
                  />
                )}
                {/* Outer halo */}
                <circle
                  r={isSelected ? "11" : "8.5"}
                  fill="#ffffff"
                  stroke={isSelected ? "#0ea5e9" : "#64748b"}
                  strokeWidth={isSelected ? "3.5" : "2"}
                  className="transition-all duration-200 hover:scale-125"
                  id={`stop-circle-${stop.id}`}
                />
                {/* Central dot */}
                <circle
                  r="3.5"
                  fill={isSelected ? "#0284c7" : "#1e293b"}
                />

                {/* Stop Name Tag (Visible on hover or when selected) */}
                {(isSelected || hoveredStop?.id === stop.id) && (
                  <g transform="translate(0, -22)" className="pointer-events-none select-none z-50">
                    {/* Shadow overlay card */}
                    <rect
                      x="-75"
                      y="-16"
                      width="150"
                      height="26"
                      rx="6"
                      fill="#1e293b"
                      filter="drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))"
                    />
                    <text
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="600"
                      textAnchor="middle"
                      y="1"
                      className="font-sans"
                    >
                      {stop.name.split(' (')[0]}
                    </text>
                    {/* Tiny route indicator badges */}
                    <text
                      fill="#94a3b8"
                      fontSize="7"
                      fontFamily="monospace"
                      textAnchor="middle"
                      y="8"
                    >
                      Lines: {stop.routes.map(r => r.split('-')[1].toUpperCase()).join(', ')}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 4. LIVE TRACKING BUSES */}
          {buses.map(bus => {
            const route = transitRoutes.find(r => r.id === bus.routeId);
            const isBusSelected = selectedBus?.id === bus.id;
            if (!route) return null;

            return (
              <g
                key={bus.id}
                transform={`translate(${bus.currentLatLng.x}, ${bus.currentLatLng.y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBus(bus);
                }}
                onMouseEnter={() => setHoveredBus(bus)}
                onMouseLeave={() => setHoveredBus(null)}
              >
                {/* Pulsing selection indicator */}
                {isBusSelected && (
                  <circle
                    r="22"
                    fill="none"
                    stroke={route.color}
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}

                {/* Direction indicator (triangle pointing in heading direction) */}
                <g transform={`rotate(${bus.heading})`}>
                  <path
                    d="M 12 0 L -4 -7 L -4 7 Z"
                    fill={route.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Core Bus Circle */}
                <circle
                  r="10"
                  fill={route.color}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="shadow-md"
                  id={`bus-circle-${bus.id}`}
                />

                {/* Route Line Code inside Bus */}
                <text
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="800"
                  fontFamily="monospace"
                  textAnchor="middle"
                  y="3"
                >
                  {route.shortName}
                </text>

                {/* Micro tooltip details on hover or click */}
                {(isBusSelected || hoveredBus?.id === bus.id) && (
                  <g transform="translate(0, 24)" className="pointer-events-none select-none z-50">
                    <rect
                      x="-60"
                      y="-12"
                      width="120"
                      height="24"
                      rx="6"
                      fill="#0f172a"
                      opacity={0.9}
                    />
                    <text
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="700"
                      textAnchor="middle"
                      y="3"
                      className="font-mono"
                    >
                      {bus.vehicleNumber} ({bus.speed.toFixed(0)} km/h)
                    </text>
                  </g>
                )}
              </g>
            );
          })}

        </g>
      </svg>

      {/* Map Footer Informative Stats / Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-sm border border-slate-200/80 p-3 rounded-xl shadow-lg text-xs pointer-events-auto">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            <span>101 Downtown</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
            <span>202 Coast</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
            <span>303 Uni</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
            <span>404 Circle</span>
          </div>
        </div>

        <div className="text-slate-500 flex items-center gap-1">
          <Info size={13} className="text-slate-400" />
          <span>Drag to pan, Scroll to Zoom. Tap stops or buses for live data.</span>
        </div>
      </div>
    </div>
  );
}
