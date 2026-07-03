import { LatLng, LiveBus, TransitRoute, TransitStop, TripPlan } from './types';
import { transitStops, transitRoutes } from './transitData';

// Euclidean distance helper
export function getDistance(p1: LatLng, p2: LatLng): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Linear interpolation for coordinates
export function interpolate(p1: LatLng, p2: LatLng, t: number): LatLng {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

// Calculate heading angle in degrees between two coordinates
export function getHeading(p1: LatLng, p2: LatLng): number {
  const dy = p2.y - p1.y;
  const dx = p2.x - p1.x;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return angle < 0 ? angle + 360 : angle;
}

// Seed initial live buses moving on the grid
export function generateInitialBuses(): LiveBus[] {
  return transitRoutes.map((route, idx) => {
    // Red (0), Blue (1), Green (2), Orange (3)
    // Let's create two buses for each route to make the map look active!
    return [
      {
        id: `bus-${route.id}-1`,
        routeId: route.id,
        vehicleNumber: `B-${100 + idx * 25 + 1}`,
        currentLatLng: { ...route.path[0] },
        heading: 0,
        nextStopId: route.stops[1] || route.stops[0],
        speed: 40 + Math.random() * 10,
        loadFactor: Math.floor(20 + Math.random() * 60),
        status: Math.random() > 0.85 ? 'Delayed' : 'On Time' as any,
        delayMinutes: Math.random() > 0.85 ? Math.floor(1 + Math.random() * 5) : 0,
        lastUpdated: 'Just Now',
        routeIndex: 0,
        direction: 'forward' as const,
      },
      {
        id: `bus-${route.id}-2`,
        routeId: route.id,
        vehicleNumber: `B-${100 + idx * 25 + 2}`,
        // start halfway through the route path
        currentLatLng: { ...route.path[Math.floor(route.path.length / 2)] },
        heading: 180,
        nextStopId: route.stops[Math.floor(route.stops.length / 2) + 1] || route.stops[0],
        speed: 35 + Math.random() * 15,
        loadFactor: Math.floor(10 + Math.random() * 70),
        status: Math.random() > 0.9 ? 'Delayed' : 'On Time' as any,
        delayMinutes: Math.random() > 0.9 ? Math.floor(2 + Math.random() * 6) : 0,
        lastUpdated: 'Just Now',
        routeIndex: Math.floor(route.path.length / 2),
        direction: Math.random() > 0.5 ? 'forward' as const : 'backward' as const,
      }
    ];
  }).flat();
}

/**
 * Update bus positions along their pathways.
 * @param buses Array of current live buses.
 * @param dt Delta progress increment (typically around 0.01 to 0.03 per tick).
 */
export function updateBuses(buses: LiveBus[], dt: number): LiveBus[] {
  return buses.map(bus => {
    const route = transitRoutes.find(r => r.id === bus.routeId);
    if (!route) return bus;

    const path = route.path;
    const pathLen = path.length;

    let nextIndex = bus.routeIndex;
    let nextDirection = bus.direction;
    let t = getDistance(bus.currentLatLng, path[bus.routeIndex]) / getDistance(path[bus.routeIndex], path[bus.routeIndex + 1] || path[bus.routeIndex]);
    
    // Fallback if NaN
    if (isNaN(t) || t >= 1) t = 0;

    // Advance t based on bus speed
    const segmentDist = getDistance(path[bus.routeIndex], path[(bus.routeIndex + 1) % pathLen] || path[bus.routeIndex]);
    const speedFactor = (bus.speed * dt) / (segmentDist || 1); // custom scaling
    t += speedFactor;

    let newLatLng = { ...bus.currentLatLng };
    let heading = bus.heading;

    if (bus.direction === 'forward') {
      const currIdx = bus.routeIndex;
      const targetIdx = currIdx + 1;

      if (targetIdx < pathLen) {
        newLatLng = interpolate(path[currIdx], path[targetIdx], Math.min(t, 1));
        heading = getHeading(path[currIdx], path[targetIdx]);

        if (t >= 1) {
          nextIndex = currIdx + 1;
          if (nextIndex === pathLen - 1) {
            // Reached the end
            if (route.id === 'route-orange') {
              // Orange is circular, continue to 0
              nextIndex = 0;
            } else {
              // Linear route, reverse direction
              nextDirection = 'backward';
              nextIndex = pathLen - 1;
            }
          }
        }
      } else {
        nextIndex = 0;
      }
    } else {
      // heading backward
      const currIdx = bus.routeIndex;
      const targetIdx = currIdx - 1;

      if (targetIdx >= 0) {
        newLatLng = interpolate(path[currIdx], path[targetIdx], Math.min(t, 1));
        heading = getHeading(path[currIdx], path[targetIdx]);

        if (t >= 1) {
          nextIndex = currIdx - 1;
          if (nextIndex === 0) {
            nextDirection = 'forward';
          }
        }
      } else {
        nextDirection = 'forward';
        nextIndex = 0;
      }
    }

    // Determine the next upcoming stop for this bus
    let nextStopId = bus.nextStopId;
    const currentStopIndex = route.stops.findIndex(id => id === bus.nextStopId);
    
    // Simple heuristic: which stops are in front of the bus based on direction
    const busStopIndex = Math.min(Math.floor((bus.routeIndex / pathLen) * route.stops.length), route.stops.length - 1);
    if (bus.direction === 'forward') {
      const nextIdx = Math.min(busStopIndex + 1, route.stops.length - 1);
      nextStopId = route.stops[nextIdx];
    } else {
      const nextIdx = Math.max(busStopIndex - 1, 0);
      nextStopId = route.stops[nextIdx];
    }

    // Slightly fluctuate speed and load factor for realism
    let speed = bus.speed + (Math.random() - 0.5) * 2;
    if (speed < 20) speed = 25;
    if (speed > 60) speed = 55;

    let loadFactor = bus.loadFactor + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 5 : -5) : 0);
    if (loadFactor < 5) loadFactor = 10;
    if (loadFactor > 95) loadFactor = 90;

    return {
      ...bus,
      currentLatLng: newLatLng,
      heading,
      routeIndex: nextIndex,
      direction: nextDirection,
      nextStopId,
      speed,
      loadFactor,
      lastUpdated: 'Just Now',
    };
  });
}

