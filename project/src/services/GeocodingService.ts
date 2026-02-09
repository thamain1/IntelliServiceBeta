import { supabase } from '../lib/supabase';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  place_id: string;
  formatted_address: string;
}

export interface GeocodingError {
  message: string;
  status?: string;
}

export class GeocodingService {
  private static geocoder: google.maps.Geocoder | null = null;

  /**
   * Initialize the geocoder
   */
  private static async getGeocoder(): Promise<google.maps.Geocoder> {
    if (this.geocoder) {
      return this.geocoder;
    }

    await loadGoogleMaps();
    this.geocoder = new google.maps.Geocoder();
    return this.geocoder;
  }

  /**
   * Geocode an address string to coordinates
   */
  static async geocodeAddress(address: string): Promise<GeocodingResult> {
    if (!address || address.trim().length === 0) {
      throw { message: 'Address is required' } as GeocodingError;
    }

    try {
      const geocoder = await this.getGeocoder();

      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            resolve({
              latitude: result.geometry.location.lat(),
              longitude: result.geometry.location.lng(),
              place_id: result.place_id || '',
              formatted_address: result.formatted_address,
            });
          } else {
            reject({
              message: this.getStatusMessage(status),
              status,
            } as GeocodingError);
          }
        });
      });
    } catch (error: unknown) {
      console.error('[GeocodingService] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to geocode address';
      throw {
        message: errorMessage,
        status: 'UNKNOWN_ERROR',
      } as GeocodingError;
    }
  }

  /**
   * Build a full address string from components
   */
  static buildAddressString(
    address?: string | null,
    city?: string | null,
    state?: string | null,
    zipCode?: string | null
  ): string {
    const parts = [address, city, state, zipCode].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Geocode a customer and update their record
   */
  static async geocodeCustomer(
    customerId: string
  ): Promise<{ success: boolean; result?: GeocodingResult; error?: string }> {
    try {
      // Fetch customer data
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('address, city, state, zip_code')
        .eq('id', customerId)
        .single();

      if (fetchError) throw fetchError;
      if (!customer) throw new Error('Customer not found');

      const fullAddress = this.buildAddressString(
        customer.address,
        customer.city,
        customer.state,
        customer.zip_code
      );

      if (!fullAddress) {
        return { success: false, error: 'Customer has no address to geocode' };
      }

      // Geocode the address
      const result = await this.geocodeAddress(fullAddress);

      // Update customer with coordinates
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          latitude: result.latitude,
          longitude: result.longitude,
          place_id: result.place_id,
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      return { success: true, result };
    } catch (error: unknown) {
      console.error('[GeocodingService] Error geocoding customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to geocode customer';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Batch geocode multiple customers
   */
  static async batchGeocodeCustomers(
    customerIds: string[],
    onProgress?: (completed: number, total: number, current: string) => void
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ customerId: string; error: string }>;
  }> {
    let successful = 0;
    let failed = 0;
    const errors: Array<{ customerId: string; error: string }> = [];

    for (let i = 0; i < customerIds.length; i++) {
      const customerId = customerIds[i];
      onProgress?.(i + 1, customerIds.length, customerId);

      const result = await this.geocodeCustomer(customerId);

      if (result.success) {
        successful++;
      } else {
        failed++;
        errors.push({ customerId, error: result.error || 'Unknown error' });
      }

      // Rate limiting - wait 200ms between requests
      if (i < customerIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return { successful, failed, errors };
  }

  /**
   * Get customers without coordinates
   */
  static async getCustomersWithoutCoordinates(): Promise<
    Array<{ id: string; name: string; address: string | null }>
  > {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, address, city, state')
      .or('latitude.is.null,longitude.is.null')
      .not('address', 'is', null)
      .order('name');

    if (error) {
      console.error('[GeocodingService] Error fetching customers:', error);
      return [];
    }

    return (data || []).map((c) => ({
      id: c.id,
      name: c.name,
      address: this.buildAddressString(c.address, c.city, c.state),
    }));
  }

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<GeocodingResult> {
    try {
      const geocoder = await this.getGeocoder();

      return new Promise((resolve, reject) => {
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const result = results[0];
              resolve({
                latitude,
                longitude,
                place_id: result.place_id || '',
                formatted_address: result.formatted_address,
              });
            } else {
              reject({
                message: this.getStatusMessage(status),
                status,
              } as GeocodingError);
            }
          }
        );
      });
    } catch (error: unknown) {
      console.error('[GeocodingService] Reverse geocode error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reverse geocode';
      throw {
        message: errorMessage,
        status: 'UNKNOWN_ERROR',
      } as GeocodingError;
    }
  }

  private static getStatusMessage(status: google.maps.GeocoderStatus): string {
    switch (status) {
      case 'ZERO_RESULTS':
        return 'No results found for this address';
      case 'OVER_DAILY_LIMIT' as google.maps.GeocoderStatus:
        return 'Daily geocoding limit exceeded';
      case 'OVER_QUERY_LIMIT':
        return 'Too many requests. Please try again later';
      case 'REQUEST_DENIED':
        return 'Geocoding request denied. Check API key configuration';
      case 'INVALID_REQUEST':
        return 'Invalid address format';
      case 'UNKNOWN_ERROR':
        return 'Server error. Please try again';
      case 'ERROR':
        return 'Connection error. Please check your internet';
      default:
        return `Geocoding failed: ${status}`;
    }
  }
}
