import { supabase } from '../lib/supabase';
import { Tables, Views } from '../lib/dbTypes';

// Composite types for joined queries
type PartInventoryWithParts = Tables<'part_inventory'> & {
  parts: Pick<Tables<'parts'>, 'part_number' | 'name'> | null;
};

type PartInventoryWithPartsAndManufacturer = Tables<'part_inventory'> & {
  parts: Pick<Tables<'parts'>, 'part_number' | 'name' | 'manufacturer'> | null;
};

type SerializedPartWithParts = Tables<'serialized_parts'> & {
  parts: Pick<Tables<'parts'>, 'part_number' | 'name'> | null;
};

type SerializedPartWithPartsAndLocation = Tables<'serialized_parts'> & {
  parts: Pick<Tables<'parts'>, 'part_number' | 'name'> | null;
  stock_locations: Pick<Tables<'stock_locations'>, 'name' | 'location_type'> | null;
};

// Type for the vehicle inventory report return value
interface VehicleInventoryReport {
  vehicle: {
    id: string;
    name: string;
    locationCode: string | null;
    assignedTo: string | null;
  };
  nonSerializedInventory: PartInventoryWithPartsAndManufacturer[];
  serializedInventory: Views<'serialized_parts_available_stock'>[];
  totalNonSerializedUnits: number;
  totalSerializedUnits: number;
}

interface VehicleInventoryError {
  error: string;
}

// Types for diagnostic details
interface InventoryMismatch {
  partNumber: string | null;
  name: string;
  partsTableQty: number | null;
  inventoryTableQty: number;
}

interface VehicleReport {
  vehicle: string;
  nonSerializedCount: number;
  nonSerializedTotalQty: number;
  serializedCount: number;
  items: Array<{
    type: 'non-serialized' | 'serialized';
    partNumber: string | null | undefined;
    partName: string | null | undefined;
    quantity?: number;
    serialNumber?: string;
    status?: string | null;
  }>;
}

interface SerializedPartIssue {
  serialNumber: string;
  partNumber: string | null | undefined;
  issue: string;
}

interface InstalledPartInStock {
  serialNumber: string;
  partNumber: string | null | undefined;
  currentLocation: string;
  issue: string;
}

type DiagnosticDetails =
  | InventoryMismatch[]
  | VehicleReport[]
  | SerializedPartIssue[]
  | InstalledPartInStock[]
  | string[];

export interface DiagnosticReport {
  timestamp: string;
  overallStatus: 'OK' | 'WARNING' | 'ERROR';
  checks: DiagnosticCheck[];
}

export interface DiagnosticCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: DiagnosticDetails;
}

export class InventoryDiagnostics {
  async runFullDiagnostic(): Promise<DiagnosticReport> {
    const checks: DiagnosticCheck[] = [];

    checks.push(await this.checkInventorySync());
    checks.push(await this.checkVehicleInventoryConsistency());
    checks.push(await this.checkSerializedPartsLocationStatus());
    checks.push(await this.checkInstalledPartsNotInStock());
    checks.push(await this.checkDuplicateInventoryRecords());

    const hasErrors = checks.some((c) => c.status === 'FAIL');
    const hasWarnings = checks.some((c) => c.status === 'WARNING');

    return {
      timestamp: new Date().toISOString(),
      overallStatus: hasErrors ? 'ERROR' : hasWarnings ? 'WARNING' : 'OK',
      checks,
    };
  }

  private async checkInventorySync(): Promise<DiagnosticCheck> {
    const rpcFn = supabase.rpc as unknown as (name: string, args: Record<string, unknown>, options?: { count: 'exact' }) => Promise<unknown>;
    const { data, error } = await rpcFn('check_inventory_sync', {}, {
      count: 'exact',
    }).then(() =>
      supabase.from('parts').select(`
        id,
        part_number,
        name,
        quantity_on_hand
      `)
    );

    if (error) {
      return {
        name: 'Inventory Synchronization',
        status: 'FAIL',
        message: `Error checking inventory sync: ${error.message}`,
      };
    }

    const mismatches: InventoryMismatch[] = [];

    for (const part of data || []) {
      const { data: invData } = await supabase
        .from('part_inventory')
        .select('quantity')
        .eq('part_id', part.id);

      const total = (invData || []).reduce((sum, inv) => sum + inv.quantity, 0);

      if (total !== part.quantity_on_hand) {
        mismatches.push({
          partNumber: part.part_number,
          name: part.name,
          partsTableQty: part.quantity_on_hand,
          inventoryTableQty: total,
        });
      }
    }

    if (mismatches.length > 0) {
      return {
        name: 'Inventory Synchronization',
        status: 'FAIL',
        message: `Found ${mismatches.length} parts with quantity mismatches`,
        details: mismatches,
      };
    }

    return {
      name: 'Inventory Synchronization',
      status: 'PASS',
      message: 'All parts quantities are in sync between parts and part_inventory tables',
    };
  }

