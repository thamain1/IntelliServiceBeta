import { supabase } from '../lib/supabase';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface LocationUpdateOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const DEFAULT_OPTIONS: LocationUpdateOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
};

export class GeolocationService {
  private static watchId: number | null = null;
  private static updateInterval: ReturnType<typeof setInterval> | null = null;
  private static lastPosition: GeolocationPosition | null = null;

  /**
   * Check if geolocation is supported
   */
  static isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Request permission and get current position
   */
  static async getCurrentPosition(options: LocationUpdateOptions = {}): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject({ code: 0, message: 'Geolocation is not supported by this browser' });
        return;
      }

      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          this.lastPosition = locationData;
          resolve(locationData);
        },
        (error) => {
          reject({
            code: error.code,
            message: this.getErrorMessage(error.code),
          });
        },
        mergedOptions
      );
    });
  }

  /**
   * Start watching position with continuous updates
   */
  static startWatching(
    onUpdate: (position: GeolocationPosition) => void,
    onError: (error: GeolocationError) => void,
    options: LocationUpdateOptions = {}
  ): number | null {
    if (!this.isSupported()) {
      onError({ code: 0, message: 'Geolocation is not supported by this browser' });
      return null;
    }

    // Stop existing watch if any
    this.stopWatching();

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: GeolocationPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        this.lastPosition = locationData;
        onUpdate(locationData);
      },
      (error) => {
        onError({
          code: error.code,
          message: this.getErrorMessage(error.code),
        });
      },
      mergedOptions
    );

    return this.watchId;
  }

  /**
   * Stop watching position
   */
  static stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Save location to Supabase
   */
  static async saveLocation(
    technicianId: string,
    position: GeolocationPosition
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('technician_locations').insert({
        technician_id: technicianId,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        timestamp: new Date(position.timestamp).toISOString(),
      });

      if (error) throw error;
      return { success: true };
    } catch (error: unknown) {
      console.error('[GeolocationService] Error saving location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Start automatic location updates
   * Reports location to server every intervalMs milliseconds
   */
  static async startAutoUpdates(
    technicianId: string,
    intervalMs: number = 60000, // Default 1 minute
    onUpdate?: (position: GeolocationPosition) => void,
    onError?: (error: GeolocationError) => void
  ): Promise<boolean> {
    if (!this.isSupported()) {
      onError?.({ code: 0, message: 'Geolocation is not supported by this browser' });
      return false;
    }

    // Get initial position
    try {
      const position = await this.getCurrentPosition();
      await this.saveLocation(technicianId, position);
      onUpdate?.(position);
    } catch (error: unknown) {
      const geoError: GeolocationError = error instanceof Error
        ? { code: -1, message: error.message }
        : (error as unknown as GeolocationError);
      onError?.(geoError);
      return false;
    }

    // Set up interval for periodic updates
    this.updateInterval = setInterval(async () => {
      try {
        const position = await this.getCurrentPosition();
        const result = await this.saveLocation(technicianId, position);
        if (result.success) {
          onUpdate?.(position);
        } else {
          onError?.({ code: -1, message: result.error || 'Failed to save location' });
        }
      } catch (error: unknown) {
        const geoError: GeolocationError = error instanceof Error
          ? { code: -1, message: error.message }
          : (error as unknown as GeolocationError);
        onError?.(geoError);
      }
    }, intervalMs);

    return true;
  }

  /**
   * Stop automatic location updates
   */
  static stopAutoUpdates(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get last known position
   */
  static getLastPosition(): GeolocationPosition | null {
    return this.lastPosition;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }

  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private static getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location permission denied. Please enable location access in your browser settings.';
      case 2:
        return 'Location unavailable. Please check your device settings.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while getting location.';
    }
  }
}
