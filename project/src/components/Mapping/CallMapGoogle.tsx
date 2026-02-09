import { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { loadGoogleMaps } from '../../lib/googleMapsLoader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Database } from '../../lib/database.types';
import type { TechnicianMapData } from '../../types/map.types';
import { getStatusColor } from '../../types/map.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  customers?: {
    name: string;
    address: string;
    city: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
    place_id: string | null;
  };
  profiles?: { full_name: string };
};

interface CallMapGoogleProps {
  statusFilter: string;
  tickets: Ticket[];
  technicians?: TechnicianMapData[];
  showTickets?: boolean;
  showTechnicians?: boolean;
  onTicketClick?: (ticketId: string) => void;
  onTechnicianClick?: (technicianId: string) => void;
  height?: string;
  selectedTechnicianId?: string | null;
}

export function CallMapGoogle({
  statusFilter,
  tickets,
  technicians = [],
  showTickets = true,
  showTechnicians = true,
  onTicketClick,
  onTechnicianClick,
  height = '600px',
  selectedTechnicianId,
}: CallMapGoogleProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [ticketMarkers, setTicketMarkers] = useState<google.maps.Marker[]>([]);
  const [technicianMarkers, setTechnicianMarkers] = useState<google.maps.Marker[]>([]);
  const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filtered tickets to prevent infinite loop in useEffect
  const activeTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Exclude completed, cancelled, closed tickets
      if (!ticket.status || ['completed', 'cancelled', 'closed_billed'].includes(ticket.status)) {
        return false;
      }
      // Apply status filter from dropdown
      return statusFilter === 'all' || ticket.status === statusFilter;
    });
  }, [tickets, statusFilter]);

  const ticketsWithCoords = useMemo(() => {
    return activeTickets.filter((ticket) => {
      const hasTicketCoords = ticket.latitude !== null && ticket.longitude !== null;
      const hasCustomerCoords = ticket.customers &&
        ticket.customers.latitude !== null &&
        ticket.customers.longitude !== null;
      return hasTicketCoords || hasCustomerCoords;
    });
  }, [activeTickets]);

  const ticketsWithoutCoords = useMemo(() => {
    return activeTickets.filter((ticket) => {
      const hasTicketCoords = ticket.latitude !== null && ticket.longitude !== null;
      const hasCustomerCoords = ticket.customers &&
        ticket.customers.latitude !== null &&
        ticket.customers.longitude !== null;
      return ticket.customers && !hasTicketCoords && !hasCustomerCoords;
    });
  }, [activeTickets]);

  const uniqueCustomersWithoutCoords = useMemo(() => {
    return Array.from(
      new Map(
        ticketsWithoutCoords
          .filter(t => t.customers)
          .map(t => [t.customer_id, t.customers])
      ).values()
    );
  }, [ticketsWithoutCoords]);

  const techniciansWithLocation = useMemo(() => {
    return technicians.filter(tech => tech.location !== null);
  }, [technicians]);

  useEffect(() => {
    console.log('Initializing map from useEffect');
    initializeMap();
  }, []);

  useEffect(() => {
    if (map) {
      updateMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, activeTickets, technicians, showTickets, showTechnicians]);

  // Center on selected technician
  useEffect(() => {
    if (map && selectedTechnicianId) {
      const tech = technicians.find(t => t.id === selectedTechnicianId);
      if (tech?.location) {
        map.setCenter({
          lat: tech.location.latitude,
          lng: tech.location.longitude,
        });
        map.setZoom(15);
      }
    }
  }, [map, selectedTechnicianId, technicians]);

  const initializeMap = async () => {
    if (!mapRef.current) {
      console.error('Map ref is not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Loading Google Maps API...');
      const google = await loadGoogleMaps();
      console.log('Google Maps API loaded successfully');

      const defaultCenter = { lat: 32.3547, lng: -89.3985 };

      console.log('Creating map instance...');
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: 11,
        center: defaultCenter,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
      });

      console.log('Map instance created successfully');
      setMap(newMap);
    } catch (err: unknown) {
      console.error('Error initializing map:', err);
      const error = err as { message?: string; stack?: string; name?: string };
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(error.message || 'Failed to load Google Maps. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const updateMarkers = async () => {
    if (!map) return;

    console.log('[Map] Updating markers...');
    console.log('[Map] Total active tickets:', activeTickets.length);
    console.log('[Map] Tickets with coords:', ticketsWithCoords.length);
    console.log('[Map] Technicians with location:', techniciansWithLocation.length);

    const google = await loadGoogleMaps();

    // Clear existing markers
    if (markerClusterer) {
      markerClusterer.clearMarkers();
    }

    ticketMarkers.forEach((marker) => marker.setMap(null));
    technicianMarkers.forEach((marker) => marker.setMap(null));

    const newTicketMarkers: google.maps.Marker[] = [];
    const newTechnicianMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    // Create ticket markers
    if (showTickets) {
      ticketsWithCoords.forEach((ticket) => {
        let lat = ticket.latitude;
        let lng = ticket.longitude;

        // Use customer coordinates as fallback
        if ((lat === null || lng === null) && ticket.customers) {
          lat = ticket.customers.latitude;
          lng = ticket.customers.longitude;
        }

        if (lat === null || lng === null) {
          return;
        }

        const position = {
          lat: parseFloat(lat.toString()),
          lng: parseFloat(lng.toString()),
        };

        const statusColors: Record<string, string> = {
          open: '#ef4444',
          scheduled: '#3b82f6',
          in_progress: '#eab308',
          completed: '#22c55e',
          closed_billed: '#10b981',
        };

        const color = statusColors[ticket.status ?? ''] || '#6b7280';

        const priorityScales: Record<string, number> = {
          urgent: 1.5,
          high: 1.2,
          normal: 1.0,
          low: 0.8,
        };

        const scale = priorityScales[ticket.priority ?? ''] || 1.0;

        try {
          const marker = new google.maps.Marker({
            position,
            map,
            title: `${ticket.ticket_number} - ${ticket.title}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8 * scale,
            },
            zIndex: ticket.priority === 'urgent' ? 1000 : ticket.priority === 'high' ? 900 : 800,
            optimized: false,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: createTicketInfoWindowContent(ticket),
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
            if (onTicketClick) {
              onTicketClick(ticket.id);
            }
          });

          newTicketMarkers.push(marker);
          bounds.extend(position);
        } catch (markerError) {
          console.error('[Map] Error creating marker for', ticket.ticket_number, ':', markerError);
        }
      });
    }

    // Create technician markers
    if (showTechnicians) {
      techniciansWithLocation.forEach((tech) => {
        if (!tech.location) return;

        const position = {
          lat: tech.location.latitude,
          lng: tech.location.longitude,
        };

        const color = getStatusColor(tech.status);
        const isSelected = tech.id === selectedTechnicianId;

        try {
          // Person icon SVG path
          const personPath = 'M12 2C9.24 2 7 4.24 7 7c0 2.76 2.24 5 5 5s5-2.24 5-5c0-2.76-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z';

          const marker = new google.maps.Marker({
            position,
            map,
            title: tech.full_name,
            icon: {
              path: personPath,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: isSelected ? '#000000' : '#ffffff',
              strokeWeight: isSelected ? 3 : 2,
              scale: isSelected ? 1.8 : 1.5,
              anchor: new google.maps.Point(12, 22),
            },
            zIndex: 2000, // Technicians always on top
            optimized: false,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: createTechnicianInfoWindowContent(tech),
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
            if (onTechnicianClick) {
              onTechnicianClick(tech.id);
            }
          });

          newTechnicianMarkers.push(marker);
          bounds.extend(position);
        } catch (markerError) {
          console.error('[Map] Error creating marker for technician', tech.full_name, ':', markerError);
        }
      });
    }

    setTicketMarkers(newTicketMarkers);
    setTechnicianMarkers(newTechnicianMarkers);

    const allMarkers = [...newTicketMarkers, ...newTechnicianMarkers];
    console.log('[Map] Created', newTicketMarkers.length, 'ticket markers and', newTechnicianMarkers.length, 'technician markers');

    if (allMarkers.length > 0 && !selectedTechnicianId) {
      if (allMarkers.length === 1) {
        const center = allMarkers[0].getPosition();
        map.setCenter(center!);
        map.setZoom(14);
      } else {
        map.fitBounds(bounds);
      }

      // Only cluster tickets if there are many
      if (newTicketMarkers.length > 50) {
        console.log('[Map] Creating marker clusterer for', newTicketMarkers.length, 'ticket markers');
        const clusterer = new MarkerClusterer({ map, markers: newTicketMarkers });
        setMarkerClusterer(clusterer);
      }
    }
  };

  const createTicketInfoWindowContent = (ticket: Ticket): string => {
    const statusLabels: Record<string, string> = {
      open: 'Open',
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      closed_billed: 'Closed & Billed',
    };

    const statusColors: Record<string, string> = {
      open: '#ef4444',
      scheduled: '#3b82f6',
      in_progress: '#eab308',
      completed: '#22c55e',
      closed_billed: '#10b981',
    };

    const statusLabel = statusLabels[ticket.status ?? ''] || ticket.status;
    const statusColor = statusColors[ticket.status ?? ''] || '#6b7280';

    return `
      <div style="padding: 12px; min-width: 250px; max-width: 350px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            ${ticket.ticket_number}
          </h3>
          <span style="
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            background-color: ${statusColor}20;
            color: ${statusColor};
          ">
            ${statusLabel}
          </span>
        </div>
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #374151;">
            ${ticket.title}
          </p>
          ${ticket.description ? `<p style="margin: 4px 0; font-size: 13px; color: #6b7280;">${ticket.description}</p>` : ''}
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
          <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
            <strong>Customer:</strong> ${ticket.customers?.name || 'N/A'}
          </p>
          ${ticket.customers?.address ? `
            <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Address:</strong> ${ticket.customers.address}, ${ticket.customers.city}, ${ticket.customers.state}
            </p>
          ` : ''}
          ${ticket.profiles ? `
            <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Technician:</strong> ${ticket.profiles.full_name}
            </p>
          ` : ''}
          ${ticket.scheduled_date ? `
            <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Scheduled:</strong> ${new Date(ticket.scheduled_date).toLocaleString()}
            </p>
          ` : ''}
        </div>
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <button
            onclick="window.dispatchEvent(new CustomEvent('viewTicket', { detail: '${ticket.id}' }))"
            style="
              width: 100%;
              padding: 8px 16px;
              background-color: #3b82f6;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            "
          >
            View Ticket Details
          </button>
        </div>
      </div>
    `;
  };

  const createTechnicianInfoWindowContent = (tech: TechnicianMapData): string => {
    const statusLabels: Record<string, string> = {
      online: 'Online',
      recent: 'Recently Active',
      offline: 'Offline',
    };

    const statusColors: Record<string, string> = {
      online: '#22c55e',
      recent: '#eab308',
      offline: '#ef4444',
    };

    const statusLabel = statusLabels[tech.status];
    const statusColor = statusColors[tech.status];

    const lastUpdate = tech.location?.timestamp
      ? new Date(tech.location.timestamp).toLocaleString()
      : 'Unknown';

    const activeJobsHtml = tech.activeTickets.length > 0
      ? tech.activeTickets.map(ticket => `
          <div style="padding: 8px; background: #f9fafb; border-radius: 4px; margin-bottom: 4px;">
            <p style="margin: 0; font-size: 13px; font-weight: 500; color: #374151;">
              ${ticket.ticket_number}: ${ticket.title}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
              ${ticket.customer_name}
            </p>
          </div>
        `).join('')
      : '<p style="margin: 0; font-size: 13px; color: #6b7280;">No active jobs</p>';

    return `
      <div style="padding: 12px; min-width: 280px; max-width: 380px;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #ef4444);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
          ">
            <span style="color: white; font-weight: bold; font-size: 18px;">
              ${tech.full_name.charAt(0)}
            </span>
          </div>
          <div style="flex: 1;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
              ${tech.full_name}
            </h3>
            <div style="display: flex; align-items: center; margin-top: 4px;">
              <div style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: ${statusColor};
                margin-right: 6px;
              "></div>
              <span style="font-size: 13px; color: ${statusColor}; font-weight: 500;">
                ${statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-bottom: 12px;">
          ${tech.phone ? `
            <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
              <strong>Phone:</strong> ${tech.phone}
            </p>
          ` : ''}
          <p style="margin: 4px 0; font-size: 13px; color: #6b7280;">
            <strong>Last Update:</strong> ${lastUpdate}
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 8px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #374151;">
            Active Jobs (${tech.activeTickets.length})
          </h4>
          ${activeJobsHtml}
        </div>

        ${tech.location ? `
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <button
              onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${tech.location.latitude},${tech.location.longitude}', '_blank')"
              style="
                width: 100%;
                padding: 8px 16px;
                background-color: #22c55e;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
              "
            >
              Get Directions
            </button>
          </div>
        ` : ''}
      </div>
    `;
  };

  return (
    <div className="space-y-4">
      {uniqueCustomersWithoutCoords.length > 0 && !loading && !error && showTickets && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {ticketsWithoutCoords.length} ticket{ticketsWithoutCoords.length !== 1 ? 's' : ''} from {uniqueCustomersWithoutCoords.length} customer{uniqueCustomersWithoutCoords.length !== 1 ? 's' : ''}{' '}
                  missing coordinates
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  These tickets cannot be displayed on the map. Add latitude and longitude coordinates to customer records to show them.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <div
          ref={mapRef}
          className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-700"
          style={{ height }}
        ></div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading Google Maps...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">Failed to load map</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && ticketsWithCoords.length === 0 && techniciansWithLocation.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 rounded-lg pointer-events-none">
            <div className="text-center max-w-md p-6">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 dark:text-gray-100 font-medium mb-2">
                No Location Data Available
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No tickets or technicians with location data to display.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          {showTickets && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>
                {ticketsWithCoords.length} ticket{ticketsWithCoords.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {showTechnicians && (
            <div className="flex items-center space-x-2">
              <span className="text-lg">👤</span>
              <span>
                {techniciansWithLocation.length} technician{techniciansWithLocation.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {showTickets && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Open</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>In Progress</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
