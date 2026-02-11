import { Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface PayrollStatsCardsProps {
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
}

export function PayrollStatsCards({
  totalEmployees,
  totalGrossPay,
  totalDeductions,
  totalNetPay,
}: PayrollStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {totalEmployees}
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Gross Pay</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ${totalGrossPay.toFixed(2)}
            </p>
          </div>
          <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Deductions</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              ${totalDeductions.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-100 dark:bg-red-900/20 text-red-600 p-3 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Net Pay</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ${totalNetPay.toFixed(2)}
            </p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
