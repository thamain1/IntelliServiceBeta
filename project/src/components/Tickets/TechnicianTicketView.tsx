import { useEffect, useState, useRef } from 'react';
import { Camera, Package, MessageSquare, CheckCircle, Clock, AlertTriangle, MapPin, Phone, User, Plus, X, History, Eye, AlertOctagon, PackageX, Navigation, ClipboardList, Brain, Wrench, Zap, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { holdTicketForParts, reportTicketIssue } from '../../services/TicketHoldService';
import { LiveDataService, EquipmentIntelligence } from '../../services/agents/LiveDataService';

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
  description: string | null;
  status: string | null;
  priority: string | null;
  scheduled_date: string | null;
  hours_onsite: number | null;
  hold_active?: boolean | null;
  hold_type?: string | null;
  hold_parts_active?: boolean;
  hold_issue_active?: boolean;
  revisit_required?: boolean | null;
  assigned_to?: string | null;
  completed_date?: string | null;
  site_contact_name?: string | null;
  site_contact_phone?: string | null;
  customer_id?: string | null;
  equipment_id?: string | null;
  customers: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  equipment: {
    equipment_type: string | null;
    model_number: string | null;
  } | null;
};

type TicketUpdate = {
  id: string;
  update_type?: string | null;
  notes: string | null;
  progress_percent: number | null;
  created_at: string | null;
  status?: string | null;
  profiles: {
    full_name: string | null;
  } | null;
};

type TicketPhoto = {
  id: string;
  photo_url: string;
  photo_type: string | null;
  caption: string | null;
  created_at: string | null;
};

type PartUsed = {
  id: string;
  quantity: number;
  notes: string | null;
  created_at: string | null;
  parts: {
    part_number: string;
    name: string;
    unit_price: number | null;
  };
};

type PlannedPart = {
  id: string;
  quantity: number;
  description: string;
  unit_price: number | null;
  line_total: number | null;
  parts: {
    part_number: string;
    name: string;
  } | null;
};

type Part = {
  id: string | null;
  part_number: string | null;
  name: string;
  unit_price: number | null;
};

