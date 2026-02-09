import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { Tables, TablesUpdate, Views } from '../lib/dbTypes';

type StockLocation = Database['public']['Tables']['stock_locations']['Row'];

// Composite type for part_inventory with joined stock_locations
type PartInventoryWithLocation = Tables<'part_inventory'> & {
  stock_locations: Pick<Tables<'stock_locations'>, 'id' | 'name' | 'location_type'> | null;
};

// Type for get_equipment_child_parts RPC result
type EquipmentChildPartRpc = Database['public']['Functions']['get_equipment_child_parts']['Returns'][number];

export interface InventoryBalance {
  partId: string;
  locationId: string;
  locationName: string;
  locationType: string;
  quantity: number;
  unitCost: number | null;
}

export interface PartInventorySummary {
  partId: string;
  totalQuantity: number;
  locations: InventoryBalance[];
}

export interface InventoryAdjustment {
  partId: string;
  locationId: string;
  quantity: number;
  adjustmentType: 'set' | 'add' | 'subtract';
  unitCost?: number;
}

export interface InventoryTransfer {
  partId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
}

export interface SerializedPartInfo {
  id: string;
  serialNumber: string;
  partId: string;
  partName: string;
  partNumber: string;
  status: string;
  currentLocationId: string | null;
  currentLocationName: string | null;
  installedAtSiteId: string | null;
  installedOnEquipmentId: string | null;
  installedAtSiteName: string | null;
  parentEquipmentSerial: string | null;
}

export interface EquipmentChildPart {
  partId: string;
  serialNumber: string;
  partName: string;
  partNumber: string;
  status: string;
  installationDate: string | null;
  warrantyStatus: string;
  warrantyEnd: string | null;
}

class InventoryService {
  async getInventoryByPart(partId: string): Promise<PartInventorySummary> {
    const { data, error } = await supabase
      .from('part_inventory')
      .select(`
        *,
        stock_locations (
          id,
          name,
          location_type
        )
      `)
      .eq('part_id', partId);

    if (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }

    const locations: InventoryBalance[] = (data || []).map((inv: unknown) => {
      const inventory = inv as unknown as PartInventoryWithLocation;
      return {
        partId: inventory.part_id,
        locationId: inventory.stock_location_id,
        locationName: inventory.stock_locations?.name || 'Unknown',
        locationType: inventory.stock_locations?.location_type || 'unknown',
        quantity: inventory.quantity,
        unitCost: inventory.unit_cost,
      };
    });

    const totalQuantity = locations.reduce((sum, loc) => sum + loc.quantity, 0);

    return {
      partId,
      totalQuantity,
      locations,
    };
  }

  async getInventoryByLocation(locationId: string): Promise<InventoryBalance[]> {
    const { data, error } = await supabase
      .from('part_inventory')
      .select(`
        *,
        stock_locations!inner (
          id,
          name,
          location_type
        )
      `)
      .eq('stock_location_id', locationId);

    if (error) {
      console.error('Error fetching location inventory:', error);
      throw error;
    }

    return (data || []).map((inv: unknown) => {
      const inventory = inv as unknown as PartInventoryWithLocation;
      return {
        partId: inventory.part_id,
        locationId: inventory.stock_location_id,
        locationName: inventory.stock_locations?.name || 'Unknown',
        locationType: inventory.stock_locations?.location_type || 'unknown',
        quantity: inventory.quantity,
        unitCost: inventory.unit_cost,
      };
    });
  }

  async getOnHand(partId: string, locationId: string): Promise<number> {
    const { data, error } = await supabase
      .from('part_inventory')
      .select('quantity')
      .eq('part_id', partId)
      .eq('stock_location_id', locationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching on-hand quantity:', error);
      throw error;
    }

    return data?.quantity || 0;
  }

  async getTotalOnHand(partId: string): Promise<number> {
    const summary = await this.getInventoryByPart(partId);
    return summary.totalQuantity;
  }

