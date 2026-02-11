import { FileText, CheckCircle, BookOpen } from 'lucide-react';

interface PayrollRun {
  id: string;
  run_number: string;
  period_start_date: string;
  period_end_date: string;
  pay_date: string;
  status: string;
  total_gross_pay: number;
  total_deductions: number;
  total_net_pay: number;
  employee_count: number;
  gl_posted?: boolean;
}

interface PayrollRunsTableProps {
  runs: PayrollRun[];
  onViewDetails: (run: PayrollRun) => void;
  onProcessPayroll: (runId: string) => void;
  onPostToGL?: (runId: string) => void;
}

export function PayrollRunsTable({
  runs,
  onViewDetails,
  onProcessPayroll,
  onPostToGL,
}: PayrollRunsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'badge-gray';
      case 'processing':
        return 'badge-yellow';
      case 'approved':
        return 'badge-blue';
      case 'paid':
        return 'badge-green';
      case 'cancelled':
        return 'badge-red';
      default:
        return 'badge-gray';
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Run Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pay Date
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Employees
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Net Pay
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GL Posted
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No payroll runs found. Click "New Pay Period" to create one.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {run.run_number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 dark:text-white">
                      {new Date(run.period_start_date).toLocaleDateString()} - {new Date(run.period_end_date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 dark:text-white">
                      {new Date(run.pay_date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-900 dark:text-white">
                      {run.employee_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${run.total_net_pay.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusColor(run.status)}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {run.gl_posted ? (
                      <span className="badge badge-green">Posted</span>
                    ) : (
                      <span className="badge badge-gray">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onViewDetails(run)}
                        className="btn btn-outline p-2"
                        title="View Details"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {run.status === 'draft' && (
                        <button
                          onClick={() => onProcessPayroll(run.id)}
                          className="btn btn-primary p-2"
                          title="Process Payroll"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {run.status === 'paid' && !run.gl_posted && onPostToGL && (
                        <button
                          onClick={() => onPostToGL(run.id)}
                          className="btn btn-outline p-2"
                          title="Post to GL"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
