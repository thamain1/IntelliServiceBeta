import { useEffect, useState, useCallback } from 'react';
import { Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BIPageLayout } from './BIPageLayout';
import { DateRangeSelector } from './DateRangeSelector';
import { useBIDateRange } from '../../hooks/useBIDateRange';
import { supabase } from '../../lib/supabase';
import { ExportData } from '../../services/ExportService';

interface CustomerData {
  id: string;
  name: string;
  lifetimeRevenue: number;
  lastServiceDate: string | null;
  openAR: number;
}

interface CustomerMetrics {
  topCustomerName: string;
  topCustomerRevenue: number;
  avgRevenuePerCustomer: number;
  totalCustomers: number;
  customers: CustomerData[];
}

export function CustomerValueInsight() {
  const { dateRange, setDateRange, start } = useBIDateRange();
  const [metrics, setMetrics] = useState<CustomerMetrics>({
    topCustomerName: 'N/A',
    topCustomerRevenue: 0,
    avgRevenuePerCustomer: 0,
    totalCustomers: 0,
    customers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, created_at');

      const customerData: CustomerData[] = [];

      for (const customer of customers || []) {
        // Query invoices using correct column names (issue_date, total_amount, balance_due)
        // Exclude draft, cancelled, written_off to match CustomerFinancialService
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total_amount, balance_due, status, issue_date')
          .eq('customer_id', customer.id)
          .not('status', 'in', '(draft,cancelled,written_off)')
          .gte('issue_date', start.toISOString());

        const lifetimeRevenue =
          invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

        const openAR =
          invoices?.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0) || 0;

        const { data: tickets } = await supabase
          .from('tickets')
          .select('completed_date')
          .eq('customer_id', customer.id)
          .not('completed_date', 'is', null)
          .order('completed_date', { ascending: false })
          .limit(1);

        const lastServiceDate = tickets?.[0]?.completed_date || null;

        customerData.push({
          id: customer.id,
          name: customer.name,
          lifetimeRevenue,
          lastServiceDate,
          openAR,
        });
      }

      customerData.sort((a, b) => b.lifetimeRevenue - a.lifetimeRevenue);

      const totalRevenue = customerData.reduce((sum, c) => sum + c.lifetimeRevenue, 0);
      const avgRevenue = customerData.length > 0 ? totalRevenue / customerData.length : 0;

      const topCustomer = customerData[0] || { name: 'N/A', lifetimeRevenue: 0 };

      setMetrics({
        topCustomerName: topCustomer.name,
        topCustomerRevenue: topCustomer.lifetimeRevenue,
        avgRevenuePerCustomer: avgRevenue,
        totalCustomers: customerData.length,
        customers: customerData.slice(0, 20),
      });
    } catch (error) {
      console.error('Error loading customer value:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = useCallback((): ExportData => {
    return {
      title: 'Customer Value Analysis Report',
      subtitle: 'Lifetime value and customer insights',
      dateRange: { start, end: new Date() },
      columns: [
        { header: 'Customer', key: 'name' },
        { header: 'Lifetime Revenue', key: 'lifetimeRevenue', format: 'currency' },
        { header: 'Last Service', key: 'lastServiceDate', format: 'date' },
        { header: 'Open AR', key: 'openAR', format: 'currency' },
      ],
      rows: metrics.customers.map((customer) => ({
        name: customer.name,
        lifetimeRevenue: customer.lifetimeRevenue,
        lastServiceDate: customer.lastServiceDate,
        openAR: customer.openAR,
      })),
      summary: {
        top_customer: `${metrics.topCustomerName} ($${metrics.topCustomerRevenue.toLocaleString()})`,
        avg_revenue_per_customer: `$${Math.round(metrics.avgRevenuePerCustomer).toLocaleString()}`,
        total_customers: metrics.totalCustomers,
        period: dateRange,
      },
    };
  }, [metrics, start, dateRange]);

  const statCards = [
    {
      title: 'Top Customer',
      value: `$${metrics.topCustomerRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      subtitle: metrics.topCustomerName,
    },
    {
      title: 'Avg Revenue per Customer',
      value: `$${Math.round(metrics.avgRevenuePerCustomer).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Total Customers',
      value: metrics.totalCustomers,
      icon: Users,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      title: 'Active Period',
      value: dateRange.charAt(0).toUpperCase() + dateRange.slice(1),
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BIPageLayout
      title="Customer Value Analysis"
      subtitle="Lifetime value and customer insights"
      exportEnabled={true}
      getExportData={getExportData}
    >
      <DateRangeSelector value={dateRange} onChange={setDateRange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate max-w-[150px]">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div className={`${card.bgColor} ${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Top 10 Customers by Revenue
          </h2>
          <div className="h-80">
            {metrics.customers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.customers.slice(0, 10).map(c => ({
                    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
                    revenue: c.lifetimeRevenue,
                    openAR: c.openAR,
                  }))}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    type="number"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickLine={false}
                    width={75}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#F9FAFB' }}
                    labelStyle={{ color: '#F9FAFB' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue'] as unknown as [string, string]}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {metrics.customers.slice(0, 10).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'][index % 10]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No customer data for selected period
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Customer Details
          </h2>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            {metrics.customers.length > 0 ? (
              <table className="w-full">
                <thead className="sticky top-0 bg-white dark:bg-gray-800">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Customer
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Revenue
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Open AR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {customer.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        ${customer.lifetimeRevenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                        ${customer.openAR.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No customer data for this period
              </p>
            )}
          </div>
        </div>
      </div>
    </BIPageLayout>
  );
}
