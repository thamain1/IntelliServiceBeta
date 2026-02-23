import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { TechnicianMapData } from '../types/map.types';
import { getTechnicianStatus } from '../types/map.types';

interface TicketQueryRow {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string | null;
  scheduled_date: string | null;
  estimated_duration: number | null;
  customer?: { name?: string; address?: string | null; latitude?: number | null; longitude?: number | null } | null;
}

interface UseTechnicianLocationsOptions {
  pollingInterval?: number; // ms, default 30000
  enableRealtime?: boolean; // default true
}

interface UseTechnicianLocationsResult {
  technicians: TechnicianMapData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTechnicianLocations(
  options: UseTechnicianLocationsOptions = {}
): UseTechnicianLocationsResult {
  const { pollingInterval = 30000, enableRealtime = true } = options;

  const [technicians, setTechnicians] = useState<TechnicianMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadTechnicians = useCallback(async () => {
    try {
      // Fetch all active technicians
      const { data: techData, error: techError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .eq('is_active', true);

      if (techError) throw techError;

      // Fetch data for each technician in parallel
      const techsWithData = await Promise.all(
        (techData || []).map(async (tech) => {
          // Get latest location
          const { data: locationData } = await supabase
            .from('technician_locations')
            .select('*')
            .eq('technician_id', tech.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get active tickets assigned to this tech
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('id, ticket_number, title, status, priority, scheduled_date, estimated_duration, customer:customers!tickets_customer_id_fkey(name, address, latitude, longitude)')
            .eq('assigned_to', tech.id)
            .in('status', ['scheduled', 'in_progress'])
            .order('scheduled_date', { ascending: true });

          const location = locationData
            ? {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                accuracy: locationData.accuracy,
                timestamp: locationData.timestamp,
              }
            : null;

          const status = getTechnicianStatus(locationData?.timestamp ?? undefined);

          const activeTickets = (ticketData || []).map((ticket: TicketQueryRow) => ({
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority || 'normal',
            customer_name: ticket.customer?.name || 'Unknown',
            customer_address: ticket.customer?.address || null,
            customer_latitude: ticket.customer?.latitude || null,
            customer_longitude: ticket.customer?.longitude || null,
            scheduled_date: ticket.scheduled_date,
            estimated_duration: ticket.estimated_duration,
          }));

          return {
            id: tech.id,
            full_name: tech.full_name,
            phone: tech.phone,
            email: tech.email,
            location,
            activeTickets,
            status,
          } as TechnicianMapData;
        })
      );

      setTechnicians(techsWithData);
      setError(null);
    } catch (err: unknown) {
      console.error('Error loading technician locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load technician locations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup Supabase Realtime subscription
  const setupRealtime = useCallback(() => {
    if (!enableRealtime) return;

    // Clean up existing subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel('technician_locations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'technician_locations',
        },
        (payload) => {
          console.log('[Realtime] technician_locations changed:', payload);
          // Refresh all data when a location changes
          loadTechnicians();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to technician_locations');
        }
      });

    realtimeChannelRef.current = channel;
  }, [enableRealtime, loadTechnicians]);

  // Setup polling fallback
  const setupPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      console.log('[Polling] Refreshing technician locations...');
      loadTechnicians();
    }, pollingInterval);
  }, [pollingInterval, loadTechnicians]);

  // Initial load and setup
  useEffect(() => {
    loadTechnicians();
    setupRealtime();
    setupPolling();

    return () => {
      // Cleanup
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [loadTechnicians, setupRealtime, setupPolling]);

  return {
    technicians,
    loading,
    error,
    refresh: loadTechnicians,
  };
}
