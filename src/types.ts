export interface LatLng {
  x: number; // custom map X coordinate (0 - 1000)
  y: number; // custom map Y coordinate (0 - 1000)
}

export interface TransitStop {
  id: string;
  name: string;
  latLng: LatLng;
  routes: string[]; // IDs of routes stopping here
  amenities: string[]; // e.g., ["Shelter", "Digital Screen", "Bike Rack"]
}

export interface TransitRoute {
  id: string;
  name: string;
  shortName: string; // e.g., "101"
  color: string; // hex or tailwind class name
  type: 'Express' | 'Local' | 'Shuttle' | 'Rapid';
  stops: string[]; // ordered list of Stop IDs
  path: LatLng[]; // detailed coordinate path for drawing lines
  scheduleInterval: number; // in minutes (e.g. every 15 mins)
  fare: number;
}

export interface LiveBus {
  id: string;
  routeId: string;
  vehicleNumber: string;
  currentLatLng: LatLng;
  heading: number; // angle in degrees
  nextStopId: string;
  speed: number; // in km/h
  loadFactor: number; // percentage (0 to 100)
  status: 'On Time' | 'Delayed' | 'Early';
  delayMinutes: number;
  lastUpdated: string;
  routeIndex: number; // current segment index along path
  direction: 'forward' | 'backward';
}

export interface TransitAlert {
  id: string;
  routeId?: string;
  type: 'delay' | 'detour' | 'construction' | 'general';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  timestamp: string;
}

export interface TripPlan {
  routes: {
    routeId: string;
    startStopId: string;
    endStopId: string;
    stopsCount: number;
    duration: number; // minutes
    departureTime: string;
    arrivalTime: string;
  }[];
  totalDuration: number;
  totalFare: number;
  carbonSaved: number; // in kg CO2
}

export interface AppState {
  selectedStop: TransitStop | null;
  selectedRoute: TransitRoute | null;
  selectedBus: LiveBus | null;
  searchStartStop: string;
  searchEndStop: string;
  isOfflineMode: boolean;
  isMapDownloaded: boolean;
  downloadProgress: number; // 0 - 100
  favoriteStops: string[]; // IDs of favorite stops
  alerts: TransitAlert[];
  notificationsSubscribed: {
    busId: string;
    stopId: string;
    triggerMinutes: number;
  }[];
}
