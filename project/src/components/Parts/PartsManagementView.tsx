import { useState, useEffect } from 'react';
import { Package, Truck, ShoppingCart, Hash, Shield, MapPin, ArrowRightLeft, PackageCheck, Wrench, ClipboardList } from 'lucide-react';
import { PartsView } from './PartsView';
import { VendorsView } from './VendorsView';
import { PurchaseOrdersView } from './PurchaseOrdersView';
import { SerializedPartsView } from './SerializedPartsView';
import { StockLocationsView } from './StockLocationsView';
import { WarrantyDashboard } from './WarrantyDashboard';
import { PartsTransferView } from './PartsTransferView';
import { PartsReceivingView } from './PartsReceivingView';
import { PartsRequestQueue } from './PartsRequestQueue';

type TabType = 'catalog' | 'vendors' | 'orders' | 'serialized' | 'locations' | 'warranty' | 'transfers' | 'receiving' | 'requests';
type ItemType = 'part' | 'tool';

interface PartsManagementViewProps {
  initialView?: string;
  itemType?: ItemType;
}

export function PartsManagementView({ initialView, itemType = 'part' }: PartsManagementViewProps) {
  const isTool = itemType === 'tool';
  const itemLabel = isTool ? 'Tool' : 'Part';
  const itemLabelPlural = isTool ? 'Tools' : 'Parts';
  const ItemIcon = isTool ? Wrench : Package;
  const getInitialTab = (): TabType => {
    switch (initialView) {
      case 'parts-inventory':
      case 'tools-inventory':
        return 'locations';
      case 'parts-purchase-orders':
      case 'tools-purchase-orders':
        return 'orders';
      case 'parts-transfers':
      case 'tools-transfers':
        return 'transfers';
      case 'parts-receiving':
      case 'tools-receiving':
      case 'parts-receipts':
      case 'tools-receipts':
        return 'receiving';
      case 'parts-requests':
        return 'requests';
      default:
        return 'catalog';
    }
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [linkedRequest, setLinkedRequest] = useState<any>(null);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [initialView]);

  // Handle creating a PO from a parts request
  const handleCreatePOFromRequest = (request: any) => {
    setLinkedRequest(request);
    setActiveTab('orders');
  };

  const tabs: Array<{ id: TabType; label: string; icon: typeof Package }> = [
    { id: 'catalog', label: `${itemLabelPlural} Catalog`, icon: ItemIcon },
    { id: 'requests', label: 'Parts Requests', icon: ClipboardList },
    { id: 'vendors', label: 'Vendors', icon: Truck },
    { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'serialized', label: 'Serialized Inventory', icon: Hash },
    { id: 'locations', label: 'Stock Locations', icon: MapPin },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'receiving', label: 'Receiving', icon: PackageCheck },
    { id: 'warranty', label: 'Warranty Tracking', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{itemLabelPlural} Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isTool
            ? 'Comprehensive tools ordering, tracking, serialization & asset management'
            : 'Comprehensive parts ordering, tracking, serialization & warranty system'}
        </p>
      </div>

      <div className="card p-1">
        <div className="grid grid-cols-2 md:grid-cols-9 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'catalog' && <PartsView itemType={itemType} />}
        {activeTab === 'requests' && <PartsRequestQueue onCreatePO={handleCreatePOFromRequest} />}
        {activeTab === 'vendors' && <VendorsView />}
        {activeTab === 'orders' && (
          <PurchaseOrdersView
            itemType={itemType}
            linkedRequest={linkedRequest}
            onClearLinkedRequest={() => setLinkedRequest(null)}
          />
        )}
        {activeTab === 'serialized' && <SerializedPartsView itemType={itemType} />}
        {activeTab === 'locations' && <StockLocationsView itemType={itemType} />}
        {activeTab === 'transfers' && <PartsTransferView itemType={itemType} />}
        {activeTab === 'receiving' && <PartsReceivingView itemType={itemType} onNavigateToOrders={() => setActiveTab('orders')} />}
        {activeTab === 'warranty' && <WarrantyDashboard />}
      </div>
    </div>
  );
}
