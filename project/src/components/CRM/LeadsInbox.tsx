import { useState, useEffect } from 'react';
import {
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import { CRMService, Lead, CreateInteractionInput } from '../../services/CRMService';
import { NewInteractionModal } from './NewInteractionModal';

interface LeadsInboxProps {
  onRefresh?: () => void;
}

export function LeadsInbox({ onRefresh }: LeadsInboxProps) {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState<string | null>(null);

  // New lead form
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    lead_source: '',
  });

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await CRMService.getLeadsInbox();
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertLead = async (leadId: string) => {
    setConvertingLead(leadId);
    try {
      await CRMService.convertLead(leadId);
      await loadLeads();
      onRefresh?.();
    } catch (err) {
      console.error('Failed to convert lead:', err);
    } finally {
      setConvertingLead(null);
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.name.trim()) return;

    try {
      await CRMService.createLead(newLead);
      setShowNewLead(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        lead_source: '',
      });
      await loadLeads();
      onRefresh?.();
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm)
  );

  const leadSources = ['Website', 'Referral', 'Phone Call', 'Walk-in', 'Social Media', 'Other'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-10"
          />
        </div>
        <button onClick={() => setShowNewLead(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Lead
        </button>
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Leads Found</h3>
          <p className="text-gray-500 mt-2">
            {searchTerm ? 'No leads match your search' : 'Create your first lead to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedLead(lead)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{lead.name}</h3>
                      {lead.lead_source && (
                        <span className="text-xs text-gray-500">Source: {lead.lead_source}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Phone className="w-4 h-4" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                    {(lead.city || lead.state) && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{[lead.city, lead.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <MessageSquare className="w-4 h-4" />
                      {lead.interaction_count} interactions
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <FileText className="w-4 h-4" />
                      {lead.estimate_count} estimates
                    </span>
                    {lead.pending_estimate_value > 0 && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign className="w-4 h-4" />
                        ${lead.pending_estimate_value.toLocaleString()} pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLead(lead);
                      setShowInteractionModal(true);
                    }}
                    className="btn btn-outline btn-sm"
                    title="Log Interaction"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConvertLead(lead.id);
                    }}
                    disabled={convertingLead === lead.id}
                    className="btn btn-primary btn-sm flex items-center gap-1"
                    title="Convert to Customer"
                  >
                    {convertingLead === lead.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Convert</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Lead Modal */}
      {showNewLead && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowNewLead(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Lead</h3>
                <button onClick={() => setShowNewLead(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Name *</label>
                  <input
                    type="text"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="input w-full"
                    placeholder="Contact name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      className="input w-full"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      className="input w-full"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Address</label>
                  <input
                    type="text"
                    value={newLead.address}
                    onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
                    className="input w-full"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      value={newLead.city}
                      onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input
                      type="text"
                      value={newLead.state}
                      onChange={(e) => setNewLead({ ...newLead, state: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="label">Zip</label>
                    <input
                      type="text"
                      value={newLead.postal_code}
                      onChange={(e) => setNewLead({ ...newLead, postal_code: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Lead Source</label>
                  <select
                    value={newLead.lead_source}
                    onChange={(e) => setNewLead({ ...newLead, lead_source: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select source...</option>
                    {leadSources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowNewLead(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button onClick={handleCreateLead} className="btn btn-primary" disabled={!newLead.name.trim()}>
                  Create Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Modal */}
      {showInteractionModal && selectedLead && (
        <NewInteractionModal
          customerId={selectedLead.id}
          customerName={selectedLead.name}
          onClose={() => {
            setShowInteractionModal(false);
            setSelectedLead(null);
          }}
          onSaved={() => {
            setShowInteractionModal(false);
            loadLeads();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