type StandardCode = {
  code: string;
  label: string;
  description: string | null;
  category: string | null;
  is_critical_safety: boolean | null;
  triggers_sales_lead: boolean | null;
  triggers_urgent_review: boolean | null;
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
  const [plannedParts, setPlannedParts] = useState<PlannedPart[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [onSiteProgress, setOnSiteProgress] = useState<OnSiteProgress | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Co-Pilot Equipment Intelligence state
  const [equipmentIntel, setEquipmentIntel] = useState<EquipmentIntelligence | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [noEquipmentRegistered, setNoEquipmentRegistered] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showClockInAlert, setShowClockInAlert] = useState(false);
  const [isShiftClockedIn, setIsShiftClockedIn] = useState(false);
  const [showCompletionSuccess, setShowCompletionSuccess] = useState(false);
  const [showNeedPartsModal, setShowNeedPartsModal] = useState(false);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [problemCodes, setProblemCodes] = useState<StandardCode[]>([]);
  const [resolutionCodes, setResolutionCodes] = useState<StandardCode[]>([]);
  const [selectedProblemCode, setSelectedProblemCode] = useState('');
  const [selectedResolutionCode, setSelectedResolutionCode] = useState('');
  const [showGasLeakWarning, setShowGasLeakWarning] = useState(false);
  const [needPartsFormData, setNeedPartsFormData] = useState({
    part_id: '',
    quantity: 1,
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    notes: '',
  });
  const [needPartsLoading, setNeedPartsLoading] = useState(false);

  const [updateFormData, setUpdateFormData] = useState<{
    update_type: 'progress_note' | 'completed' | 'status_change';
    notes: string;
    progress_percent: number;
    status: string;
  }>({
    update_type: 'progress_note',
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

  useEffect(() => {
    loadMyTickets();
    loadCompletedTickets();
    checkActiveTimer();
    checkShiftClockIn();
    loadStandardCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (selectedTicket) {
      console.log('Selected ticket changed, loading details for:', selectedTicket.id);
      loadTicketDetails(selectedTicket.id);
      loadOnSiteProgress(selectedTicket.id);
      // Re-check shift clock-in status when viewing a ticket
      checkShiftClockIn();
      // Equipment Intelligence is loaded by dedicated useEffect below
    } else {
      console.log('No ticket selected');
      setOnSiteProgress(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicket]);

  // Co-Pilot: Fetch equipment intelligence when ticket selected
  // Check both customer_id and customers.id (nested relation)
  const customerId = selectedTicket?.customer_id || (selectedTicket?.customers as { id?: string } | null | undefined)?.id;
  const ticketId = selectedTicket?.id;

  // Track previous values to detect changes
  const prevTicketIdRef = useRef<string | undefined>();
  const prevCustomerIdRef = useRef<string | undefined>();

  useEffect(() => {
    const prevTicketId = prevTicketIdRef.current;
    const prevCustomerId = prevCustomerIdRef.current;
    prevTicketIdRef.current = ticketId;
    prevCustomerIdRef.current = customerId;

    console.log('[Co-Pilot] Effect triggered:', {
      ticketId,
      customerId,
      prevTicketId,
      prevCustomerId,
      ticketChanged: ticketId !== prevTicketId,
      customerChanged: customerId !== prevCustomerId,
    });

    // Only clear equipment intel when ticket actually deselected
    if (!ticketId) {
      console.log('[Co-Pilot] No ticket selected, clearing intel');
      setEquipmentIntel(null);
      setIntelError(null);
      setLoadingIntel(false);
      setNoEquipmentRegistered(false);
      return;
    }

    // If no customer ID, don't fetch but don't clear existing data
    if (!customerId) {
      console.log('[Co-Pilot] No customer ID for ticket:', ticketId);
      return;
    }

    // Only fetch if this is a new ticket or customer changed
    if (ticketId === prevTicketId && customerId === prevCustomerId) {
      console.log('[Co-Pilot] Same ticket and customer, skipping fetch');
      return;
    }

    const loadEquipmentIntel = async () => {
      console.log('[Co-Pilot] Fetching equipment for:', {
        ticket: selectedTicket?.ticket_number,
        customerId: customerId
      });

      setLoadingIntel(true);
      setIntelError(null);
      try {
        const intelList = await LiveDataService.getCustomerEquipmentIntelligence(customerId);
        console.log('[Co-Pilot] Equipment intel result:', intelList?.length || 0, 'items', intelList);
        if (intelList && intelList.length > 0) {
          setEquipmentIntel(intelList[0]);
          setNoEquipmentRegistered(false);
          console.log('[Co-Pilot] Set equipment intel:', intelList[0]);
        } else {
          console.log('[Co-Pilot] No equipment found for customer - showing ticket analysis');
          setEquipmentIntel(null);
          setNoEquipmentRegistered(true);
        }
      } catch (error) {
        console.error('[Co-Pilot] Error loading equipment intelligence:', error);
        setEquipmentIntel(null);
        setNoEquipmentRegistered(true);
        setIntelError('Unable to load equipment data');
      } finally {
        setLoadingIntel(false);
      }
    };
    loadEquipmentIntel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, customerId]);

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

  const checkShiftClockIn = async () => {
    if (!profile?.id) return;
    try {
      // Check if the technician has an active shift clock-in (not a ticket timer)
      const { data, error } = await supabase
        .from('time_logs')
        .select('id')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .is('clock_out_time', null)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setIsShiftClockedIn(!!data);
    } catch (error) {
      console.error('Error checking shift clock-in:', error);
      setIsShiftClockedIn(false);
    }
  };

  const loadStandardCodes = async () => {
    try {
      const [problemRes, resolutionRes] = await Promise.all([
        supabase
          .from('standard_codes')
          .select('code, label, description, category, is_critical_safety, triggers_sales_lead, triggers_urgent_review')
          .eq('code_type', 'problem')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('standard_codes')
          .select('code, label, description, category, is_critical_safety, triggers_sales_lead, triggers_urgent_review')
          .eq('code_type', 'resolution')
          .eq('is_active', true)
          .order('sort_order'),
      ]);

      if (problemRes.data) setProblemCodes(problemRes.data);
      if (resolutionRes.data) setResolutionCodes(resolutionRes.data);
    } catch (error) {
      console.error('Error loading standard codes:', error);
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
        .select('*, customers!tickets_customer_id_fkey(id, name, phone, email, address), equipment(equipment_type, model_number)')
        .eq('assigned_to', profile.id)
        .in('status', ['completed', 'closed_billed'])
        .order('completed_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      setCompletedTickets((data as unknown as Ticket[]) || []);
    } catch (error) {
      console.error('Error loading completed tickets:', error);
    }
  };

  const loadMyTickets = async () => {
    try {
      // Get tickets directly assigned via tickets.assigned_to
      const { data: directTickets, error: directError } = await supabase
        .from('tickets')
        .select('*, customers!tickets_customer_id_fkey(id, name, phone, email, address), equipment(equipment_type, model_number)')
        .eq('assigned_to', profile?.id ?? '')
        .in('status', ['open', 'scheduled', 'in_progress'])
        .order('scheduled_date', { ascending: true });

      if (directError) throw directError;

      // Get ticket IDs from ticket_assignments where this tech is assigned
      const { data: assignments, error: assignError } = await supabase
        .from('ticket_assignments')
        .select('ticket_id')
        .eq('technician_id', profile?.id ?? '');

      if (assignError) throw assignError;

      // Get assigned ticket IDs that aren't already in directTickets
      const directTicketIds = new Set((directTickets || []).map(t => t.id));
      const additionalTicketIds = (assignments || [])
        .map(a => a.ticket_id)
        .filter(id => !directTicketIds.has(id));

      let allTickets = directTickets || [];

      // Fetch additional tickets from ticket_assignments if any
      if (additionalTicketIds.length > 0) {
        const { data: assignedTickets, error: assignedError } = await supabase
          .from('tickets')
          .select('*, customers!tickets_customer_id_fkey(id, name, phone, email, address), equipment(equipment_type, model_number)')
          .in('id', additionalTicketIds)
          .in('status', ['open', 'scheduled', 'in_progress'])
          .order('scheduled_date', { ascending: true });

        if (assignedError) throw assignedError;
        allTickets = [...allTickets, ...(assignedTickets || [])];
      }

      // Sort combined results by scheduled_date
      allTickets.sort((a, b) => {
        const dateA = a.scheduled_date ? new Date(a.scheduled_date).getTime() : Infinity;
        const dateB = b.scheduled_date ? new Date(b.scheduled_date).getTime() : Infinity;
        return dateA - dateB;
      });

      console.log('Loaded tickets:', allTickets.length, '(direct:', directTickets?.length || 0, ', via assignments:', additionalTicketIds.length, ')');
      setTickets((allTickets as unknown as Ticket[]) || []);
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
      const [updatesRes, photosRes, partsRes, plannedPartsRes] = await Promise.all([
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
        supabase
          .from('ticket_parts_planned')
          .select('*, parts(part_number, name)')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true }),
      ]);

      if (updatesRes.error) throw updatesRes.error;
      if (photosRes.error) throw photosRes.error;
      if (partsRes.error) throw partsRes.error;
      if (plannedPartsRes.error) throw plannedPartsRes.error;

      setUpdates(updatesRes.data || []);
      setPhotos(photosRes.data || []);
      setPartsUsed(partsRes.data || []);
      setPlannedParts(plannedPartsRes.data || []);

      if (viewMode !== 'readonly') {
        await loadTruckInventory();
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      alert('Error loading ticket details: ' + (error as Error).message);
    }
  };

  const loadTruckInventory = async () => {
    // Use assigned technician's ID if available, otherwise use logged-in user's ID
    const technicianId = selectedTicket?.assigned_to || profile?.id;
    if (!technicianId) return;
    try {
      const { data: truckParts, error: truckError } = await supabase
        .from('vw_technician_truck_inventory')
        .select('part_id, part_number, part_name, unit_price, qty_on_hand')
        .eq('technician_id', technicianId)
        .gt('qty_on_hand', 0);

      if (truckError) {
        console.log('No truck inventory view available');
        setAvailableParts([]);
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
        // No parts on truck - don't fall back to all parts
        setAvailableParts([]);
      }
    } catch (error) {
      console.error('Error loading truck inventory:', error);
      setAvailableParts([]);
    }
  };

  const loadAllParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('id, part_number, name, unit_price')
        .eq('item_type', 'part')
        .order('name', { ascending: true });

      if (error) throw error;
      setAllParts(data || []);
    } catch (error) {
      console.error('Error loading all parts:', error);
      setAllParts([]);
    }
  };

  const handleStartWork = async () => {
    if (!selectedTicket || !profile?.id) return;

    // Check if technician has clocked in for their shift
    if (!isShiftClockedIn) {
      setShowClockInAlert(true);
      return;
    }

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
    } catch (error) {
      console.error('Error starting work:', error);
      alert('Failed to start work: ' + (error as Error).message);
    }
  };

  const handleEndWork = async (markComplete: boolean = false) => {
    if (!selectedTicket || !profile?.id) return;

    try {
      const { data: _endWorkData, error } = await supabase.rpc('fn_end_ticket_work', {
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
    // Load all parts for selection and show modal
    await loadAllParts();
    setNeedPartsFormData({
      part_id: '',
      quantity: 1,
      urgency: 'medium',
      notes: '',
    });
    setShowNeedPartsModal(true);
  };

  const handleSubmitNeedParts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setNeedPartsLoading(true);

    try {
      const partsToRequest = needPartsFormData.part_id
        ? [{
            part_id: needPartsFormData.part_id,
            quantity: needPartsFormData.quantity,
            notes: needPartsFormData.notes,
          }]
        : [];

      const result = await holdTicketForParts({
        ticketId: selectedTicket.id,
        urgency: needPartsFormData.urgency,
        notes: needPartsFormData.notes || 'Parts requested',
        summary: 'Waiting for parts',
        parts: partsToRequest,
      });

      if (result.success) {
        setShowNeedPartsModal(false);
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
    } finally {
      setNeedPartsLoading(false);
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

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const isCompletingTicket = updateFormData.status === 'completed';

    // Validate required codes when completing ticket
    if (isCompletingTicket) {
      if (!selectedProblemCode) {
        alert('Problem Code is required when completing a ticket.');
        return;
      }
      if (!selectedResolutionCode) {
        alert('Resolution Code is required when completing a ticket.');
        return;
      }
    }

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Adding update for ticket:', selectedTicket.id);
      console.log('User ID:', user.id);
      console.log('Update data:', updateFormData);

      // If completing, stop the timer first
      if (isCompletingTicket && activeTimer?.has_active_timer && activeTimer.ticket_id === selectedTicket.id) {
        const { error: timerError } = await supabase.rpc('fn_end_ticket_work', {
          p_tech_id: profile?.id || '',
          p_ticket_id: selectedTicket.id,
        });
        if (timerError) {
          console.error('Error stopping timer:', timerError);
        }
      }

      const updateData: {
        ticket_id: string;
        technician_id: string;
        update_type: string;
        notes: string;
        progress_percent: number;
        status?: string;
      } = {
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
        const ticketUpdateData: {
          status: string;
          updated_at: string;
          assigned_to: string | null | undefined;
          completed_date?: string;
          problem_code?: string;
          resolution_code?: string;
        } = {
          status: updateFormData.status,
          updated_at: new Date().toISOString(),
          assigned_to: selectedTicket.assigned_to
        };

        // Add completed_date if marking as completed
        if (isCompletingTicket) {
          ticketUpdateData.completed_date = new Date().toISOString();
          // Include problem and resolution codes when completing
          if (selectedProblemCode) {
            ticketUpdateData.problem_code = selectedProblemCode;
          }
          if (selectedResolutionCode) {
            ticketUpdateData.resolution_code = selectedResolutionCode;
          }
        }

        const { error: ticketError } = await supabase
          .from('tickets')
          .update(ticketUpdateData)
          .eq('id', selectedTicket.id);

        if (ticketError) {
          console.error('Error updating ticket status:', ticketError);
          throw ticketError;
        }
      }

      // Close modal first
      setShowUpdateModal(false);

      // If completing, show success and navigate back
      if (isCompletingTicket) {
        await checkActiveTimer();
        await loadMyTickets();
        await loadCompletedTickets();
        setShowCompletionSuccess(true);
        return;
      }

      // Reload data for non-completion updates
      await loadTicketDetails(selectedTicket.id);
      await loadMyTickets();

      setShowUpdateModal(false);
      setSelectedProblemCode('');
      setSelectedResolutionCode('');
      setShowGasLeakWarning(false);
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
        errorMessage = (error as { message: string }).message;
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
    } catch (error: unknown) {
      console.error('Error uploading photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to upload photo: ${errorMessage}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Co-Pilot: Analyze ticket description for insights
  const getTicketInsights = (ticket: Ticket) => {
    const title = (ticket.title || '').toLowerCase();
    const description = (ticket.description || '').toLowerCase();
    const combined = `${title} ${description}`;

    const insights: { icon: string; text: string; priority: 'high' | 'medium' | 'low' }[] = [];

    // Safety concerns
    if (combined.includes('gas leak') || combined.includes('carbon monoxide') || combined.includes('co detector')) {
      insights.push({ icon: '⚠️', text: 'SAFETY: Gas leak suspected - ensure proper ventilation and use gas detector', priority: 'high' });
    }
    if (combined.includes('electrical') || combined.includes('shock') || combined.includes('sparking')) {
      insights.push({ icon: '⚡', text: 'SAFETY: Electrical hazard - disconnect power before inspection', priority: 'high' });
    }

    // Common HVAC issues
    if (combined.includes('no heat') || combined.includes('not heating')) {
      insights.push({ icon: '🔥', text: 'Check: Thermostat settings, pilot light, gas valve, igniter, flame sensor', priority: 'medium' });
    }
    if (combined.includes('no cool') || combined.includes('not cooling') || combined.includes('no ac')) {
      insights.push({ icon: '❄️', text: 'Check: Thermostat, refrigerant levels, condenser coils, compressor, capacitor', priority: 'medium' });
    }
    if (combined.includes('noise') || combined.includes('loud') || combined.includes('banging') || combined.includes('squealing')) {
      insights.push({ icon: '🔊', text: 'Check: Blower motor, fan blades, loose components, belt tension', priority: 'medium' });
    }
    if (combined.includes('leak') || combined.includes('water')) {
      insights.push({ icon: '💧', text: 'Check: Condensate drain, drain pan, refrigerant lines, coil freeze-up', priority: 'medium' });
    }
    if (combined.includes('smell') || combined.includes('odor') || combined.includes('burning')) {
      insights.push({ icon: '👃', text: 'Check: Air filter, electrical connections, motor overheating, ductwork', priority: 'medium' });
    }
    if (combined.includes('short cycling') || combined.includes('turns on and off')) {
      insights.push({ icon: '🔄', text: 'Check: Thermostat placement, refrigerant charge, airflow restrictions, oversized unit', priority: 'medium' });
    }
    if (combined.includes('high bill') || combined.includes('utility') || combined.includes('efficiency')) {
      insights.push({ icon: '💰', text: 'Check: Air filter, duct leaks, insulation, system age - discuss upgrade options', priority: 'low' });
    }

    // Maintenance reminders
    if (combined.includes('maintenance') || combined.includes('tune up') || combined.includes('annual')) {
      insights.push({ icon: '🔧', text: 'Perform: Filter check, coil cleaning, electrical inspection, refrigerant check', priority: 'low' });
    }

    // If no specific insights, provide general guidance
    if (insights.length === 0) {
      insights.push({ icon: '📋', text: 'Perform standard diagnostic: Visual inspection, operational test, customer interview', priority: 'low' });
    }

    return insights;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'open': return 'badge-blue';
      case 'scheduled': return 'badge-blue';
      case 'in_progress': return 'badge-yellow';
      case 'completed': return 'badge-green';
      case 'cancelled': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  const getPriorityColor = (priority: string | null) => {
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
            {(selectedTicket.status ?? 'unknown').replace('_', ' ')}
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
            {/* Co-Pilot Advisory Card - AI Intelligence for Technicians */}
            {(equipmentIntel || loadingIntel || intelError || noEquipmentRegistered) && (
              <div className={`rounded-xl p-4 border-2 ${
                intelError
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-300 dark:border-gray-500/50'
                  : equipmentIntel?.isChronic
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-300 dark:border-red-500/50'
                    : noEquipmentRegistered
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-300 dark:border-blue-500/50'
                      : 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-300 dark:border-purple-500/50'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    intelError
                      ? 'bg-gray-100 dark:bg-gray-700/30'
                      : equipmentIntel?.isChronic
                        ? 'bg-red-100 dark:bg-red-800/30'
                        : noEquipmentRegistered
                          ? 'bg-blue-100 dark:bg-blue-800/30'
                          : 'bg-purple-100 dark:bg-purple-800/30'
                  }`}>
                    <Brain className={`w-5 h-5 ${
                      intelError
                        ? 'text-gray-500 dark:text-gray-400'
                        : equipmentIntel?.isChronic
                          ? 'text-red-600 dark:text-red-400'
                          : noEquipmentRegistered
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-purple-600 dark:text-purple-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${
                      intelError
                        ? 'text-gray-600 dark:text-gray-400'
                        : equipmentIntel?.isChronic
                          ? 'text-red-700 dark:text-red-400'
                          : noEquipmentRegistered
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-purple-700 dark:text-purple-400'
                    }`}>
                      Tech Co-Pilot Advisory
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {noEquipmentRegistered ? 'Ticket Analysis Mode' : 'AI-Powered Diagnostic Signal'}
                    </p>
                  </div>
                  {equipmentIntel?.isChronic && (
                    <span className="ml-auto px-2 py-1 text-xs font-bold rounded-full bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-400 animate-pulse">
                      CHRONIC UNIT
                    </span>
                  )}
                  {noEquipmentRegistered && !equipmentIntel && (
                    <span className="ml-auto px-2 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-400">
                      NO EQUIPMENT
                    </span>
                  )}
                </div>

                {loadingIntel ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span>Analyzing equipment history...</span>
                  </div>
                ) : intelError ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{intelError} - Manual inspection recommended</span>
                  </div>
                ) : noEquipmentRegistered && !equipmentIntel ? (
                  <div className="space-y-3">
                    {/* No Equipment Notice */}
                    <div className="flex items-start gap-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-700 dark:text-amber-400">No equipment registered for this customer</p>
                        <p className="text-amber-600 dark:text-amber-300 text-xs mt-1">Consider adding equipment after service for future diagnostics</p>
                      </div>
                    </div>

                    {/* Ticket-Based Insights */}
                    <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">
                        Diagnostic Suggestions Based on Ticket
                      </p>
                      <div className="space-y-2">
                        {getTicketInsights(selectedTicket).map((insight, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-2 p-2 rounded-lg ${
                              insight.priority === 'high'
                                ? 'bg-red-50 dark:bg-red-900/20'
                                : insight.priority === 'medium'
                                  ? 'bg-blue-50 dark:bg-blue-900/20'
                                  : 'bg-gray-50 dark:bg-gray-800/50'
                            }`}
                          >
                            <span className="text-base flex-shrink-0">{insight.icon}</span>
                            <p className={`text-sm ${
                              insight.priority === 'high'
                                ? 'text-red-700 dark:text-red-300 font-medium'
                                : insight.priority === 'medium'
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {insight.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Based on: "{selectedTicket.title}"
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        AI-Powered Insights
                      </span>
                    </div>
                  </div>
                ) : equipmentIntel ? (
                  <div className="space-y-3">
                    {/* Equipment Summary */}
                    <div className="flex items-start gap-3">
                      <Wrench className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {equipmentIntel.equipment.equipmentType}
                          {equipmentIntel.equipment.modelNumber && ` - ${equipmentIntel.equipment.modelNumber}`}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {equipmentIntel.ageYears} years old | {equipmentIntel.totalServiceCalls} service calls
                          {equipmentIntel.serviceCallsLast12Months >= 3 && (
                            <span className="text-red-600 dark:text-red-400 font-medium"> ({equipmentIntel.serviceCallsLast12Months} in last 12mo)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Chronic Unit Warning */}
                    {equipmentIntel.isChronic && (
                      <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-red-700 dark:text-red-400 text-sm">
                              {equipmentIntel.recommendedAction === 'replace' ? 'Replacement Recommended' : 'High-Frequency Service Unit'}
                            </p>
                            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                              {equipmentIntel.chronicReason}
                            </p>
                            <p className="text-red-600 dark:text-red-300 text-sm mt-2 font-medium">
                              <Zap className="w-3 h-3 inline mr-1" />
                              Consider discussing {equipmentIntel.recommendedAction === 'replace' ? 'replacement options' : 'extended service plan'} with customer.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Warranty Status */}
                    {equipmentIntel.warrantyStatus !== 'unknown' && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          equipmentIntel.warrantyStatus === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          Warranty: {equipmentIntel.warrantyStatus.toUpperCase()}
                        </span>
                        {equipmentIntel.warrantyStatus === 'expired' && (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">Customer pays full cost</span>
                        )}
                      </div>
                    )}

                    {/* Confidence Score */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Diagnostic Confidence: {equipmentIntel.confidenceScore}%
                      </span>
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        AI-Powered Insights
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

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
                      {selectedTicket.scheduled_date ? new Date(selectedTicket.scheduled_date).toLocaleString() : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
                    <p className={`font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {(selectedTicket.priority ?? 'normal').toUpperCase()}
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
                        {getUpdateTypeIcon(update.update_type ?? '')}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {(update.update_type ?? '').replace('_', ' ')}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {update.created_at ? new Date(update.created_at).toLocaleString() : ''}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{update.notes}</p>
                          {(update.progress_percent ?? 0) > 0 && (
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

            {/* Planned Materials from Estimate */}
            {plannedParts.length > 0 && (
              <div className="card p-6 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-blue-600" />
                    Planned Materials
                  </h2>
                  <span className="badge badge-blue">From Estimate</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Parts specified in the approved estimate for this job
                </p>
                <div className="space-y-3">
                  {plannedParts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {part.parts?.name || part.description}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {part.parts?.part_number ? `${part.parts.part_number} - ` : ''}Qty: {part.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${((part.unit_price ?? 0) * part.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-gray-900 dark:text-white">Planned Total</span>
                    <span className="text-blue-600">
                      ${plannedParts.reduce((sum, p) => sum + ((p.unit_price ?? 0) * p.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                        ${((part.parts.unit_price ?? 0) * part.quantity).toFixed(2)}
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
                      ${partsUsed.reduce((sum, p) => sum + ((p.parts.unit_price ?? 0) * p.quantity), 0).toFixed(2)}
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
                      {selectedTicket.customers?.name ?? 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <a
                      href={`tel:${selectedTicket.customers?.phone}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {selectedTicket.customers?.phone ?? 'N/A'}
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedTicket.customers?.address ?? 'N/A'}
                    </p>
                  </div>
                </div>
                {(selectedTicket.site_contact_name || selectedTicket.site_contact_phone) && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">Site Contact</p>
                    {selectedTicket.site_contact_name && (
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedTicket.site_contact_name}
                      </p>
                    )}
                    {selectedTicket.site_contact_phone && (
                      <a
                        href={`tel:${selectedTicket.site_contact_phone}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {selectedTicket.site_contact_phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
              {selectedTicket.customers?.address && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedTicket.customers.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full btn btn-primary flex items-center justify-center space-x-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </a>
              )}
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Time Tracking</h2>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`badge ${getStatusColor(selectedTicket.status)}`}>
                    {(selectedTicket.status ?? 'unknown').replace('_', ' ')}
                  </span>
                </div>
                {(selectedTicket.hours_onsite ?? 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Billable Hours</span>
                    <span className="font-bold text-blue-600">
                      {(selectedTicket.hours_onsite ?? 0).toFixed(2)} hrs
                    </span>
                  </div>
                )}
              </div>

              {(selectedTicket.status === 'completed' || selectedTicket.status === 'closed_billed') && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="font-medium text-green-800 dark:text-green-200">Ticket Completed</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    This ticket has been marked as complete.
                  </p>
                </div>
              )}

              {!isReadonly && selectedTicket.status !== 'completed' && selectedTicket.status !== 'closed_billed' && (
                <>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    {(selectedTicket.status === 'open' || selectedTicket.status === 'scheduled') && !isCurrentlyTiming && (
                      <>
                        {!isShiftClockedIn && (
                          <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm">You must clock in before starting work</span>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={handleStartWork}
                          disabled={hasAnotherTimerActive || (selectedTicket.hold_active ?? false)}
                          className={`w-full btn flex items-center justify-center space-x-2 ${
                            (hasAnotherTimerActive || (selectedTicket.hold_active ?? false))
                              ? 'btn-outline opacity-50 cursor-not-allowed'
                              : !isShiftClockedIn
                                ? 'btn-outline border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20'
                                : 'btn-primary'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          <span>
                            {selectedTicket.hold_active
                              ? 'On Hold - Cannot Start'
                              : !isShiftClockedIn
                                ? 'Clock In Required to Start'
                                : 'Start Work (Begin Timer)'}
                          </span>
                        </button>
                      </>
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
                      onClick={() => {
                        if (selectedTicket.hold_active) {
                          alert('Cannot complete a ticket that is on hold. Please resume the ticket first.');
                          return;
                        }
                        setUpdateFormData({ ...updateFormData, update_type: 'completed', status: 'completed', progress_percent: 100 });
                        setShowUpdateModal(true);
                      }}
                      disabled={selectedTicket.hold_active ?? false}
                      className={`w-full btn flex items-center justify-center space-x-2 ${
                        (selectedTicket.hold_active ?? false)
                          ? 'btn-outline opacity-50 cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{selectedTicket.hold_active ? 'Resume Ticket First' : 'Mark Complete'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {showUpdateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Update</h2>
                <button onClick={() => setShowUpdateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddUpdate} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Update Type *
                  </label>
                  <select
                    required
                    value={updateFormData.update_type}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, update_type: e.target.value as 'progress_note' | 'completed' | 'status_change' })}
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

                {updateFormData.update_type === 'completed' && (
                  <>
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

                    {updateFormData.status === 'completed' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Completion Codes (Required for Analytics)
                        </p>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Problem Code *
                          </label>
                          <select
                            required
                            value={selectedProblemCode}
                            onChange={(e) => {
                              const code = e.target.value;
                              const selectedCode = problemCodes.find(c => c.code === code);
                              setSelectedProblemCode(code);
                              if (selectedCode?.is_critical_safety) {
                                setShowGasLeakWarning(true);
                              } else {
                                setShowGasLeakWarning(false);
                              }
                            }}
                            className="input"
                          >
                            <option value="">Select problem found</option>
                            {problemCodes.map((code) => (
                              <option key={code.code} value={code.code}>
                                {code.label}
                              </option>
                            ))}
                          </select>
                          {selectedProblemCode && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {problemCodes.find(c => c.code === selectedProblemCode)?.description}
                            </p>
                          )}
                        </div>

                        {showGasLeakWarning && (
                          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start space-x-2">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div>
                              <p className="font-bold text-red-800 dark:text-red-200 text-sm">SAFETY ALERT</p>
                              <p className="text-xs text-red-700 dark:text-red-300">Gas leak documented. Ensure all safety protocols followed.</p>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Resolution Code *
                          </label>
                          <select
                            required
                            value={selectedResolutionCode}
                            onChange={(e) => setSelectedResolutionCode(e.target.value)}
                            className="input"
                          >
                            <option value="">Select action taken</option>
                            {resolutionCodes.map((code) => (
                              <option key={code.code} value={code.code}>
                                {code.label}
                              </option>
                            ))}
                          </select>
                          {selectedResolutionCode && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {resolutionCodes.find(c => c.code === selectedResolutionCode)?.description}
                            </p>
                          )}
                          {resolutionCodes.find(c => c.code === selectedResolutionCode)?.triggers_urgent_review && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                              Note: This will flag the ticket for urgent management review.
                            </p>
                          )}
                        </div>

                        {(problemCodes.find(c => c.code === selectedProblemCode)?.triggers_sales_lead ||
                          resolutionCodes.find(c => c.code === selectedResolutionCode)?.triggers_sales_lead) && (
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            This ticket will be flagged as a sales opportunity.
                          </p>
                        )}
                      </div>
                    )}
                  </>
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

              {availableParts.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Parts on Truck
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your truck inventory is empty. If you need a part, use the "Need Parts" button to request it from dispatch.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPartsModal(false);
                      handleNeedParts();
                    }}
                    className="btn btn-primary"
                  >
                    Request Parts
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddPart} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Part from Truck Inventory *
                    </label>
                    <select
                      required
                      value={partsFormData.part_id ?? ''}
                      onChange={(e) => setPartsFormData({ ...partsFormData, part_id: e.target.value })}
                      className="input"
                    >
                      <option value="">Select Part</option>
                      {availableParts.map((part) => (
                        <option key={part.id} value={part.id ?? ''}>
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
              )}
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
                    onChange={(e) => setPhotoFormData({ ...photoFormData, photo_type: e.target.value as 'before' | 'during' | 'after' | 'issue' | 'equipment' | 'other' })}
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

        {showNeedPartsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Request Parts</h2>
                <button onClick={() => setShowNeedPartsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitNeedParts} className="p-6 space-y-4">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      This will put the ticket <strong>on hold</strong> and stop the timer until parts are available.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Part Needed (optional)
                  </label>
                  <select
                    value={needPartsFormData.part_id ?? ''}
                    onChange={(e) => setNeedPartsFormData({ ...needPartsFormData, part_id: e.target.value })}
                    className="input"
                  >
                    <option value="">-- Select specific part or describe below --</option>
                    {allParts.map((part) => (
                      <option key={part.id} value={part.id ?? ''}>
                        {part.part_number} - {part.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={needPartsFormData.quantity}
                    onChange={(e) => setNeedPartsFormData({ ...needPartsFormData, quantity: parseInt(e.target.value) || 1 })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Urgency *
                  </label>
                  <select
                    required
                    value={needPartsFormData.urgency}
                    onChange={(e) => setNeedPartsFormData({ ...needPartsFormData, urgency: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                    className="input"
                  >
                    <option value="low">Low - Can wait a few days</option>
                    <option value="medium">Medium - Need within 1-2 days</option>
                    <option value="high">High - Need today</option>
                    <option value="critical">Critical - Job cannot continue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description / Notes *
                  </label>
                  <textarea
                    required
                    value={needPartsFormData.notes}
                    onChange={(e) => setNeedPartsFormData({ ...needPartsFormData, notes: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Describe what parts you need and why..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNeedPartsModal(false)}
                    className="btn btn-outline flex-1"
                    disabled={needPartsLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={needPartsLoading}
                  >
                    {needPartsLoading ? 'Submitting...' : 'Request Parts & Hold Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showClockInAlert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Clock In Required
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You must clock in before starting work on a ticket. Please go to <strong>Time Clock</strong> to clock in for your shift, then return here to start work.
                </p>
                <button
                  onClick={() => setShowClockInAlert(false)}
                  className="btn btn-primary w-full"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}

        {showCompletionSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Ticket Completed!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  <strong>{selectedTicket?.ticket_number}</strong> has been marked as complete.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                  You can view it in your Service History.
                </p>
                <button
                  onClick={() => {
                    setShowCompletionSuccess(false);
                    setSelectedTicket(null);
                    setViewMode('edit');
                  }}
                  className="btn btn-primary w-full"
                >
                  Back to My Tickets
                </button>
              </div>
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

                const ticket = tickets.find(t => t.id === activeTimer.ticket_id);
                if (ticket) {
                  setSelectedTicket(ticket);
                  setViewMode('edit');
                } else {
                  // Ticket not in local list, fetch it directly
                  console.log('Fetching ticket directly, id:', activeTimer.ticket_id);
                  try {
                    const { data, error } = await supabase
                      .from('tickets')
                      .select('*, customers!tickets_customer_id_fkey(id, name, phone, email, address), equipment(equipment_type, model_number)')
                      .eq('id', activeTimer.ticket_id)
                      .single();

                    console.log('Fetch result:', { data, error });

                    if (error) {
                      console.error('Database error:', error);
                      alert(`Could not load ticket: ${error.message}`);
                      return;
                    }
                    if (data) {
                      setSelectedTicket(data as unknown as Ticket);
                      setViewMode('edit');
                    } else {
                      alert('Ticket not found in database.');
                    }
                  } catch (error: unknown) {
                    console.error('Error fetching ticket:', error);
                    alert(`Could not load ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                    {(ticket.status ?? 'unknown').replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{ticket.customers?.name ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{ticket.customers?.address ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {new Date(ticket.scheduled_date ?? '').toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                    {(ticket.priority ?? 'normal').toUpperCase()} PRIORITY
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
                      {(ticket.status ?? 'unknown').replace('_', ' ')}
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
