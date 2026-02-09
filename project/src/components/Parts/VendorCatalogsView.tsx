import { useState, useEffect } from 'react';
import { Package, Search, Star, Clock } from 'lucide-react';
import { PartsOrderingService, VendorCatalogItem } from '../../services/PartsOrderingService';
import { supabase } from '../../lib/supabase';

interface Vendor {
  id: string;
  name: string;
}

export function VendorCatalogsView() {
  const [loading, setLoading] = useState(true);
  const [catalogItems, setCatalogItems] = useState<VendorCatalogItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [preferredOnly, setPreferredOnly] = useState(false);

  useEffect(() => {
    loadVendors();
    loadCatalogItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendor, preferredOnly]);

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadCatalogItems = async () => {
    try {
      setLoading(true);

      const items = await PartsOrderingService.getVendorCatalogItems({
        vendorId: selectedVendor !== 'all' ? selectedVendor : undefined,
        preferredOnly,
      });

      setCatalogItems(items);
    } catch (error) {
      console.error('Error loading catalog items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = catalogItems.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.partNumber.toLowerCase().includes(search) ||
      item.partDescription.toLowerCase().includes(search) ||
      item.vendorPartNumber?.toLowerCase().includes(search) ||
      item.vendorName.toLowerCase().includes(search)
    );
  });

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vendor Catalogs</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse vendor part catalogs with pricing and lead times
        </p>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by part number, description, or vendor SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="input md:w-64"
          >
            <option value="all">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>

          <label className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="checkbox"
              checked={preferredOnly}
              onChange={(e) => setPreferredOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Preferred Only</span>
          </label>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="card p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No catalog items found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedVendor !== 'all' || preferredOnly
              ? 'Try adjusting your search or filters'
              : 'No vendor catalog items have been configured yet'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Part
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor SKU
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    MOQ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pack Qty
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lead Time
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Purchase
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr key={item.catalogItemId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {item.isPreferredVendor && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.partNumber}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.partDescription}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.vendorName}
                      </div>
                      {item.vendorCode && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.vendorCode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.vendorPartNumber || '-'}
                      </div>
                      {item.uom && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.uom}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.lastCost || item.standardCost)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.moq || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.packQty || 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.leadTimeDays ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.leadTimeDays}d
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(item.lastPurchaseDate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