/**
 * Calculates ETA (Estimated Time of Arrival) in minutes for a bus to reach a specific stop.
 */
export function calculateETAForStop(bus: LiveBus, targetStopId: string): number {
  const route = transitRoutes.find(r => r.id === bus.routeId);
  const stop = transitStops.find(s => s.id === targetStopId);
  if (!route || !stop) return 99;

  // Find stop index on route
  const stopIdx = route.stops.indexOf(targetStopId);
  if (stopIdx === -1) return 99;

  // Let's look at where the stop is physically on the grid
  const dist = getDistance(bus.currentLatLng, stop.latLng);
  
  // Custom formula: converts pixel coordinate distance to minutes
  // 100 units is approx 2 km. At 40 km/h, 2 km takes 3 minutes.
  let baseMinutes = (dist / 100) * 3;
  
  // Include delay if any
  if (bus.status === 'Delayed') {
    baseMinutes += bus.delayMinutes;
  }

  const rounded = Math.round(baseMinutes);
  return rounded <= 0 ? 1 : rounded;
}

/**
 * Simple path planner. Finds options to travel between two stops.
 */
export function planTrip(startStopId: string, endStopId: string): TripPlan[] {
  if (!startStopId || !endStopId || startStopId === endStopId) return [];

  const startStop = transitStops.find(s => s.id === startStopId);
  const endStop = transitStops.find(s => s.id === endStopId);
  if (!startStop || !endStop) return [];

  const plans: TripPlan[] = [];

  // Look for direct routes
  const commonRoutes = startStop.routes.filter(r => endStop.routes.includes(r));

  for (const routeId of commonRoutes) {
    const route = transitRoutes.find(r => r.id === routeId);
    if (!route) continue;

    const startIdx = route.stops.indexOf(startStopId);
    const endIdx = route.stops.indexOf(endStopId);

    if (startIdx !== -1 && endIdx !== -1) {
      // We found a direct route!
      // In linear routes, is it going the right way? Or circular loop which connects anyway.
      const stopsCount = Math.abs(endIdx - startIdx);
      const duration = stopsCount * 4; // average 4 mins per stop

      // Create plan
      plans.push({
        routes: [{
          routeId: route.id,
          startStopId,
          endStopId,
          stopsCount,
          duration,
          departureTime: 'Every ' + route.scheduleInterval + 'm',
          arrivalTime: `+${duration}m`,
        }],
        totalDuration: duration,
        totalFare: route.fare,
        carbonSaved: +(stopsCount * 0.45).toFixed(2), // kg of CO2
      });
    }
  }

  // Look for 1-transfer routes (primarily through Central Terminal)
  if (plans.length === 0 || plans.length < 3) {
    const transferStopId = 'stop-central';
    
    if (startStopId !== transferStopId && endStopId !== transferStopId) {
      // Can we go startStop -> Central -> endStop?
      const startToCentralRoute = startStop.routes.find(r => {
        const routeObj = transitRoutes.find(route => route.id === r);
        return routeObj?.stops.includes(transferStopId);
      });

      const centralToEndRoute = endStop.routes.find(r => {
        const routeObj = transitRoutes.find(route => route.id === r);
        return routeObj?.stops.includes(transferStopId);
      });

      if (startToCentralRoute && centralToEndRoute && startToCentralRoute !== centralToEndRoute) {
        const route1 = transitRoutes.find(r => r.id === startToCentralRoute)!;
        const route2 = transitRoutes.find(r => r.id === centralToEndRoute)!;

        const s1Idx = route1.stops.indexOf(startStopId);
        const c1Idx = route1.stops.indexOf(transferStopId);
        const c2Idx = route2.stops.indexOf(transferStopId);
        const s2Idx = route2.stops.indexOf(endStopId);

        const stopsCount1 = Math.abs(c1Idx - s1Idx);
        const stopsCount2 = Math.abs(s2Idx - c2Idx);

        const duration1 = stopsCount1 * 4;
        const duration2 = stopsCount2 * 4;
        const transferWaitTime = 5; // average wait time for transfer
        const totalDuration = duration1 + duration2 + transferWaitTime;

        plans.push({
          routes: [
            {
              routeId: route1.id,
              startStopId,
              endStopId: transferStopId,
              stopsCount: stopsCount1,
              duration: duration1,
              departureTime: 'Every ' + route1.scheduleInterval + 'm',
              arrivalTime: `+${duration1}m`,
            },
            {
              routeId: route2.id,
              startStopId: transferStopId,
              endStopId,
              stopsCount: stopsCount2,
              duration: duration2,
              departureTime: 'Every ' + route2.scheduleInterval + 'm',
              arrivalTime: `+${totalDuration}m`,
            }
          ],
          totalDuration,
          totalFare: +(route1.fare + route2.fare * 0.5).toFixed(2), // 50% discount on transfer
          carbonSaved: +((stopsCount1 + stopsCount2) * 0.45).toFixed(2),
        });
      }
    }
  }

  // Also include the Outer Circular Loop if either has it and it fits as alternative
  const orangeRoute = transitRoutes.find(r => r.id === 'route-orange')!;
  const hasOrangeStart = startStop.routes.includes('route-orange');
  const hasOrangeEnd = endStop.routes.includes('route-orange');

  if (hasOrangeStart && hasOrangeEnd) {
    const sIdx = orangeRoute.stops.indexOf(startStopId);
    const eIdx = orangeRoute.stops.indexOf(endStopId);
    
    // Find shortest stops in circular list
    const directDist = Math.abs(eIdx - sIdx);
    const loopDist = orangeRoute.stops.length - 1 - directDist;
    const stopsCount = Math.min(directDist, loopDist);
    const duration = stopsCount * 5; // Orange Loop has longer segments

    const alreadyAdded = plans.some(p => p.routes.length === 1 && p.routes[0].routeId === 'route-orange');
    if (!alreadyAdded) {
      plans.push({
        routes: [{
          routeId: 'route-orange',
          startStopId,
          endStopId,
          stopsCount,
          duration,
          departureTime: 'Every ' + orangeRoute.scheduleInterval + 'm',
          arrivalTime: `+${duration}m`,
        }],
        totalDuration: duration,
        totalFare: orangeRoute.fare,
        carbonSaved: +(stopsCount * 0.45).toFixed(2),
      });
    }
  }

  // Sort plans by duration
  return plans.sort((a, b) => a.totalDuration - b.totalDuration);
}
