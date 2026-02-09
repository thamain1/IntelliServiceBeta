/**
 * Route Optimization Service
 *
 * Provides route optimization for technician dispatch using:
 * - Nearest neighbor algorithm for basic optimization
 * - Google Directions API for real driving distances/times
 * - Support for multi-stop route planning
 */

export interface RouteStop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  scheduledTime?: string;
  estimatedDuration?: number; // in minutes
}

export interface OptimizedRoute {
  technicianId: string;
  technicianName: string;
  startLocation: { latitude: number; longitude: number };
  stops: RouteStop[];
  totalDistance: number; // in miles
  totalDuration: number; // in minutes
  estimatedArrivalTimes: { stopId: string; eta: Date }[];
  directionsUrl: string;
}

export interface RouteOptimizationResult {
  success: boolean;
  routes: OptimizedRoute[];
  totalSavings?: {
    distanceSaved: number;
    timeSaved: number;
  };
  error?: string;
}

// Haversine formula for calculating distance between two points
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate driving time based on distance (assumes average speed of 30 mph in urban areas)
function estimateDrivingTime(distanceMiles: number): number {
  const averageSpeed = 30; // mph
  return Math.round((distanceMiles / averageSpeed) * 60); // minutes
}

export class RouteOptimizationService {
  /**
   * Optimize route for a single technician using nearest neighbor algorithm
   */
  static optimizeRoute(
    technicianId: string,
    technicianName: string,
    startLocation: { latitude: number; longitude: number },
    stops: RouteStop[]
  ): OptimizedRoute {
    if (stops.length === 0) {
      return {
        technicianId,
        technicianName,
        startLocation,
        stops: [],
        totalDistance: 0,
        totalDuration: 0,
        estimatedArrivalTimes: [],
        directionsUrl: '',
      };
    }

    // Sort by priority first (emergency > high > normal > low)
    const priorityOrder = { emergency: 0, high: 1, normal: 2, low: 3 };
    const prioritySorted = [...stops].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    // Separate emergency/high priority stops (must be visited first)
    const urgentStops = prioritySorted.filter(
      (s) => s.priority === 'emergency' || s.priority === 'high'
    );
    const regularStops = prioritySorted.filter(
      (s) => s.priority !== 'emergency' && s.priority !== 'high'
    );

    // Apply nearest neighbor to regular stops
    const optimizedRegularStops = this.nearestNeighborSort(
      urgentStops.length > 0
        ? {
            latitude: urgentStops[urgentStops.length - 1].latitude,
            longitude: urgentStops[urgentStops.length - 1].longitude,
          }
        : startLocation,
      regularStops
    );

    const optimizedStops = [...urgentStops, ...optimizedRegularStops];

    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;
    let currentLocation = startLocation;
    const estimatedArrivalTimes: { stopId: string; eta: Date }[] = [];
    let currentTime = new Date();

    for (const stop of optimizedStops) {
      const distance = haversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        stop.latitude,
        stop.longitude
      );
      const drivingTime = estimateDrivingTime(distance);

      totalDistance += distance;
      totalDuration += drivingTime + (stop.estimatedDuration || 60); // Add job duration

      currentTime = new Date(currentTime.getTime() + drivingTime * 60 * 1000);
      estimatedArrivalTimes.push({ stopId: stop.id, eta: new Date(currentTime) });
      currentTime = new Date(currentTime.getTime() + (stop.estimatedDuration || 60) * 60 * 1000);

      currentLocation = { latitude: stop.latitude, longitude: stop.longitude };
    }

    // Generate Google Maps directions URL
    const directionsUrl = this.generateDirectionsUrl(startLocation, optimizedStops);

