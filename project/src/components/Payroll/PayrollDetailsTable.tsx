import { X } from 'lucide-react';

interface PayrollDetail {
  id: string;
  payroll_run_id: string;
  user_id: string;
  regular_hours: number;
  overtime_hours: number;
  regular_pay: number;
  overtime_pay: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  profiles?: { full_name: string };
}

interface PayrollRun {
  id: string;
  run_number: string;
  pay_date: string;
}

interface PayrollDetailsTableProps {
  run: PayrollRun;
  details: PayrollDetail[];
  onClose: () => void;
}

export function PayrollDetailsTable({
  run,
  details,
  onClose,
}: PayrollDetailsTableProps) {
  const totalGrossPay = details.reduce((sum, detail) => sum + (detail.gross_pay || 0), 0);
  const totalDeductions = details.reduce((sum, detail) => sum + (detail.total_deductions || 0), 0);
  const totalNetPay = details.reduce((sum, detail) => sum + (detail.net_pay || 0), 0);

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Payroll Details - {run.run_number}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pay Date: {new Date(run.pay_date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Regular Hours
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                OT Hours
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Gross Pay
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Deductions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Net Pay
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {details.map((detail) => (
              <tr key={detail.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {detail.profiles?.full_name || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-900 dark:text-white">
                    {detail.regular_hours.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-900 dark:text-white">
                    {detail.overtime_hours.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-medium text-green-600">
                    ${detail.gross_pay.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-medium text-red-600">
                    ${detail.total_deductions.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-medium text-blue-600">
                    ${detail.net_pay.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                Totals
              </td>
              <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                {details.reduce((sum, d) => sum + d.regular_hours, 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                {details.reduce((sum, d) => sum + d.overtime_hours, 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right font-bold text-green-600">
                ${totalGrossPay.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right font-bold text-red-600">
                ${totalDeductions.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right font-bold text-blue-600">
                ${totalNetPay.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
