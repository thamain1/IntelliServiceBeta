import { useState } from 'react';
import {
  Book,
  Search,
  HelpCircle,
  Ticket,
  Calendar,
  Users,
  Package,
  Building2,
  FolderKanban,
  FileText,
  Receipt,
  Calculator,
  Wallet,
  Clock,
  MapPin,
  BarChart2,
  Settings,
  Upload,
  Zap,
  Phone,
  Mail,
  PauseCircle,
  ShoppingCart,
  PackageCheck,
  Bell,
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export function HelpView() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [_expandedSections, _setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));

  // Unused - kept for future expandable sections functionality

  const sections: Section[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Logging In</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Navigate to the IntelliService application URL</li>
              <li>Enter your email address and password</li>
              <li>Click <span className="font-medium">Sign In</span></li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">User Roles</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Permissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Core</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Admin</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Full system access</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">All features, user management, settings, permissions</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Office Roles</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Office Manager</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Office operations lead</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Tickets, customers, invoicing, dispatch, user management</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Dispatcher</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Scheduling operations</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Scheduling, tickets, dispatch board, customers</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Accounting</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Finance operations</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Invoicing, AR/AP, journal entries, financial reports</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Field Service Roles</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Lead Tech / Field Supervisor</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Field team lead</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Tickets, approve work, assign techs, inventory adjustments</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">Technician</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Field operations</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Assigned tickets, time clock, parts usage</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Navigation</h3>
            <p className="text-gray-600 dark:text-gray-300">
              The sidebar provides access to all modules. On mobile devices, tap the hamburger menu to open navigation.
              Click on any section header to expand or collapse its menu items.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: BarChart2,
      content: (
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300">
            The Dashboard provides an at-a-glance view of your business operations with key performance indicators.
          </p>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">KPI Cards</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Open Tickets</span> - Service requests awaiting assignment or completion</li>
              <li><span className="font-medium">Scheduled Today</span> - Jobs scheduled for the current day</li>
              <li><span className="font-medium">In Progress</span> - Active jobs being worked on</li>
              <li><span className="font-medium">Completed Today</span> - Jobs finished today</li>
              <li><span className="font-medium">Clocked In Technicians</span> - Active field workers</li>
              <li><span className="font-medium">Awaiting Parts</span> - Jobs on hold for parts</li>
              <li><span className="font-medium">Issues Reported</span> - Jobs with reported problems</li>
            </ul>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <span className="font-medium">Tip:</span> Click any KPI card to navigate directly to a filtered view of those items.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'tickets',
      title: 'Tickets & Work Orders',
      icon: Ticket,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ticket Types</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="font-medium text-gray-900 dark:text-white">SVC - Service Work Order</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Standard service calls and repairs</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="font-medium text-gray-900 dark:text-white">PRJ - Project Work Order</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Jobs linked to larger projects</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Creating a Ticket</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Click <span className="font-medium">New Ticket</span> button</li>
              <li>Select ticket type (SVC or PRJ)</li>
              <li>Choose a customer (required)</li>
              <li>Select equipment if applicable</li>
              <li>Set priority level (Low, Normal, High, Urgent)</li>
              <li>Assign to a technician (optional)</li>
              <li>Enter title and description</li>
              <li>Set scheduled date and estimated duration</li>
              <li>Click <span className="font-medium">Create Ticket</span></li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ticket Statuses</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Open</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Scheduled</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Closed & Billed</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelled</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">For Technicians</h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-300">
              <p><span className="font-medium">Starting Work:</span> Select your assigned ticket and click "Start Work" to begin the timer.</p>
              <p><span className="font-medium">During Work:</span> Add progress updates, upload photos, and record parts used.</p>
              <p><span className="font-medium">Hold for Parts:</span> Click "Need Parts" if you need to pause for materials.</p>
              <p><span className="font-medium">Report Issue:</span> Click "Report Issue" if there's a problem preventing completion.</p>
              <p><span className="font-medium">Completing:</span> Stop the timer, add final notes, and click "Mark Complete".</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dispatch',
      title: 'Dispatch & Scheduling',
      icon: Calendar,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Views</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Calendar View</span> - Monthly calendar showing scheduled tickets</li>
              <li><span className="font-medium">List View</span> - Flat list of all tickets for the month</li>
              <li><span className="font-medium">Board View</span> - Drag-and-drop scheduling with technician columns</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Scheduling a Ticket</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-white mb-2">Drag and Drop Method:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>Switch to Board View</li>
                <li>Find unscheduled tickets in the left panel</li>
                <li>Drag a ticket to a technician's column at the desired time</li>
                <li>Ticket automatically updates to "Scheduled" status</li>
              </ol>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Multi-Technician Assignments</h3>
            <p className="text-gray-600 dark:text-gray-300">
              For jobs requiring multiple technicians, open the ticket details, click "Add Tech",
              assign roles (Lead or Helper), and set individual start/end times if needed.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'customers',
      title: 'Customers',
      icon: Users,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Adding a Customer</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Navigate to <span className="font-medium">Customers</span></li>
              <li>Click <span className="font-medium">Add Customer</span></li>
              <li>Enter customer name (required), email, phone, and address</li>
              <li>Add any notes</li>
              <li>Click <span className="font-medium">Save</span></li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Customer Details Tabs</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Contact</span> - Full contact information</li>
              <li><span className="font-medium">Installed Equipment</span> - Equipment at customer locations</li>
              <li><span className="font-medium">Installed Parts</span> - Parts installed at customer sites</li>
              <li><span className="font-medium">Service History</span> - All service tickets for this customer</li>
              <li><span className="font-medium">Financials</span> - Revenue, balances, and invoices (Admin/Dispatcher only)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'equipment',
      title: 'Equipment Management',
      icon: Settings,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Equipment Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Track all HVAC equipment including serial numbers, models, manufacturers, warranty status, and service history.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Warranty Status Colors</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active (90+ days)</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Expiring Soon (&lt;90 days)</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Expired</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'contracts',
      title: 'Service Contracts',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Contract Plans</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Labor Discount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Parts Discount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Visits/Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">Silver</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">10%</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">10%</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">1</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">Gold</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">15%</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">15%</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">2</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">Platinum</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">20%</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">20%</td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">4</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Creating a Contract</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Navigate to Service Contracts</li>
              <li>Click <span className="font-medium">New Contract</span></li>
              <li>Select customer and location</li>
              <li>Choose a contract plan</li>
              <li>Set start and end dates</li>
              <li>Enable auto-renewal if desired</li>
              <li>Click <span className="font-medium">Create Contract</span></li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'parts',
      title: 'Parts & Inventory',
      icon: Package,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Inventory Management</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Track parts and tools across multiple stock locations including warehouses and technician trucks.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Part Types</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="font-medium text-gray-900 dark:text-white">Non-Serialized</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Tracked by quantity (consumables, common parts)</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="font-medium text-gray-900 dark:text-white">Serialized</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Individual serial number tracking (compressors, motors)</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Purchase Order Workflow</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 flex-wrap">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Draft</span>
              <span>→</span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">Submitted</span>
              <span>→</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">Approved</span>
              <span>→</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">Received</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Transfers</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Move parts between locations: select the part, choose source and destination, enter quantity, and complete the transfer.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'hold-for-parts',
      title: 'Hold for Parts Workflow',
      icon: PauseCircle,
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <span className="font-medium">Overview:</span> The Hold for Parts workflow ensures tickets are never lost when waiting for parts.
              It creates an automated link from technician request through purchasing to receiving, with automatic ticket updates.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Complete Workflow</h3>
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <PauseCircle className="w-4 h-4" /> Technician Requests Parts
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    From the ticket, technician clicks <span className="font-medium">"Need Parts"</span>, selects required parts, sets urgency level, and submits.
                    The ticket is automatically placed on hold.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Purchasing Creates PO
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Go to <span className="font-medium">Parts Management → Parts Requests</span>. Review pending requests sorted by urgency.
                    Click <span className="font-medium">"Create Purchase Order"</span> to auto-populate a PO with the requested parts linked to the ticket.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <PackageCheck className="w-4 h-4" /> Warehouse Receives to Job Staging
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    When receiving the PO, parts are placed in <span className="font-medium">Job Staging</span> (not directly to a truck).
                    Parts are <span className="font-medium">reserved</span> for the specific ticket but not yet assigned to a technician.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-2 ml-4">
                    <li>Parts remain in staging until technician pickup</li>
                    <li>Ticket status changes to "Parts Ready"</li>
                    <li>A Pick List is automatically generated</li>
                    <li>If technician assignment changes, parts automatically follow the new assignment</li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4" /> Technician Picks Up Parts
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Go to <span className="font-medium">Parts Management → Parts Pickup</span>. The technician sees their assigned pickups.
                    Click <span className="font-medium">"Pickup Parts"</span> to transfer parts from Job Staging to their truck inventory.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-2 ml-4">
                    <li>Parts are transferred to the tech's assigned truck</li>
                    <li>Ticket hold is removed</li>
                    <li>Ticket is ready for dispatch/completion</li>
                    <li>Chain of custody is documented</li>
                  </ul>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Dispatcher Reschedules
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    The dispatcher sees the ticket is ready (parts picked up) and can schedule the technician to complete the job.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Job Staging - Chain of Custody</h3>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <p className="text-green-800 dark:text-green-200 text-sm">
                <span className="font-medium">Why Job Staging?</span> Parts are received into a virtual staging area instead of directly to a truck.
                This provides flexibility if technician assignments change and maintains clear chain of custody documentation.
              </p>
            </div>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Flexibility:</span> Parts float in reserved status until the technician picks them up</li>
              <li><span className="font-medium">No Manual Transfers:</span> If a different tech is assigned, parts automatically follow the new assignment</li>
              <li><span className="font-medium">Accountability:</span> Technician must acknowledge pickup, accepting custody of the parts</li>
              <li><span className="font-medium">Visibility:</span> Dispatchers can see which parts are waiting for pickup at any time</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Parts Request Queue</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Access via <span className="font-medium">Parts Management → Parts Requests</span>. The queue shows:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Urgency Sorting</span> - Critical requests appear first</li>
              <li><span className="font-medium">Days Waiting</span> - Track how long each request has been pending</li>
              <li><span className="font-medium">SLA Alerts</span> - Requests waiting more than 5 days are flagged</li>
              <li><span className="font-medium">Quick PO Creation</span> - One click to create a linked Purchase Order</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Urgency Levels</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Level</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">When to Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Critical</span></td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Customer has no heat/AC, emergency situation</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">High</span></td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">System degraded, customer uncomfortable</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Medium</span></td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Standard repair, customer can wait a few days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Low</span></td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Preventive maintenance, non-urgent upgrade</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Best Practices</h4>
            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>Technicians should always select specific parts from the catalog when possible</li>
              <li>Include clear notes about why the part is needed</li>
              <li>Purchasing should review the Parts Request Queue daily</li>
              <li>Monitor SLA breaches to prevent customer delays</li>
              <li>Keep vendor lead times updated for accurate delivery expectations</li>
              <li>Technicians should check Parts Pickup queue before starting their day</li>
              <li>Ensure technicians have a default truck assigned in their profile for pickup to work</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'vendors',
      title: 'Vendors',
      icon: Building2,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vendor Management</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Manage suppliers with contact information, payment terms, contracts, and performance tracking.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vendor Contracts</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Pricing Contracts</span> - Negotiated part pricing</li>
              <li><span className="font-medium">Service Contracts</span> - Maintenance agreements</li>
              <li><span className="font-medium">Warranty Contracts</span> - Extended warranty terms</li>
              <li><span className="font-medium">Distribution Agreements</span> - Exclusive arrangements</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Performance Metrics</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Track vendor reliability with on-time delivery percentage, fill rate, lead times, and quality metrics.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: FolderKanban,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Project Types</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Standalone Project</span> - Single-site job</li>
              <li><span className="font-medium">Master Project</span> - Multi-site or phased project</li>
              <li><span className="font-medium">Site Job</span> - Individual site within a master project</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Features</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Budget Tracking</span> - Labor, parts, equipment, travel, overhead</li>
              <li><span className="font-medium">Milestone Billing</span> - Define and invoice by milestones</li>
              <li><span className="font-medium">Deposit Management</span> - Track and release deposits</li>
              <li><span className="font-medium">Work Orders</span> - PRJ tickets linked to projects</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'estimates',
      title: 'Estimates',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Creating an Estimate</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Navigate to <span className="font-medium">Estimates</span></li>
              <li>Click <span className="font-medium">New Estimate</span></li>
              <li>Select customer and enter job details</li>
              <li>Add line items (labor, parts, equipment)</li>
              <li>Review totals and save</li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sending to Customer</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Click "Send Estimate" to email or SMS a secure portal link where customers can review and approve or decline.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Converting Accepted Estimates</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Once accepted, convert to a Service Ticket or Project with all line items transferred automatically.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'invoicing',
      title: 'Invoicing',
      icon: Receipt,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Creating an Invoice</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Invoices can be created automatically from completed tickets or manually with custom line items.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Invoice Workflow</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 flex-wrap">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Draft</span>
              <span>→</span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">Sent</span>
              <span>→</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">Paid</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recording Payment</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Open the invoice and click "Mark as Paid" to record payment and close the invoice.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'accounting',
      title: 'Accounting',
      icon: Calculator,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Features</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Chart of Accounts</span> - Assets, liabilities, equity, revenue, expenses</li>
              <li><span className="font-medium">Journal Entries</span> - Manual debit/credit entries</li>
              <li><span className="font-medium">AR Aging</span> - Track customer balances by age</li>
              <li><span className="font-medium">Bank Reconciliation</span> - Match transactions to bank statements</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Financial Reports</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Balance Sheet</span> - Assets, liabilities, equity as of a date</li>
              <li><span className="font-medium">Income Statement</span> - Revenue and expenses for a period</li>
              <li><span className="font-medium">Cash Flow Statement</span> - Operating, investing, financing activities</li>
              <li><span className="font-medium">P&L by Job</span> - Profitability by project/ticket</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'payroll',
      title: 'Payroll',
      icon: Wallet,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Running Payroll</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Navigate to <span className="font-medium">Payroll</span></li>
              <li>Click <span className="font-medium">New Period</span></li>
              <li>Set period start/end dates and pay date</li>
              <li>System pulls approved time logs</li>
              <li>Review employee hours and calculations</li>
              <li>Approve and process payroll</li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Deductions</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Configure tax, insurance, retirement, and garnishment deductions as fixed amounts or percentages.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'timeclock',
      title: 'Time Clock & GPS',
      icon: Clock,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Time Clock</h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-300">
              <p><span className="font-medium">Clock In:</span> Navigate to Time Clock and click "Clock In" to start your shift.</p>
              <p><span className="font-medium">Clock Out:</span> Click "Clock Out" when finished. Hours are automatically calculated.</p>
              <p><span className="font-medium">Approval:</span> Admin/Dispatchers approve completed time entries for payroll.</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">GPS Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              View real-time technician locations on the map. Status indicators show activity level:
            </p>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full bg-green-500"></span> Online (&lt;5 min)
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Recent (&lt;30 min)
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> Offline
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'tracking',
      title: 'GPS Tracking',
      icon: MapPin,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Real-Time Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              View all technician locations on the map with real-time updates every 30 seconds.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Technician Details</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Click on a technician to see their current location, active jobs, and contact information.
              Use "Get Directions" to open Google Maps for navigation.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'reports',
      title: 'Reports & BI',
      icon: BarChart2,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Available Reports</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Job Cost Reports</span> - Cost and revenue by job</li>
              <li><span className="font-medium">Financials</span> - Revenue and payment status</li>
              <li><span className="font-medium">Technician Metrics</span> - Performance by technician</li>
              <li><span className="font-medium">Project Margins</span> - Profitability analysis</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">BI Dashboards</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Revenue Trends</span> - Period-over-period growth</li>
              <li><span className="font-medium">Customer Value</span> - Top customers and lifetime value</li>
              <li><span className="font-medium">DSO</span> - Days sales outstanding and collection efficiency</li>
              <li><span className="font-medium">Labor Efficiency</span> - Billable vs non-billable hours</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">User Management</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create, edit, and manage users. Assign roles (Admin, Dispatcher, Technician) and set labor costs for technicians.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Labor Rates</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Configure billing rates for standard hours, after-hours, and emergency service. Set business hour definitions.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Contract Plans</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create and manage service contract plan templates with discount levels, included visits, and SLA definitions.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'data-import',
      title: 'Data Import',
      icon: Upload,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Supported Imports</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li><span className="font-medium">Customers</span> - Customer master data</li>
              <li><span className="font-medium">Open AR</span> - Unpaid invoice balances</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Import Process</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Select entity type to import</li>
              <li>Upload CSV/TSV file</li>
              <li>Map columns to fields</li>
              <li>Review validation results</li>
              <li>Start import</li>
            </ol>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <span className="font-medium">Tip:</span> Use UTF-8 encoding for files and include headers in the first row.
              Dates should be formatted as YYYY-MM-DD.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Book className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help Center</h1>
              <p className="text-gray-600 dark:text-gray-400">Learn how to use IntelliService</p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Escalations & Support Contact */}
          <div className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Escalations & Support</h3>
                  <p className="text-blue-100 text-sm">Jesse Morgan - Available for urgent issues</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="tel:+13146236782"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>(314) 623-6782</span>
                </a>
                <a
                  href="mailto:2ea34ab9.NETORGFT14421663.onmicrosoft.com@amer.teams.ms?subject=IntelliService%20Issue%20Report"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Report Issue</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-200px)] overflow-y-auto">
            <nav className="p-4 space-y-1">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-8">
            {filteredSections.map((section) => (
              <div
                key={section.id}
                className={activeSection === section.id ? 'block' : 'hidden'}
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <section.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
                  </div>
                  {section.content}
                </div>
              </div>
            ))}

            {filteredSections.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No help topics found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