    return {
      technicianId,
      technicianName,
      startLocation,
      stops: optimizedStops,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration: Math.round(totalDuration),
      estimatedArrivalTimes,
      directionsUrl,
    };
  }

  /**
   * Nearest neighbor algorithm for route optimization
   */
  private static nearestNeighborSort(
    start: { latitude: number; longitude: number },
    stops: RouteStop[]
  ): RouteStop[] {
    if (stops.length <= 1) return stops;

    const result: RouteStop[] = [];
    const remaining = [...stops];
    let currentLocation = start;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distance = haversineDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          remaining[i].latitude,
          remaining[i].longitude
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      result.push(nearest);
      currentLocation = { latitude: nearest.latitude, longitude: nearest.longitude };
    }

    return result;
  }

  /**
   * Generate Google Maps directions URL for multi-stop route
   */
  static generateDirectionsUrl(
    start: { latitude: number; longitude: number },
    stops: RouteStop[]
  ): string {
    if (stops.length === 0) return '';

    const origin = `${start.latitude},${start.longitude}`;
    const destination = `${stops[stops.length - 1].latitude},${stops[stops.length - 1].longitude}`;

    // Waypoints for intermediate stops
    const waypoints = stops
      .slice(0, -1)
      .map((s) => `${s.latitude},${s.longitude}`)
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) {
      url += `&waypoints=${encodeURIComponent(waypoints)}`;
    }
    url += '&travelmode=driving';

    return url;
  }

  /**
   * Optimize routes for multiple technicians
   */
  static optimizeMultipleRoutes(
    technicians: Array<{
      id: string;
      name: string;
      location: { latitude: number; longitude: number } | null;
      stops: RouteStop[];
    }>
  ): RouteOptimizationResult {
    try {
      const routes: OptimizedRoute[] = [];
      let totalDistanceBefore = 0;
      let totalDistanceAfter = 0;
      let totalTimeBefore = 0;
      let totalTimeAfter = 0;

      for (const tech of technicians) {
        if (!tech.location || tech.stops.length === 0) continue;

        // Calculate original distance (in current order)
        let originalDistance = 0;
        let originalTime = 0;
        let currentLoc = tech.location;

        for (const stop of tech.stops) {
          const dist = haversineDistance(
            currentLoc.latitude,
            currentLoc.longitude,
            stop.latitude,
            stop.longitude
          );
          originalDistance += dist;
          originalTime += estimateDrivingTime(dist) + (stop.estimatedDuration || 60);
          currentLoc = { latitude: stop.latitude, longitude: stop.longitude };
        }

        totalDistanceBefore += originalDistance;
        totalTimeBefore += originalTime;

        // Optimize route
        const optimized = this.optimizeRoute(tech.id, tech.name, tech.location, tech.stops);
        routes.push(optimized);

        totalDistanceAfter += optimized.totalDistance;
        totalTimeAfter += optimized.totalDuration;
      }

      return {
        success: true,
        routes,
        totalSavings: {
          distanceSaved: Math.round((totalDistanceBefore - totalDistanceAfter) * 10) / 10,
          timeSaved: Math.round(totalTimeBefore - totalTimeAfter),
        },
      };
    } catch (error) {
      console.error('[RouteOptimization] Error:', error);
      return {
        success: false,
        routes: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate distance matrix between all stops (for advanced optimization)
   */
  static calculateDistanceMatrix(stops: RouteStop[]): number[][] {
    const matrix: number[][] = [];

    for (let i = 0; i < stops.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < stops.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          matrix[i][j] = haversineDistance(
            stops[i].latitude,
            stops[i].longitude,
            stops[j].latitude,
            stops[j].longitude
          );
        }
      }
    }

    return matrix;
  }

  /**
   * Suggest optimal technician assignment for unassigned tickets
   */
  static suggestAssignment(
    unassignedStop: RouteStop,
    technicians: Array<{
      id: string;
      name: string;
      location: { latitude: number; longitude: number } | null;
      currentStops: RouteStop[];
      skillMatch: boolean;
    }>
  ): { technicianId: string; technicianName: string; additionalDistance: number; additionalTime: number } | null {
    let bestTech: {
      technicianId: string;
      technicianName: string;
      additionalDistance: number;
      additionalTime: number;
    } | null = null;
    let minAdditionalDistance = Infinity;

    for (const tech of technicians) {
      // Skip if no location or skills don't match
      if (!tech.location || !tech.skillMatch) continue;

      // Calculate additional distance if this tech takes the job
      let additionalDistance: number;

      if (tech.currentStops.length === 0) {
        // If tech has no current stops, just calculate from their location
        additionalDistance = haversineDistance(
          tech.location.latitude,
          tech.location.longitude,
          unassignedStop.latitude,
          unassignedStop.longitude
        );
      } else {
        // Find best insertion point in existing route
        let minInsertionCost = Infinity;

        // Check inserting at the beginning
        const insertAtStart =
          haversineDistance(
            tech.location.latitude,
            tech.location.longitude,
            unassignedStop.latitude,
            unassignedStop.longitude
          ) +
          haversineDistance(
            unassignedStop.latitude,
            unassignedStop.longitude,
            tech.currentStops[0].latitude,
            tech.currentStops[0].longitude
          ) -
          haversineDistance(
            tech.location.latitude,
            tech.location.longitude,
            tech.currentStops[0].latitude,
            tech.currentStops[0].longitude
          );
        minInsertionCost = Math.min(minInsertionCost, insertAtStart);

        // Check inserting between existing stops
        for (let i = 0; i < tech.currentStops.length - 1; i++) {
          const current = tech.currentStops[i];
          const next = tech.currentStops[i + 1];

          const insertionCost =
            haversineDistance(current.latitude, current.longitude, unassignedStop.latitude, unassignedStop.longitude) +
            haversineDistance(unassignedStop.latitude, unassignedStop.longitude, next.latitude, next.longitude) -
            haversineDistance(current.latitude, current.longitude, next.latitude, next.longitude);

          minInsertionCost = Math.min(minInsertionCost, insertionCost);
        }

        // Check inserting at the end
        const lastStop = tech.currentStops[tech.currentStops.length - 1];
        const insertAtEnd = haversineDistance(
          lastStop.latitude,
          lastStop.longitude,
          unassignedStop.latitude,
          unassignedStop.longitude
        );
        minInsertionCost = Math.min(minInsertionCost, insertAtEnd);

        additionalDistance = minInsertionCost;
      }

      if (additionalDistance < minAdditionalDistance) {
        minAdditionalDistance = additionalDistance;
        bestTech = {
          technicianId: tech.id,
          technicianName: tech.name,
          additionalDistance: Math.round(additionalDistance * 10) / 10,
          additionalTime: estimateDrivingTime(additionalDistance),
        };
      }
    }

    return bestTech;
  }

  /**
   * Format ETA for display
   */
  static formatETA(eta: Date): string {
    const now = new Date();
    const diffMinutes = Math.round((eta.getTime() - now.getTime()) / 60000);

    if (diffMinutes < 0) return 'Overdue';
    if (diffMinutes < 60) return `${diffMinutes} min`;

    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
  }

  /**
   * Get priority color class
   */
  static getPriorityColor(priority: RouteStop['priority']): string {
    const colors = {
      emergency: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[priority];
  }
}