  private async checkVehicleInventoryConsistency(): Promise<DiagnosticCheck> {
    const { data: vehicles, error } = await supabase
      .from('stock_locations')
      .select('*')
      .eq('location_type', 'truck')
      .eq('is_mobile', true)
      .eq('is_active', true);

    if (error) {
      return {
        name: 'Vehicle Inventory Consistency',
        status: 'FAIL',
        message: `Error checking vehicle inventory: ${error.message}`,
      };
    }

    const vehicleReports: VehicleReport[] = [];

    for (const vehicle of vehicles || []) {
      const { data: inventory } = await supabase
        .from('part_inventory')
        .select('part_id, quantity, parts(part_number, name)')
        .eq('stock_location_id', vehicle.id);

      const serializedTableName = 'serialized_parts';
      const { data: serialized } = await supabase
        .from(serializedTableName as unknown as 'parts')
        .select('id, serial_number, status, parts(part_number, name)')
        .eq('current_location_id', vehicle.id)
        .in('status', ['in_stock', 'in_transit']);

      const typedInventory = inventory as unknown as PartInventoryWithParts[] | null;
      const typedSerialized = serialized as unknown as SerializedPartWithParts[] | null;

      vehicleReports.push({
        vehicle: vehicle.name,
        nonSerializedCount: (typedInventory || []).length,
        nonSerializedTotalQty: (typedInventory || []).reduce((sum, inv) => sum + inv.quantity, 0),
        serializedCount: (typedSerialized || []).length,
        items: [
          ...(typedInventory || []).map((inv) => ({
            type: 'non-serialized' as const,
            partNumber: inv.parts?.part_number,
            partName: inv.parts?.name,
            quantity: inv.quantity,
          })),
          ...(typedSerialized || []).map((ser) => ({
            type: 'serialized' as const,
            partNumber: ser.parts?.part_number,
            partName: ser.parts?.name,
            serialNumber: ser.serial_number,
            status: ser.status,
          })),
        ],
      });
    }

    return {
      name: 'Vehicle Inventory Consistency',
      status: 'PASS',
      message: `Checked ${vehicles?.length || 0} vehicles`,
      details: vehicleReports,
    };
  }

  private async checkSerializedPartsLocationStatus(): Promise<DiagnosticCheck> {
    const serializedTableName = 'serialized_parts';
    const { data, error } = await supabase
      .from(serializedTableName as unknown as 'parts')
      .select('id, serial_number, status, current_location_id, installed_on_equipment_id, parts(part_number, name)');

    if (error) {
      return {
        name: 'Serialized Parts Location Status',
        status: 'FAIL',
        message: `Error checking serialized parts: ${error.message}`,
      };
    }

    const issues: SerializedPartIssue[] = [];
    const typedData = data as unknown as SerializedPartWithParts[] | null;

    for (const part of typedData || []) {
      if (part.status === 'in_stock' && !part.current_location_id) {
        issues.push({
          serialNumber: part.serial_number,
          partNumber: part.parts?.part_number,
          issue: 'Marked as in_stock but has no current_location_id',
        });
      }

      if (part.status === 'installed' && !part.installed_on_equipment_id) {
        issues.push({
          serialNumber: part.serial_number,
          partNumber: part.parts?.part_number,
          issue: 'Marked as installed but has no installed_on_equipment_id',
        });
      }

      if (part.status === 'in_stock' && part.installed_on_equipment_id) {
        issues.push({
          serialNumber: part.serial_number,
          partNumber: part.parts?.part_number,
          issue: 'Marked as in_stock but still has installed_on_equipment_id',
        });
      }
    }

    if (issues.length > 0) {
      return {
        name: 'Serialized Parts Location Status',
        status: 'WARNING',
        message: `Found ${issues.length} serialized parts with inconsistent status/location`,
        details: issues,
      };
    }

    return {
      name: 'Serialized Parts Location Status',
      status: 'PASS',
      message: `All ${data?.length || 0} serialized parts have consistent status and location data`,
    };
  }

