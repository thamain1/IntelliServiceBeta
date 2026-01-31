import { useEffect, useState, useCallback } from 'react';
import { Camera, Package, MessageSquare, CheckCircle, Clock, AlertTriangle, MapPin, Phone, User, Plus, X, Upload, History, Eye, AlertOctagon, PackageX, Navigation, NavigationOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { holdTicketForParts, reportTicketIssue } from '../../services/TicketHoldService';
import { GeolocationService, type GeolocationPosition } from '../../services/GeolocationService';

type ActiveTimer = {
  has_active_timer: boolean;
  time_log_id?: string;
  ticket_id?: string;
  ticket_number?: string;
  started_at?: string;
  elapsed_minutes?: number;
};

type OnSiteProgress = {
  ticket_id: string;
  elapsed_minutes: number;
  estimated_onsite_minutes: number;
  percent: number;
  is_overrun: boolean;
};

type Ticket = {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  scheduled_date: string;
  hours_onsite: number;
  hold_active?: boolean;
  hold_type?: string | null;
  hold_parts_active?: boolean;
  hold_issue_active?: boolean;
  revisit_required?: boolean;
  customers: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  equipment: {
    equipment_type: string;
    model_number: string;
  } | null;
};

type TicketUpdate = {
  id: string;
  update_type: string;
  notes: string;
  progress_percent: number;
  created_at: string;
  profiles: {
    full_name: string;
  };
};

type TicketPhoto = {
  id: string;
  photo_url: string;
  photo_type: string;
  caption: string;
  created_at: string;
};

type PartUsed = {
  id: string;
  quantity: number;
  notes: string;
  created_at: string;
  parts: {
    part_number: string;
    name: string;
    unit_price: number;
  };
};

type Part = {
  id: string;
  part_number: string;
  name: string;
  unit_price: number;
};

export function TechnicianTicketView() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [completedTickets, setCompletedTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'readonly'>('edit');
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<TicketUpdate[]>([]);
  const [photos, setPhotos] = useState<TicketPhoto[]>([]);
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [onSiteProgress, setOnSiteProgress] = useState<OnSiteProgress | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [updateFormData, setUpdateFormData] = useState({
    update_type: 'progress_note' as const,
    notes: '',
    progress_percent: 0,
    status: '',
  });

  const [partsFormData, setPartsFormData] = useState({
    part_id: '',
    quantity: 1,
    notes: '',
  });

  const [photoFormData, setPhotoFormData] = useState({
    photo_url: '',
    photo_type: 'during' as const,
    caption: '',
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Location sharing state
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<GeolocationPosition | null>(null);

  useEffect(() => {
    loadMyTickets();
    loadCompletedTickets();
    checkActiveTimer();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedTicket) {
      console.log('Selected ticket changed, loading details for:', selectedTicket.id);
      loadTicketDetails(selectedTicket.id);
      loadOnSiteProgress(selectedTicket.id);
    } else {
      console.log('No ticket selected');
      setOnSiteProgress(null);
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (!selectedTicket || viewMode === 'readonly') return;
    const interval = setInterval(() => {
      loadOnSiteProgress(selectedTicket.id);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedTicket, viewMode]);

  const checkActiveTimer = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase.rpc('fn_get_active_timer', { p_tech_id: profile.id });
      if (error) throw error;
      setActiveTimer(data as ActiveTimer);
    } catch (error) {
      console.error('Error checking active timer:', error);
    }
  };

  const loadOnSiteProgress = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('vw_ticket_onsite_progress')
        .select('*')
        .eq('ticket_id', ticketId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setOnSiteProgress(data as OnSiteProgress);
      }
    } catch (error) {
      console.error('Error loading onsite progress:', error);
    }
  };

  const loadCompletedTickets = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, customers!tickets_customer_id_fkey(name, phone, email, address), equipment(equipment_type, model_number)')
        .eq('assigned_to', profile.id)
        .in('status', ['completed', 'closed_billed'])
        .order('completed_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      setCompletedTickets(data || []);
    } catch (error) {
      console.error('Error loading completed tickets:', error);
    }
  };

  const loadMyTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, customers!tickets_customer_id_fkey(name, phone, email, address), equipment(equipment_type, model_number)')
        .eq('assigned_to', profile?.id)
        .in('status', ['open', 'scheduled', 'in_progress'])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      console.log('Loaded tickets:', data?.length || 0);
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      alert('Error loading tickets: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId: string) => {
    console.log('Loading ticket details for:', ticketId);
    try {
      const [updatesRes, photosRes, partsRes] = await Promise.all([
        supabase
          .from('ticket_updates')
          .select('*, profiles(full_name)')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false }),
        supabase
          .from('ticket_photos')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false }),
        supabase
          .from('ticket_parts_used')
          .select('*, parts(part_number, name, unit_price)')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false }),
      ]);

      if (updatesRes.error) throw updatesRes.error;
      if (photosRes.error) throw photosRes.error;
      if (partsRes.error) throw partsRes.error;

      setUpdates(updatesRes.data || []);
      setPhotos(photosRes.data || []);
      setPartsUsed(partsRes.data || []);

      if (viewMode !== 'readonly') {
        await loadTruckInventory();
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      alert('Error loading ticket details: ' + (error as Error).message);
    }
  };

  const loadTruckInventory = async () => {
    if (!profile?.id) return;
    try {
      const { data: truckParts, error: truckError } = await supabase
        .from('vw_technician_truck_inventory')
        .select('part_id, part_number, part_name, unit_price, qty_on_hand')
        .eq('technician_id', profile.id);

      if (truckError) {
        console.log('No truck inventory view available, falling back to all parts');
        const { data: allParts, error: allPartsError } = await supabase
          .from('parts')
          .select('id, part_number, name, unit_price')
          .order('name', { ascending: true });
        if (allPartsError) throw allPartsError;
        setAvailableParts(allParts || []);
        return;
      }

      if (truckParts && truckParts.length > 0) {
        const mappedParts = truckParts.map(p => ({
          id: p.part_id,
          part_number: p.part_number,
          name: `${p.part_name} (${p.qty_on_hand} on truck)`,
          unit_price: p.unit_price,
        }));
        setAvailableParts(mappedParts);
      } else {
        const { data: allParts, error: allPartsError } = await supabase
          .from('parts')
          .select('id, part_number, name, unit_price')
          .order('name', { ascending: true });
        if (allPartsError) throw allPartsError;
        setAvailableParts(allParts || []);
      }
    } catch (error) {
      console.error('Error loading truck inventory:', error);
    }
  };

  const handleStartWork = async () => {
    if (!selectedTicket || !profile?.id) return;

    if (activeTimer?.has_active_timer && activeTimer.ticket_id !== selectedTicket.id) {
      alert(`You are currently timing Ticket ${activeTimer.ticket_number}. End it first.`);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('fn_start_ticket_work', {
        p_tech_id: profile.id,
        p_ticket_id: selectedTicket.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; error?: string };
      if (!result.success) {
        alert(result.message);
        return;
      }

      await supabase.from('ticket_updates').insert([{
        ticket_id: selectedTicket.id,
        technician_id: profile.id,
        update_type: 'arrived',
        notes: 'Arrived on site and started work',
        progress_percent: 0,
        status: 'in_progress',
      }]);

      await checkActiveTimer();
      await loadMyTickets();
      await loadTicketDetails(selectedTicket.id);
      await loadOnSiteProgress(selectedTicket.id);

      // Send immediate location ping when starting work on a ticket
      // This provides dispatcher with fresh location when tech arrives on site
      if (isLocationSharing) {
        // Already sharing - just send an immediate ping
        await sendImmediateLocationPing();
      } else {
        // Not sharing yet - start location sharing (which also sends initial ping)
        await startLocationSharing();
      }
    } catch (error) {
      console.error('Error starting work:', error);
      alert('Failed to start work: ' + (error as Error).message);
    }
  };

  const handleEndWork = async (markComplete: boolean = false) => {
    if (!selectedTicket || !profile?.id) return;

    try {
      const { data, error } = await supabase.rpc('fn_end_ticket_work', {
        p_tech_id: profile.id,
        p_ticket_id: selectedTicket.id,
      });

      if (error) throw error;

      if (markComplete) {
        await supabase
          .from('tickets')
          .update({ status: 'completed', completed_date: new Date().toISOString() })
          .eq('id', selectedTicket.id);
      }

      await checkActiveTimer();
      await loadMyTickets();
      await loadCompletedTickets();
      if (!markComplete) {
        await loadTicketDetails(selectedTicket.id);
      }
    } catch (error) {
      console.error('Error ending work:', error);
      alert('Failed to end work: ' + (error as Error).message);
    }
  };

  const handleNeedParts = async () => {
    if (!selectedTicket) return;

    const notes = prompt('Please describe the parts needed:');
    if (!notes) return;

    const urgencyInput = prompt('Urgency (low/medium/high/critical):', 'medium');
    const urgency = (urgencyInput?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high' | 'critical';

    try {
      const result = await holdTicketForParts({
        ticketId: selectedTicket.id,
        urgency,
        notes,
        summary: 'Waiting for parts',
        parts: [], // Parts list can be added later
      });

      if (result.success) {
        alert('Ticket placed on hold for parts. Timer has been stopped.');
        await loadTicketDetails(selectedTicket.id);
        await loadMyTickets();
        await checkActiveTimer();
      } else {
        alert('Failed to hold ticket: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error holding ticket for parts:', error);
      alert('Failed to hold ticket for parts: ' + (error as Error).message);
    }
  };

  const handleReportIssue = async () => {
    if (!selectedTicket) return;

    const description = prompt('Please describe the issue:');
    if (!description) return;

    const categoryInput = prompt('Category (equipment_failure/access_denied/safety_concern/scope_change/customer_unavailable/technical_limitation/other):', 'other');
    const category = (categoryInput?.toLowerCase() || 'other') as 'equipment_failure' | 'access_denied' | 'safety_concern' | 'scope_change' | 'customer_unavailable' | 'technical_limitation' | 'other';

    const severityInput = prompt('Severity (low/medium/high/critical):', 'medium');
    const severity = (severityInput?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high' | 'critical';

    try {
      const result = await reportTicketIssue({
        ticketId: selectedTicket.id,
        category,
        severity,
        description,
        summary: `Issue reported - ${category}`,
      });

      if (result.success) {
        alert('Issue reported. Ticket placed on hold. Timer has been stopped.');
        await loadTicketDetails(selectedTicket.id);
        await loadMyTickets();
        await checkActiveTimer();
      } else {
        alert('Failed to report issue: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Failed to report issue: ' + (error as Error).message);
    }
  };

  // Location sharing functions - 15 minute interval (matches Time Clock)
  const LOCATION_UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

  const startLocationSharing = async () => {
    if (!profile?.id) return;

    if (!GeolocationService.isSupported()) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationError(null);

    const started = await GeolocationService.startAutoUpdates(
      profile.id,
      LOCATION_UPDATE_INTERVAL, // Update every 15 minutes
      (position) => {
        setLastLocation(position);
        setLocationError(null);
        console.log('[Location] Updated:', position.latitude, position.longitude);
      },
      (error) => {
        setLocationError(error.message);
        console.error('[Location] Error:', error.message);
      }
    );

    if (started) {
      setIsLocationSharing(true);
    }
  };

  // Send immediate location ping without affecting the interval timer
  const sendImmediateLocationPing = async () => {
    if (!profile?.id) return;

    try {
      const position = await GeolocationService.getCurrentPosition();
      await GeolocationService.saveLocation(profile.id, position);
      setLastLocation(position);
      console.log('[Location] Immediate ping sent:', position.latitude, position.longitude);
    } catch (error) {
      console.error('[Location] Failed to send immediate ping:', error);
    }
  };

  const stopLocationSharing = () => {
    GeolocationService.stopAutoUpdates();
    setIsLocationSharing(false);
    setLastLocation(null);
  };

  const toggleLocationSharing = async () => {
    if (isLocationSharing) {
      stopLocationSharing();
    } else {
      await startLocationSharing();
    }
  };

  // Cleanup location sharing on unmount
  useEffect(() => {
    return () => {
      if (isLocationSharing) {
        GeolocationService.stopAutoUpdates();
      }
    };
  }, [isLocationSharing]);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Adding update for ticket:', selectedTicket.id);
      console.log('User ID:', user.id);
      console.log('Update data:', updateFormData);

      const updateData: any = {
        ticket_id: selectedTicket.id,
        technician_id: user.id,
        update_type: updateFormData.update_type,
        notes: updateFormData.notes,
        progress_percent: updateFormData.progress_percent,
      };

      // Only include status if it's not empty
      if (updateFormData.status && updateFormData.status !== '') {
        updateData.status = updateFormData.status;
      }

      const { error: updateError } = await supabase.from('ticket_updates').insert([updateData]);

      if (updateError) {
        console.error('Error inserting update:', updateError);
        throw updateError;
      }

      if (updateFormData.status) {
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({
            status: updateFormData.status,
            updated_at: new Date().toISOString(),
            assigned_to: selectedTicket.assigned_to
          })
          .eq('id', selectedTicket.id);

        if (ticketError) {
          console.error('Error updating ticket status:', ticketError);
          throw ticketError;
        }
      }

      // Reload data before closing modal
      await loadTicketDetails(selectedTicket.id);
      await loadMyTickets();

      setShowUpdateModal(false);
      setUpdateFormData({
        update_type: 'progress_note',
        notes: '',
        progress_percent: 0,
        status: '',
      });
    } catch (error) {
      console.error('Error adding update:', error);
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      alert('Failed to add update: ' + errorMessage);
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const { error } = await supabase.from('ticket_parts_used').insert([{
        ticket_id: selectedTicket.id,
        part_id: partsFormData.part_id,
        quantity: partsFormData.quantity,
        installed_by: profile?.id,
        notes: partsFormData.notes,
      }]);

      if (error) throw error;

      // Reload data before closing modal
      await loadTicketDetails(selectedTicket.id);

      setShowPartsModal(false);
      setPartsFormData({
        part_id: '',
        quantity: 1,
        notes: '',
      });
    } catch (error) {
      console.error('Error adding part:', error);
      alert('Failed to add part. Please try again.');
    }
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!selectedFile) {
      alert('Please select a photo to upload');
      return;
    }

    setUploadingPhoto(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${selectedTicket.id}/${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName, 'Size:', selectedFile.size, 'Type:', selectedFile.type);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ticket-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      const { data: urlData } = supabase.storage
        .from('ticket-photos')
        .getPublicUrl(fileName);

      console.log('Public URL:', urlData.publicUrl);

      // Ensure photo_type has a valid value
      const photoType = photoFormData.photo_type || 'during';
      const validPhotoTypes = ['before', 'during', 'after', 'issue', 'equipment', 'other'];
      if (!validPhotoTypes.includes(photoType)) {
        throw new Error(`Invalid photo_type: ${photoType}`);
      }

      console.log('Inserting record with photo_type:', photoType);

      const { error } = await supabase.from('ticket_photos').insert([{
        ticket_id: selectedTicket.id,
        uploaded_by: profile?.id,
        photo_url: urlData.publicUrl,
        photo_type: photoType,
        caption: photoFormData.caption || null,
      }]);

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      // Reload data before closing modal
      await loadTicketDetails(selectedTicket.id);

      setShowPhotoModal(false);
      setPhotoFormData({
        photo_url: '',
        photo_type: 'during',
        caption: '',
      });
      setSelectedFile(null);
      alert('Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to upload photo: ${errorMessage}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'badge-blue';
      case 'scheduled': return 'badge-blue';
      case 'in_progress': return 'badge-yellow';
      case 'completed': return 'badge-green';
      case 'cancelled': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'arrived': return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'needs_parts': return <Package className="w-5 h-5 text-orange-600" />;
      case 'issue': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedTicket) {
    const isReadonly = viewMode === 'readonly';
    const isCurrentlyTiming = activeTimer?.has_active_timer && activeTimer.ticket_id === selectedTicket.id;
    const hasAnotherTimerActive = activeTimer?.has_active_timer && activeTimer.ticket_id !== selectedTicket.id;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedTicket(null);
                setViewMode('edit');
              }}
              className="btn btn-outline"
            >
              ← Back to My Tickets
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedTicket.ticket_number}
                </h1>
                {selectedTicket.hold_parts_active && (
                  <span className="badge badge-yellow flex items-center space-x-1">
                    <PackageX className="w-3 h-3" />
                    <span>On Hold - Parts</span>
                  </span>
                )}
                {selectedTicket.hold_issue_active && (
                  <span className="badge badge-red flex items-center space-x-1">
                    <AlertOctagon className="w-3 h-3" />
                    <span>On Hold - Issue</span>
                  </span>
                )}
                {isReadonly && (
                  <span className="badge badge-gray flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>View Only</span>
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">{selectedTicket.title}</p>
            </div>
          </div>
          <span className={`badge ${getStatusColor(selectedTicket.status)}`}>
            {selectedTicket.status.replace('_', ' ')}
          </span>
        </div>

        {onSiteProgress && onSiteProgress.percent > 0 && !isReadonly && (
          <div className={`card p-4 ${onSiteProgress.is_overrun ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${onSiteProgress.is_overrun ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                On-Site Progress {onSiteProgress.is_overrun && '- OVERRUN'}
              </span>
              <span className={`text-sm ${onSiteProgress.is_overrun ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                {onSiteProgress.elapsed_minutes} / {onSiteProgress.estimated_onsite_minutes} min ({onSiteProgress.percent}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  onSiteProgress.is_overrun
                    ? 'bg-red-600'
                    : onSiteProgress.percent > 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(onSiteProgress.percent, 100)}%` }}
              />
            </div>
            {onSiteProgress.is_overrun && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                This job has exceeded the estimated time by {onSiteProgress.elapsed_minutes - onSiteProgress.estimated_onsite_minutes} minutes.
              </p>
            )}
          </div>
        )}

        {hasAnotherTimerActive && !isReadonly && (
          <div className="card p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                You are currently timing <strong>Ticket {activeTimer?.ticket_number}</strong>.
                End or complete that ticket before starting work on this one.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Job Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white">{selectedTicket.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled</p>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedTicket.scheduled_date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
                    <p className={`font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </p>
                  </div>
                </div>
                {selectedTicket.equipment && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Equipment</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedTicket.equipment.equipment_type} - {selectedTicket.equipment.model_number}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Updates</h2>
                {!isReadonly && (
                  <button
                    onClick={() => setShowUpdateModal(true)}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Update</span>
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {updates.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No updates yet</p>
                ) : (
                  updates.map((update) => (
                    <div key={update.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        {getUpdateTypeIcon(update.update_type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {update.update_type.replace('_', ' ')}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(update.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{update.notes}</p>
                          {update.progress_percent > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {update.progress_percent}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${update.progress_percent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Photos</h2>
                {!isReadonly && (
                  <button
                    onClick={() => setShowPhotoModal(true)}
                    className="btn btn-outline flex items-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Add Photo</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.length === 0 ? (
                  <p className="col-span-full text-gray-500 dark:text-gray-400 text-center py-8">
                    No photos yet
                  </p>
                ) : (
                  photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        {photo.photo_url ? (
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || 'Ticket photo'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="text-xs badge badge-gray">{photo.photo_type}</span>
                        {photo.caption && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Parts Used</h2>
                {!isReadonly && (
                  <button
                    onClick={() => setShowPartsModal(true)}
                    className="btn btn-outline flex items-center space-x-2"
                  >
                    <Package className="w-4 h-4" />
                    <span>Add Part</span>
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {partsUsed.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No parts used yet</p>
                ) : (
                  partsUsed.map((part) => (
                    <div key={part.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {part.parts.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {part.parts.part_number} - Qty: {part.quantity}
                        </p>
                        {part.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{part.notes}</p>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${(part.parts.unit_price * part.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {partsUsed.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-gray-900 dark:text-white">Total Parts Cost</span>
                    <span className="text-gray-900 dark:text-white">
                      ${partsUsed.reduce((sum, p) => sum + (p.parts.unit_price * p.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Customer Info</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedTicket.customers.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <a
                      href={`tel:${selectedTicket.customers.phone}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {selectedTicket.customers.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedTicket.customers.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Time Tracking</h2>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`badge ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>
                {selectedTicket.hours_onsite > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Billable Hours</span>
                    <span className="font-bold text-blue-600">
                      {selectedTicket.hours_onsite.toFixed(2)} hrs
                    </span>
                  </div>
                )}
              </div>

              {!isReadonly && (
                <>
                  {/* Location Sharing Status */}
                  <div className={`p-3 rounded-lg border ${
                    isLocationSharing
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {isLocationSharing ? (
                          <Navigation className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <NavigationOff className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          isLocationSharing
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {isLocationSharing ? 'Location Sharing Active' : 'Location Sharing Off'}
                        </span>
                      </div>
                      <button
                        onClick={toggleLocationSharing}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isLocationSharing ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isLocationSharing ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {locationError && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{locationError}</p>
                    )}
                    {lastLocation && isLocationSharing && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Last update: {new Date(lastLocation.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    {(selectedTicket.status === 'open' || selectedTicket.status === 'scheduled') && !isCurrentlyTiming && (
                      <button
                        onClick={handleStartWork}
                        disabled={hasAnotherTimerActive || selectedTicket.hold_active}
                        className={`w-full btn flex items-center justify-center space-x-2 ${
                          (hasAnotherTimerActive || selectedTicket.hold_active)
                            ? 'btn-outline opacity-50 cursor-not-allowed'
                            : 'btn-primary'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>
                          {selectedTicket.hold_active ? 'On Hold - Cannot Start' : 'Start Work (Begin Timer)'}
                        </span>
                      </button>
                    )}
                    {isCurrentlyTiming && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2 text-green-700 dark:text-green-400 mb-2">
                          <Clock className="w-4 h-4 animate-pulse" />
                          <span className="font-medium">Timer Running</span>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          Started: {activeTimer?.started_at && new Date(activeTimer.started_at).toLocaleTimeString()}
                        </p>
                        <button
                          onClick={() => handleEndWork(false)}
                          className="w-full mt-2 btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Stop Timer (Pause Work)
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleNeedParts}
                      disabled={selectedTicket.hold_parts_active}
                      className={`w-full btn flex items-center justify-center space-x-2 ${
                        selectedTicket.hold_parts_active
                          ? 'btn-outline opacity-50 cursor-not-allowed'
                          : 'btn-outline'
                      }`}
                    >
                      <PackageX className="w-4 h-4" />
                      <span>{selectedTicket.hold_parts_active ? 'On Hold - Parts' : 'Need Parts'}</span>
                    </button>
                    <button
                      onClick={handleReportIssue}
                      disabled={selectedTicket.hold_issue_active}
                      className={`w-full btn flex items-center justify-center space-x-2 ${
                        selectedTicket.hold_issue_active
                          ? 'btn-outline opacity-50 cursor-not-allowed'
                          : 'btn-outline'
                      }`}
                    >
                      <AlertOctagon className="w-4 h-4" />
                      <span>{selectedTicket.hold_issue_active ? 'On Hold - Issue' : 'Report Issue'}</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (isCurrentlyTiming) {
                          await handleEndWork(true);
                        }
                        setUpdateFormData({ ...updateFormData, update_type: 'completed', status: 'completed' });
                        setShowUpdateModal(true);
                      }}
                      className="w-full btn btn-primary flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Complete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {showUpdateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Update</h2>
                <button onClick={() => setShowUpdateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Update Type *
                  </label>
                  <select
                    required
                    value={updateFormData.update_type}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, update_type: e.target.value as any })}
                    className="input"
                  >
                    <option value="progress_note">Progress Note</option>
                    <option value="arrived">Arrived On Site</option>
                    <option value="needs_parts">Needs Parts</option>
                    <option value="issue">Issue/Problem</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes *
                  </label>
                  <textarea
                    required
                    value={updateFormData.notes}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, notes: e.target.value })}
                    className="input"
                    rows={4}
                    placeholder="Describe the update..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Progress %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={updateFormData.progress_percent}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, progress_percent: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>

                {updateFormData.update_type === 'completed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Status
                    </label>
                    <select
                      value={updateFormData.status}
                      onChange={(e) => setUpdateFormData({ ...updateFormData, status: e.target.value })}
                      className="input"
                    >
                      <option value="">Keep Current</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setShowUpdateModal(false)} className="btn btn-outline flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Add Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPartsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Part Used</h2>
                <button onClick={() => setShowPartsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddPart} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Part *
                  </label>
                  <select
                    required
                    value={partsFormData.part_id}
                    onChange={(e) => setPartsFormData({ ...partsFormData, part_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Part</option>
                    {availableParts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.part_number} - {part.name} (${part.unit_price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={partsFormData.quantity}
                    onChange={(e) => setPartsFormData({ ...partsFormData, quantity: parseFloat(e.target.value) || 1 })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={partsFormData.notes}
                    onChange={(e) => setPartsFormData({ ...partsFormData, notes: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Installation notes..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setShowPartsModal(false)} className="btn btn-outline flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Add Part
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPhotoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Photo</h2>
                <button onClick={() => setShowPhotoModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handlePhotoUpload} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Photo Type *
                  </label>
                  <select
                    required
                    value={photoFormData.photo_type}
                    onChange={(e) => setPhotoFormData({ ...photoFormData, photo_type: e.target.value as any })}
                    className="input"
                  >
                    <option value="before">Before</option>
                    <option value="during">During Work</option>
                    <option value="after">After</option>
                    <option value="issue">Issue/Problem</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Photo *
                  </label>
                  <div className="mt-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-900 dark:text-white
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        dark:file:bg-blue-900/20 dark:file:text-blue-400
                        cursor-pointer"
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Caption
                  </label>
                  <input
                    type="text"
                    value={photoFormData.caption}
                    onChange={(e) => setPhotoFormData({ ...photoFormData, caption: e.target.value })}
                    className="input"
                    placeholder="Photo description..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoModal(false);
                      setSelectedFile(null);
                    }}
                    className="btn btn-outline flex-1"
                    disabled={uploadingPhoto}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={uploadingPhoto || !selectedFile}
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your assigned service tickets
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`btn ${showHistory ? 'btn-primary' : 'btn-outline'} flex items-center space-x-2`}
        >
          <History className="w-4 h-4" />
          <span>{showHistory ? 'Show Active' : 'Service History'}</span>
        </button>
      </div>

      {activeTimer?.has_active_timer && (
        <div className="card p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-green-600 animate-pulse" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Timer Active on {activeTimer.ticket_number}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Running for {Math.round(activeTimer.elapsed_minutes || 0)} minutes
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                // Check if we have a valid ticket_id
                if (!activeTimer?.ticket_id) {
                  console.error('No ticket_id in activeTimer:', activeTimer);
                  // There's a timer running but no ticket associated - this is a stale/orphan timer
                  const shouldStop = confirm(
                    'This timer is not linked to any ticket (possibly a stale timer). Would you like to stop it?'
                  );
                  if (shouldStop && activeTimer?.time_log_id) {
                    try {
                      await supabase
                        .from('time_logs')
                        .update({ clock_out_time: new Date().toISOString(), status: 'completed' })
                        .eq('id', activeTimer.time_log_id);
                      await checkActiveTimer();
                      alert('Stale timer stopped.');
                    } catch (error) {
                      console.error('Error stopping timer:', error);
                      alert('Could not stop timer. Please try manually in the database.');
                    }
                  }
                  return;
                }

                let ticket = tickets.find(t => t.id === activeTimer.ticket_id);
                if (ticket) {
                  setSelectedTicket(ticket);
                  setViewMode('edit');
                } else {
                  // Ticket not in local list, fetch it directly
                  console.log('Fetching ticket directly, id:', activeTimer.ticket_id);
                  try {
                    const { data, error } = await supabase
                      .from('tickets')
                      .select('*, customers!tickets_customer_id_fkey(name, phone, email, address), equipment(equipment_type, model_number)')
                      .eq('id', activeTimer.ticket_id)
                      .single();

                    console.log('Fetch result:', { data, error });

                    if (error) {
                      console.error('Database error:', error);
                      alert(`Could not load ticket: ${error.message}`);
                      return;
                    }
                    if (data) {
                      setSelectedTicket(data as Ticket);
                      setViewMode('edit');
                    } else {
                      alert('Ticket not found in database.');
                    }
                  } catch (error: any) {
                    console.error('Error fetching ticket:', error);
                    alert(`Could not load ticket: ${error?.message || 'Unknown error'}`);
                  }
                }
              }}
              className="btn btn-outline text-green-700 border-green-300"
            >
              View Ticket
            </button>
          </div>
        </div>
      )}

      {!showHistory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.length === 0 ? (
            <div className="col-span-full card p-12 text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No active tickets assigned</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setViewMode('edit');
                }}
                className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.ticket_number}</p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {ticket.title}
                    </h3>
                  </div>
                  <span className={`badge ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{ticket.customers.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{ticket.customers.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {new Date(ticket.scheduled_date).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Completed Tickets</h2>
          {completedTickets.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No completed tickets yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setViewMode('readonly');
                  }}
                  className="card p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-80 hover:opacity-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.ticket_number}</p>
                        <Eye className="w-3 h-3 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {ticket.title}
                      </h3>
                    </div>
                    <span className={`badge ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{ticket.customers?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {ticket.completed_date
                          ? new Date(ticket.completed_date).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
                    Click to view details (read-only)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
