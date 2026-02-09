import { supabase } from '../lib/supabase';
import { Tables } from '../lib/dbTypes';

// Composite type for equipment with joined customer_locations data
type EquipmentWithLocation = Pick<
  Tables<'equipment'>,
  | 'id'
  | 'equipment_type'
  | 'manufacturer'
  | 'model_number'
  | 'serial_number'
  | 'installation_date'
  | 'warranty_expiration'
  | 'warranty_status'
  | 'is_active'
  | 'location_id'
> & {
  customer_locations: Pick<
    Tables<'customer_locations'>,
    'id' | 'location_name' | 'address' | 'city' | 'state' | 'zip_code'
  >;
};

export interface CustomerFinancialSummary {
  total_revenue_lifetime: number;
  total_revenue_ytd: number;
  total_outstanding: number;
  last_invoice_date: string | null;
  invoices: InvoiceDisplay[];
}

export interface InvoiceDisplay {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  total_amount: number;
  balance_due: number;
  status: string;
  amount_paid: number;
}

/**
 * Get customer financial summary - single source of truth from invoices table
 * This uses the EXACT same logic as the Invoicing page to ensure consistency
 */
export async function getCustomerFinancialSummary(
  customerId: string
): Promise<CustomerFinancialSummary> {
  // Fetch all posted invoices for this customer
  // Posted = sent, paid, partially_paid, overdue (exclude draft, cancelled, written_off)
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('customer_id', customerId)
    .not('status', 'in', '(draft,cancelled,written_off)')
    .order('issue_date', { ascending: false });

  if (error) {
    console.error('Error fetching customer invoices:', error);
    throw error;
  }

  const invoiceList = invoices || [];

  // Calculate totals using EXACT same logic as revenue tracking
  const currentYear = new Date().getFullYear();

  const total_revenue_lifetime = invoiceList.reduce(
    (sum, inv) => sum + Number(inv.total_amount || 0),
    0
  );

  const total_revenue_ytd = invoiceList
    .filter((inv) => {
      const issueYear = new Date(inv.issue_date).getFullYear();
      return issueYear === currentYear;
    })
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  const total_outstanding = invoiceList.reduce(
    (sum, inv) => sum + Number(inv.balance_due || 0),
    0
  );

  const last_invoice_date =
    invoiceList.length > 0 ? invoiceList[0].issue_date : null;

  // Map invoices for display
  const invoicesDisplay: InvoiceDisplay[] = invoiceList.map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number || '',
    issue_date: inv.issue_date,
    due_date: inv.due_date,
    total_amount: Number(inv.total_amount || 0),
    balance_due: Number(inv.balance_due || 0),
    status: inv.status || 'draft',
    amount_paid: Number(inv.amount_paid || 0),
  }));

  return {
    total_revenue_lifetime,
    total_revenue_ytd,
    total_outstanding,
    last_invoice_date,
    invoices: invoicesDisplay,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Get invoice status badge class
 */
export function getInvoiceStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    draft: 'badge badge-gray',
    sent: 'badge badge-blue',
    paid: 'badge badge-green',
    partially_paid: 'badge badge-yellow',
    overdue: 'badge badge-red',
    cancelled: 'badge badge-gray',
    written_off: 'badge badge-gray',
  };
  return badges[status] || 'badge badge-gray';
}

export interface EquipmentDisplay {
  id: string;
  equipment_type: string;
  manufacturer: string;
  model_number: string;
  serial_number: string;
  installation_date: string | null;
  warranty_expiration: string | null;
  warranty_status: string;
  location_id: string;
  location_name: string;
  location_address: string;
  is_active: boolean;
}

export interface CustomerEquipmentByLocation {
  location_id: string;
  location_name: string;
  location_address: string;
  equipment: EquipmentDisplay[];
}

/**
 * Get customer installed equipment - queries existing equipment table
 * Groups equipment by customer location
 */
export async function getCustomerInstalledEquipment(
  customerId: string
): Promise<CustomerEquipmentByLocation[]> {
  // Fetch all active equipment for customer's locations
  const { data: equipment, error } = await supabase
    .from('equipment')
    .select(`
      id,
      equipment_type,
      manufacturer,
      model_number,
      serial_number,
      installation_date,
      warranty_expiration,
      warranty_status,
      is_active,
      location_id,
      customer_locations!inner (
        id,
        location_name,
        address,
        city,
        state,
        zip_code
      )
    `)
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .order('installation_date', { ascending: false });

  if (error) {
    console.error('Error fetching customer equipment:', error);
    throw error;
  }

  const equipmentList = equipment || [];

  // Group by location
  const locationMap = new Map<string, CustomerEquipmentByLocation>();

  for (const item of equipmentList) {
    const loc = (item as unknown as EquipmentWithLocation).customer_locations;
    const locationId = loc.id;
    const locationName = loc.location_name || 'Unknown Location';
    const locationAddress = [
      loc.address,
      loc.city,
      loc.state,
      loc.zip_code,
    ]
      .filter(Boolean)
      .join(', ');

    if (!locationMap.has(locationId)) {
      locationMap.set(locationId, {
        location_id: locationId,
        location_name: locationName,
        location_address: locationAddress,
        equipment: [],
      });
    }

    const equipmentDisplay: EquipmentDisplay = {
      id: item.id,
      equipment_type: item.equipment_type || '',
      manufacturer: item.manufacturer || '',
      model_number: item.model_number || '',
      serial_number: item.serial_number || '',
      installation_date: item.installation_date,
      warranty_expiration: item.warranty_expiration,
      warranty_status: item.warranty_status || 'N/A',
      location_id: locationId,
      location_name: locationName,
      location_address: locationAddress,
      is_active: item.is_active ?? true,
    };

    locationMap.get(locationId)!.equipment.push(equipmentDisplay);
  }

  return Array.from(locationMap.values());
}

/**
 * Get warranty status badge class
 */
export function getWarrantyStatusBadge(
  warrantyExpiration: string | null
): { text: string; className: string } {
  if (!warrantyExpiration) {
    return { text: 'No Warranty', className: 'badge badge-gray' };
  }

  const expirationDate = new Date(warrantyExpiration);
  const today = new Date();
  const daysUntilExpiration = Math.floor(
    (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiration < 0) {
    return { text: 'Expired', className: 'badge badge-red' };
  } else if (daysUntilExpiration < 90) {
    return {
      text: `Expires in ${daysUntilExpiration} days`,
      className: 'badge badge-orange',
    };
  } else {
    return {
      text: `Valid until ${expirationDate.toLocaleDateString()}`,
      className: 'badge badge-green',
    };
  }
}