  private async checkInstalledPartsNotInStock(): Promise<DiagnosticCheck> {
    type QueryResult = { data: SerializedPartWithPartsAndLocation[] | null; error: { message: string } | null };
    const fromFn = supabase.from as unknown as (table: string) => {
      select: (columns: string) => { eq: (col: string, val: string) => Promise<QueryResult> };
    };
    const { data, error } = await fromFn('serialized_parts')
      .select(`
        id,
        serial_number,
        status,
        current_location_id,
        installed_on_equipment_id,
        parts(part_number, name),
        stock_locations(name, location_type)
      `)
      .eq('status', 'installed');

    if (error) {
      return {
        name: 'Installed Parts Stock Filter',
        status: 'FAIL',
        message: `Error checking installed parts: ${error.message}`,
      };
    }

    const installedInStock: InstalledPartInStock[] = [];

    for (const part of data || []) {
      if (part.current_location_id && part.status === 'installed') {
        const loc = part.stock_locations;
        if (loc && (loc.location_type === 'warehouse' || loc.location_type === 'truck')) {
          installedInStock.push({
            serialNumber: part.serial_number,
            partNumber: part.parts?.part_number,
            currentLocation: loc.name,
            issue: 'Installed part still has warehouse/truck location',
          });
        }
      }
    }

    if (installedInStock.length > 0) {
      return {
        name: 'Installed Parts Stock Filter',
        status: 'WARNING',
        message: `Found ${installedInStock.length} installed parts that appear in stock locations`,
        details: installedInStock,
      };
    }

    return {
      name: 'Installed Parts Stock Filter',
      status: 'PASS',
      message: 'Installed parts correctly filtered out of stock views',
    };
  }

  private async checkDuplicateInventoryRecords(): Promise<DiagnosticCheck> {
    const rpcFn = supabase.rpc as unknown as (name: string, args: Record<string, unknown>, options?: { count: 'exact' }) => Promise<unknown>;
    const { data, error } = await supabase
      .from('part_inventory')
      .select('part_id, stock_location_id, count')
      .then(() =>
        rpcFn('check_duplicate_inventory', {}, { count: 'exact' }).then(() =>
          supabase.from('part_inventory').select('part_id, stock_location_id')
        )
      );

    if (error) {
      return {
        name: 'Duplicate Inventory Records',
        status: 'FAIL',
        message: `Error checking duplicates: ${error.message}`,
      };
    }

    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const inv of data || []) {
      const key = `${inv.part_id}-${inv.stock_location_id}`;
      if (seen.has(key)) {
        duplicates.push(key);
      }
      seen.add(key);
    }

    if (duplicates.length > 0) {
      return {
        name: 'Duplicate Inventory Records',
        status: 'FAIL',
        message: `Found ${duplicates.length} duplicate part-location combinations`,
        details: duplicates,
      };
    }

    return {
      name: 'Duplicate Inventory Records',
      status: 'PASS',
      message: 'No duplicate inventory records found',
    };
  }

  async getVehicleInventoryReport(vehicleName: string): Promise<VehicleInventoryReport | VehicleInventoryError> {
    const { data: vehicle } = await supabase
      .from('stock_locations')
      .select('*')
      .eq('name', vehicleName)
      .eq('location_type', 'truck')
      .maybeSingle();

    if (!vehicle) {
      return {
        error: `Vehicle "${vehicleName}" not found`,
      };
    }

    const { data: nonSerialized } = await supabase
      .from('part_inventory')
      .select('*, parts(part_number, name, manufacturer)')
      .eq('stock_location_id', vehicle.id);

    const { data: serialized } = await supabase
      .from('serialized_parts_available_stock')
      .select('*')
      .eq('current_location_id', vehicle.id);

    const typedNonSerialized = nonSerialized as unknown as PartInventoryWithPartsAndManufacturer[] | null;
    const typedSerialized = serialized as Views<'serialized_parts_available_stock'>[] | null;

    return {
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        locationCode: vehicle.location_code,
        assignedTo: vehicle.technician_id,
      },
      nonSerializedInventory: typedNonSerialized || [],
      serializedInventory: typedSerialized || [],
      totalNonSerializedUnits: (typedNonSerialized || []).reduce((sum, inv) => sum + inv.quantity, 0),
      totalSerializedUnits: (typedSerialized || []).length,
    };
  }
}

export const inventoryDiagnostics = new InventoryDiagnostics();
