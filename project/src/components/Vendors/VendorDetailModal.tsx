import { useState } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  DollarSign,
  Calendar,
  Star,
  Package,
  Edit,
  Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Vendor {
  id: string;
  vendor_code: string;
  name: string;
  display_name: string;
  legal_name: string;
  tax_id: string;
  primary_email: string;
  primary_phone: string;
  website: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  status: string;
  rating: number | null;
  preferred_vendor: boolean;
  payment_terms: string;
  payment_method: string;
  credit_limit: number | null;
  standard_lead_time_days: number;
  minimum_order_amount: number | null;
  notes: string;
  internal_notes: string;
  created_at: string;
}

interface VendorDetailModalProps {
  vendor: Vendor;
  onClose: () => void;
  onUpdate: () => void;
}

export function VendorDetailModal({ vendor, onClose, onUpdate }: VendorDetailModalProps) {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(vendor);

  const canEdit = profile?.role === 'admin' || profile?.role === 'dispatcher';

  const handleSave = async () => {
    if (!canEdit) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          display_name: formData.display_name,
          legal_name: formData.legal_name,
          tax_id: formData.tax_id,
          primary_email: formData.primary_email,
          primary_phone: formData.primary_phone,
          website: formData.website,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
          status: formData.status,
          rating: formData.rating,
          preferred_vendor: formData.preferred_vendor,
          payment_terms: formData.payment_terms,
          payment_method: formData.payment_method,
          credit_limit: formData.credit_limit,
          standard_lead_time_days: formData.standard_lead_time_days,
          minimum_order_amount: formData.minimum_order_amount,
          notes: formData.notes,
          internal_notes: formData.internal_notes,
          name: formData.display_name || formData.legal_name,
        })
        .eq('id', vendor.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
    } catch (error: unknown) {
      console.error('Error updating vendor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Error updating vendor: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {vendor.display_name || vendor.legal_name}
                </h2>
                {vendor.preferred_vendor && (
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {vendor.vendor_code}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Company Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    className="input w-full"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {vendor.display_name || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Legal Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="legal_name"
                    value={formData.legal_name}
                    onChange={handleChange}
                    className="input w-full"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {vendor.legal_name || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Tax ID
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleChange}
                    className="input w-full"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {vendor.tax_id || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Status
                </label>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input w-full"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="on_hold">On Hold</option>
                    <option value="inactive">Inactive</option>
                    <option value="blacklisted">Blacklisted</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-white capitalize">
                    {vendor.status?.replace('_', ' ')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Rating
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating || ''}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.1"
                    className="input w-full"
                  />
                ) : (
                  <div className="flex items-center">
                    {vendor.rating ? (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(vendor.rating!)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {vendor.rating.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">No rating</span>
                    )}
                  </div>
                )}
              </div>

              {isEditing && (
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="preferred_vendor"
                      checked={formData.preferred_vendor}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Preferred Vendor
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Contact Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="primary_email"
                    value={formData.primary_email}
                    onChange={handleChange}
                    className="input w-full"
                  />
                ) : (
                  <a
                    href={`mailto:${vendor.primary_email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {vendor.primary_email || '-'}
                  </a>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="primary_phone"
                    value={formData.primary_phone}
                    onChange={handleChange}
                    className="input w-full"
                  />
                ) : (
                  <a
                    href={`tel:${vendor.primary_phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {vendor.primary_phone || '-'}
                  </a>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="input w-full"
                  />
                ) : vendor.website ? (
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {vendor.website}
                  </a>
                ) : (
                  <p className="text-gray-500">-</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address
                </label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                      placeholder="Address Line 1"
                      className="input w-full"
                    />
                    <input
                      type="text"
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleChange}
                      placeholder="Address Line 2"
                      className="input w-full"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        className="input w-full"
                      />
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        className="input w-full"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        placeholder="Postal Code"
                        className="input w-full"
                      />
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="Country"
                        className="input w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-900 dark:text-white">
                    {vendor.address_line1 && <div>{vendor.address_line1}</div>}
                    {vendor.address_line2 && <div>{vendor.address_line2}</div>}
                    {(vendor.city || vendor.state) && (
                      <div>
                        {vendor.city}
                        {vendor.city && vendor.state && ', '}
                        {vendor.state} {vendor.postal_code}
                      </div>
                    )}
                    {vendor.country && <div>{vendor.country}</div>}
                    {!vendor.address_line1 && !vendor.city && (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Payment Terms
              </label>
              {isEditing ? (
                <select
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="Net 10">Net 10</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {vendor.payment_terms || '-'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Lead Time
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="standard_lead_time_days"
                  value={formData.standard_lead_time_days}
                  onChange={handleChange}
                  className="input w-full"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {vendor.standard_lead_time_days} days
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                <Package className="w-4 h-4 inline mr-1" />
                Min Order
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="minimum_order_amount"
                  value={formData.minimum_order_amount || ''}
                  onChange={handleChange}
                  step="0.01"
                  className="input w-full"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {vendor.minimum_order_amount
                    ? `$${vendor.minimum_order_amount.toFixed(2)}`
                    : '-'}
                </p>
              )}
            </div>
          </div>

          {vendor.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Notes
              </label>
              {isEditing ? (
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="input w-full"
                />
              ) : (
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {vendor.notes}
                </p>
              )}
            </div>
          )}

          {(profile?.role === 'admin' || profile?.role === 'dispatcher') && vendor.internal_notes && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Internal Notes (Admin Only)
              </label>
              {isEditing ? (
                <textarea
                  name="internal_notes"
                  value={formData.internal_notes}
                  onChange={handleChange}
                  rows={3}
                  className="input w-full"
                />
              ) : (
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded">
                  {vendor.internal_notes}
                </p>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
            Created on {new Date(vendor.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