  async adjustInventory(adjustment: InventoryAdjustment): Promise<void> {
    const { partId, locationId, quantity, adjustmentType, unitCost } = adjustment;

    const existingInventory = await supabase
      .from('part_inventory')
      .select('*')
      .eq('part_id', partId)
      .eq('stock_location_id', locationId)
      .maybeSingle();

    if (existingInventory.error) {
      throw existingInventory.error;
    }

    let newQuantity: number;

    if (existingInventory.data) {
      const currentQty = existingInventory.data.quantity;

      switch (adjustmentType) {
        case 'set':
          newQuantity = quantity;
          break;
        case 'add':
          newQuantity = currentQty + quantity;
          break;
        case 'subtract':
          newQuantity = Math.max(0, currentQty - quantity);
          break;
      }

      const updateData: TablesUpdate<'part_inventory'> = {
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
        ...(unitCost !== undefined && { unit_cost: unitCost }),
      };

      const { error } = await supabase
        .from('part_inventory')
        .update(updateData)
        .eq('id', existingInventory.data.id);

      if (error) {
        throw error;
      }
    } else {
      newQuantity = adjustmentType === 'set' ? quantity : Math.max(0, quantity);

      const { error } = await supabase.from('part_inventory').insert([
        {
          part_id: partId,
          stock_location_id: locationId,
          quantity: newQuantity,
          unit_cost: unitCost,
        },
      ]);

      if (error) {
        throw error;
      }
    }
  }

  async transferInventory(transfer: InventoryTransfer): Promise<void> {
    const { partId, fromLocationId, toLocationId, quantity } = transfer;

    if (fromLocationId === toLocationId) {
      throw new Error('Cannot transfer to the same location');
    }

    const fromQty = await this.getOnHand(partId, fromLocationId);

    if (quantity > fromQty) {
      throw new Error('Insufficient quantity at source location');
    }

    await this.adjustInventory({
      partId,
      locationId: fromLocationId,
      quantity,
      adjustmentType: 'subtract',
    });

    await this.adjustInventory({
      partId,
      locationId: toLocationId,
      quantity,
      adjustmentType: 'add',
    });
  }

  async receiveInventory(
    partId: string,
    locationId: string,
    quantity: number,
    unitCost?: number
  ): Promise<void> {
    await this.adjustInventory({
      partId,
      locationId,
      quantity,
      adjustmentType: 'add',
      unitCost,
    });
  }

  async getAllInventory(): Promise<Array<{ partId: string; locationId: string; quantity: number }>> {
    const { data, error } = await supabase
      .from('part_inventory')
      .select('part_id, stock_location_id, quantity')
      .gt('quantity', 0);

    if (error) {
      console.error('Error fetching all inventory:', error);
      throw error;
    }

    return (data || []).map((inv) => ({
      partId: inv.part_id,
      locationId: inv.stock_location_id,
      quantity: inv.quantity,
    }));
  }

  async getActiveLocations(): Promise<StockLocation[]> {
    const { data, error } = await supabase
      .from('stock_locations')
      .select('*')
      .eq('is_active', true)
      .order('location_type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching stock locations:', error);
      throw error;
    }

