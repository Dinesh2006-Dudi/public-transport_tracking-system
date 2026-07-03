import { TransitStop, TransitRoute, TransitAlert } from './types';

export const transitStops: TransitStop[] = [
  {
    id: 'stop-central',
    name: 'Central Terminal (Downtown)',
    latLng: { x: 500, y: 450 },
    routes: ['route-red', 'route-blue', 'route-green'],
    amenities: ['Indoor Waiting Area', 'Digital Screen', 'Wi-Fi Hotspot', 'Ticket Kiosk', 'Restrooms'],
  },
  {
    id: 'stop-northgate',
    name: 'North Gate Plaza',
    latLng: { x: 500, y: 100 },
    routes: ['route-red', 'route-orange'],
    amenities: ['Shelter', 'Digital Screen', 'Bike Rack', 'USB Chargers'],
  },
  {
    id: 'stop-southhill',
    name: 'South Hill Shopping Center',
    latLng: { x: 500, y: 900 },
    routes: ['route-red', 'route-orange'],
    amenities: ['Shelter', 'Ticket Kiosk', 'Vending Machines', 'Wheelchair Ramp'],
  },
  {
    id: 'stop-marina',
    name: 'Marina Heights Waterfront',
    latLng: { x: 150, y: 750 },
    routes: ['route-blue', 'route-orange'],
    amenities: ['Shelter', 'Scenic Overlook Bench', 'Digital Screen', 'Bike Rack'],
  },
  {
    id: 'stop-eastbay',
    name: 'East River Bay Boulevard',
    latLng: { x: 850, y: 750 },
    routes: ['route-blue', 'route-orange'],
    amenities: ['Shelter', 'Digital Screen', 'USB Chargers'],
  },
  {
    id: 'stop-uni',
    name: 'Metro University Campus',
    latLng: { x: 200, y: 250 },
    routes: ['route-green', 'route-orange'],
    amenities: ['Shelter', 'Digital Screen', 'Wi-Fi Hotspot', 'E-Scooter Dock', 'Bike Repair Station'],
  },
  {
    id: 'stop-tech',
    name: 'Silicon District Tech Park',
    latLng: { x: 800, y: 250 },
    routes: ['route-green', 'route-orange'],
    amenities: ['Shelter', 'Digital Screen', 'Climate Control Chamber', 'USB Chargers', 'Ticket Kiosk'],
  },
];

export const transitRoutes: TransitRoute[] = [
  {
    id: 'route-red',
    name: 'Red Line - Downtown Express',
    shortName: '101',
    color: '#ef4444', // Red-500
    type: 'Express',
    stops: ['stop-northgate', 'stop-central', 'stop-southhill'],
    path: [
      { x: 500, y: 100 },
      { x: 500, y: 280 },
      { x: 500, y: 450 },
      { x: 500, y: 680 },
      { x: 500, y: 900 },
    ],
    scheduleInterval: 10,
    fare: 2.50,
  },
  {
    id: 'route-blue',
    name: 'Blue Line - Coastal Shuttle',
    shortName: '202',
    color: '#3b82f6', // Blue-500
    type: 'Shuttle',
    stops: ['stop-marina', 'stop-central', 'stop-eastbay'],
    path: [
      { x: 150, y: 750 },
      { x: 300, y: 600 },
      { x: 500, y: 450 },
      { x: 700, y: 600 },
      { x: 850, y: 750 },
    ],
    scheduleInterval: 15,
    fare: 2.00,
  },
  {
    id: 'route-green',
    name: 'Green Line - University Link',
    shortName: '303',
    color: '#10b981', // Emerald-500
    type: 'Local',
    stops: ['stop-uni', 'stop-central', 'stop-tech'],
    path: [
      { x: 200, y: 250 },
      { x: 350, y: 350 },
      { x: 500, y: 450 },
      { x: 650, y: 350 },
      { x: 800, y: 250 },
    ],
    scheduleInterval: 12,
    fare: 1.75,
  },
  {
    id: 'route-orange',
    name: 'Orange Line - Circular Outer Loop',
    shortName: '404',
    color: '#f97316', // Orange-500
    type: 'Rapid',
    stops: ['stop-uni', 'stop-northgate', 'stop-tech', 'stop-eastbay', 'stop-southhill', 'stop-marina', 'stop-uni'],
    path: [
      { x: 200, y: 250 },
      { x: 350, y: 150 },
      { x: 500, y: 100 }, // North Gate Plaza
      { x: 650, y: 150 },
      { x: 800, y: 250 }, // Tech Park
      { x: 850, y: 500 },
      { x: 850, y: 750 }, // East River Bay
      { x: 680, y: 850 },
      { x: 500, y: 900 }, // South Hill Mall
      { x: 320, y: 850 },
      { x: 150, y: 750 }, // Marina Heights
      { x: 150, y: 500 },
      { x: 200, y: 250 }, // Uni Campus
    ],
    scheduleInterval: 20,
    fare: 3.00,
  },
];

export const initialAlerts: TransitAlert[] = [
  {
    id: 'alert-1',
    routeId: 'route-red',
    type: 'delay',
    severity: 'medium',
    title: 'Bridge Construction Delays',
    message: 'Red Line (101) experiencing 4-6 minute delays near Downtown crossing due to overnight lane maintenance.',
    timestamp: '10 mins ago',
  },
  {
    id: 'alert-2',
    routeId: 'route-blue',
    type: 'detour',
    severity: 'high',
    title: 'Waterfront Parade Detour',
    message: 'Blue Line (202) is detouring via 4th Ave between Marina Heights and Central Terminal. Expect alternate stops.',
    timestamp: '1 hour ago',
  },
  {
    id: 'alert-3',
    type: 'general',
    severity: 'low',
    title: 'New Digital Passes Active',
    message: 'You can now download offline NFC passes directly into the app for frictionless, offline terminal gates.',
    timestamp: '2 hours ago',
  },
];
