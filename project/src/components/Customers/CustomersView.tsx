import { useEffect, useState } from 'react';
import { Plus, Search, Users, Building, Phone, Mail, X, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { CustomerDetailModal } from './CustomerDetailModal';
import { useAuth } from '../../contexts/AuthContext';
import { GeocodingService } from '../../services/GeocodingService';

type Customer = Database['public']['Tables']['customers']['Row'];

export function CustomersView() {
  const { profile } = useAuth();
  const isTechnician = profile?.role === 'technician';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
    site_contact_name: '',
    site_contact_phone: '',
  });
  const [autoGeocode, setAutoGeocode] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const validateCustomerForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name || formData.name.trim().length < 2) {
      errors.push('Customer name must be at least 2 characters');
    }

    if (!formData.phone || formData.phone.trim().length < 10) {
      errors.push('Phone number is required (at least 10 digits)');
    }

    if (!formData.address || formData.address.trim().length < 5) {
      errors.push('Street address is required');
    }

    if (!formData.city || formData.city.trim().length < 2) {
      errors.push('City is required');
    }

    if (!formData.state || formData.state.trim().length < 2) {
      errors.push('State is required');
    }

    if (!formData.zip_code || formData.zip_code.trim().length < 5) {
      errors.push('ZIP code is required (at least 5 digits)');
    }

    return errors;
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    return (
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isTechnician
              ? 'View customer information and service history'
              : 'Manage customer information and service history'}
          </p>
        </div>
        {!isTechnician && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {customers.length}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">With Email</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {customers.filter((c) => c.email).length}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
              <Mail className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">With Phone</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {customers.filter((c) => c.phone).length}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-3 rounded-lg">
              <Phone className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, email, phone, or address..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-600 dark:text-gray-400">
            No customers found
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {customer.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {customer.name}
                    </h3>
                  </div>
                </div>
                <Building className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>

              <div className="space-y-2">
                {customer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {customer.email}
                    </span>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {customer.phone}
                    </span>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-start space-x-2">
                    <Building className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                      {customer.state && `, ${customer.state}`}
                      {customer.zip_code && ` ${customer.zip_code}`}
                    </span>
                  </div>
                )}

                {customer.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {customer.notes}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowDetailModal(true);
                  setEditMode(false);
                }}
                className="btn btn-outline w-full mt-4"
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Customer</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors([]);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    zip_code: '',
                    notes: '',
                    site_contact_name: '',
                    site_contact_phone: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                // Validate form
                const errors = validateCustomerForm();
                if (errors.length > 0) {
                  setFormErrors(errors);
                  return;
                }
                setFormErrors([]);

                try {
                  // Insert customer first
                  const { data: newCustomer, error } = await supabase
                    .from('customers')
                    .insert([formData])
                    .select()
                    .single();

                  if (error) throw error;

                  // Auto-geocode if enabled and address is present
                  if (autoGeocode && formData.address && newCustomer) {
                    setGeocoding(true);
                    setGeocodeStatus('Geocoding address...');
                    try {
                      const result = await GeocodingService.geocodeCustomer(newCustomer.id);
                      if (result.success) {
                        setGeocodeStatus('Address geocoded successfully!');
                      } else {
                        setGeocodeStatus(`Geocoding failed: ${result.error}`);
                      }
                    } catch (geoError) {
                      console.error('Geocoding error:', geoError);
                      setGeocodeStatus('Geocoding failed. You can geocode later from the map.');
                    }
                    setGeocoding(false);
                  }

                  setShowAddModal(false);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    zip_code: '',
                    notes: '',
                    site_contact_name: '',
                    site_contact_phone: '',
                  });
                  setGeocodeStatus(null);
                  loadCustomers();
                } catch (error) {
                  console.error('Error adding customer:', error);
                  alert('Failed to add customer. Please try again.');
                }
              }}
              className="p-6 space-y-4 overflow-y-auto"
            >
              {formErrors.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Please fix the following errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="John Doe or ABC Company"
                  minLength={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Site Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.site_contact_name}
                    onChange={(e) => setFormData({ ...formData, site_contact_name: e.target.value })}
                    className="input"
                    placeholder="On-site contact person"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Site Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.site_contact_phone}
                    onChange={(e) => setFormData({ ...formData, site_contact_phone: e.target.value })}
                    className="input"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input"
                    placeholder="ST"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="input"
                    placeholder="12345"
                  />
                </div>
              </div>

              {/* Auto-geocode toggle */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-geocode address</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Get map coordinates for dispatch</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoGeocode(!autoGeocode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoGeocode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoGeocode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {geocodeStatus && (
                <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                  geocodeStatus.includes('failed')
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                }`}>
                  {geocoding && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span className="text-sm">{geocodeStatus}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Additional notes about this customer..."
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormErrors([]);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      city: '',
                      state: '',
                      zip_code: '',
                      notes: '',
                      site_contact_name: '',
                      site_contact_phone: '',
                    });
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedCustomer && !editMode && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCustomer(null);
          }}
          onEdit={() => {
            setEditMode(true);
            setFormData({
              name: selectedCustomer.name,
              email: selectedCustomer.email || '',
              phone: selectedCustomer.phone || '',
              address: selectedCustomer.address || '',
              city: selectedCustomer.city || '',
              state: selectedCustomer.state || '',
              zip_code: selectedCustomer.zip_code || '',
              notes: selectedCustomer.notes || '',
              site_contact_name: (selectedCustomer as any).site_contact_name || '',
              site_contact_phone: (selectedCustomer as any).site_contact_phone || '',
            });
          }}
          onDelete={async () => {
            if (
              confirm(
                `Are you sure you want to delete ${selectedCustomer.name}? This action cannot be undone.`
              )
            ) {
              try {
                const { error } = await supabase
                  .from('customers')
                  .delete()
                  .eq('id', selectedCustomer.id);

                if (error) throw error;

                setShowDetailModal(false);
                setSelectedCustomer(null);
                loadCustomers();
              } catch (error) {
                console.error('Error deleting customer:', error);
                alert('Failed to delete customer. Please try again.');
              }
            }
          }}
        />
      )}

      {editMode && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Customer</h2>
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    zip_code: '',
                    notes: '',
                    site_contact_name: '',
                    site_contact_phone: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const { error } = await supabase
                      .from('customers')
                      .update(formData)
                      .eq('id', selectedCustomer.id);

                    if (error) throw error;

                    setEditMode(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      city: '',
                      state: '',
                      zip_code: '',
                      notes: '',
                    });
                    loadCustomers();
                  } catch (error) {
                    console.error('Error updating customer:', error);
                    alert('Failed to update customer. Please try again.');
                  }
                }}
                className="p-6 space-y-4 overflow-y-auto"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Site Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.site_contact_name}
                      onChange={(e) => setFormData({ ...formData, site_contact_name: e.target.value })}
                      className="input"
                      placeholder="On-site contact person"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Site Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.site_contact_phone}
                      onChange={(e) => setFormData({ ...formData, site_contact_phone: e.target.value })}
                      className="input"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="input"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        address: '',
                        city: '',
                        state: '',
                        zip_code: '',
                        notes: '',
                      });
                    }}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