    return data || [];
  }

  async getSerializedPartsAvailable(locationId?: string): Promise<SerializedPartInfo[]> {
    let query = supabase
      .from('serialized_parts_available_stock')
      .select('*');

    if (locationId) {
      query = query.eq('current_location_id', locationId);
    }

    const { data, error } = await query.order('location_name').order('part_name');

    if (error) {
      console.error('Error fetching available serialized parts:', error);
      throw error;
    }

    return (data || []).map((item: Views<'serialized_parts_available_stock'>) => ({
      id: item.id ?? '',
      serialNumber: item.serial_number ?? '',
      partId: item.part_id ?? '',
      partName: item.part_name ?? '',
      partNumber: item.part_number ?? '',
      status: item.status ?? '',
      currentLocationId: item.current_location_id,
      currentLocationName: item.location_name,
      installedAtSiteId: null,
      installedOnEquipmentId: null,
      installedAtSiteName: null,
      parentEquipmentSerial: null,
    }));
  }

  async getSerializedPartsInstalled(equipmentId?: string, siteId?: string): Promise<SerializedPartInfo[]> {
    let query = supabase
      .from('serialized_parts_installed')
      .select('*');

    if (equipmentId) {
      query = query.eq('installed_on_equipment_id', equipmentId);
    }

    if (siteId) {
      query = query.eq('installed_at_site_id', siteId);
    }

    const { data, error } = await query.order('customer_name').order('equipment_serial').order('part_name');

    if (error) {
      console.error('Error fetching installed serialized parts:', error);
      throw error;
    }

    return (data || []).map((item: Views<'serialized_parts_installed'>) => ({
      id: item.id ?? '',
      serialNumber: item.serial_number ?? '',
      partId: item.part_id ?? '',
      partName: item.part_name ?? '',
      partNumber: item.part_number ?? '',
      status: item.status ?? '',
      currentLocationId: null,
      currentLocationName: null,
      installedAtSiteId: item.installed_at_site_id,
      installedOnEquipmentId: item.installed_on_equipment_id,
      installedAtSiteName: item.customer_name,
      parentEquipmentSerial: item.equipment_serial,
    }));
  }

  async getEquipmentChildParts(equipmentId: string): Promise<EquipmentChildPart[]> {
    const { data, error } = await supabase.rpc('get_equipment_child_parts', {
      equipment_uuid: equipmentId,
    });

    if (error) {
      console.error('Error fetching equipment child parts:', error);
      throw error;
    }

    return (data || []).map((item: EquipmentChildPartRpc) => ({
      partId: item.part_id,
      serialNumber: item.serial_number,
      partName: item.part_name,
      partNumber: item.part_number,
      status: item.status,
      installationDate: item.installation_date,
      warrantyStatus: item.warranty_status,
      warrantyEnd: item.warranty_end,
    }));
  }

  async getVehicleInventory(vehicleLocationId: string): Promise<{
    nonSerialized: InventoryBalance[];
    serialized: SerializedPartInfo[];
  }> {
    const nonSerialized = await this.getInventoryByLocation(vehicleLocationId);

    const serialized = await this.getSerializedPartsAvailable(vehicleLocationId);

    return {
      nonSerialized,
      serialized,
    };
  }

  async transferSerializedPart(
    serializedPartId: string,
    fromLocationId: string,
    toLocationId: string
  ): Promise<void> {
    if (fromLocationId === toLocationId) {
      throw new Error('Cannot transfer to the same location');
    }

    const { error } = await supabase
      .from('serialized_parts')
      .update({
        current_location_id: toLocationId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serializedPartId)
      .eq('current_location_id', fromLocationId);

    if (error) {
      throw error;
    }
  }

  async installSerializedPart(
    serializedPartId: string,
    equipmentId: string,
    siteId: string,
    ticketId: string,
    installedBy: string
  ): Promise<void> {
    const { error } = await supabase
      .from('serialized_parts')
      .update({
        status: 'installed',
        installed_on_equipment_id: equipmentId,
        installed_at_site_id: siteId,
        installed_on_ticket_id: ticketId,
        installed_by: installedBy,
        installation_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', serializedPartId);

    if (error) {
      throw error;
    }
  }

  async uninstallSerializedPart(
    serializedPartId: string,
    returnToLocationId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('serialized_parts')
      .update({
        status: 'in_stock',
        installed_on_equipment_id: null,
        installed_at_site_id: null,
        current_location_id: returnToLocationId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serializedPartId);

    if (error) {
      throw error;
    }
  }
}

export const inventoryService = new InventoryService();
