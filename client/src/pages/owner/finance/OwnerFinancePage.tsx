import { useQuery } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function OwnerFinancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['ownerFinance'],
    queryFn: () => ownerApi.getFinanceOverview().then(res => res.data.data),
  });

  const { data: propertySummary } = useQuery({
    queryKey: ['ownerPropertySummary'],
    queryFn: () => ownerApi.getPropertySummary().then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentTransactions = data?.recentTransactions || [];
  const propertyBreakdown = propertySummary || [];

  const kpis = [
    { label: 'Total Revenue', value: stats.totalRevenue || 0, icon: DollarSign, color: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600' },
    { label: 'Your Earnings', value: stats.totalEarnings || 0, icon: TrendingUp, color: 'bg-sky-100 dark:bg-sky-900/30', textColor: 'text-sky-600' },
    { label: 'Pending Payout', value: stats.pendingPayout || 0, icon: CreditCard, color: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-600' },
    { label: 'Total Paid Out', value: stats.totalPaidOut || 0, icon: ArrowUpRight, color: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-600' },
  ];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Finance</h1>
        <p className="text-gray-500 text-sm">Track your earnings and financial overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 truncate">{kpi.label}</p>
                  <p className="text-lg md:text-2xl font-bold mt-1 truncate">{formatCurrency(kpi.value)}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-lg flex-shrink-0 ${kpi.color}`}>
                  <kpi.icon className={`h-5 w-5 md:h-6 md:w-6 ${kpi.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue by Property Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Revenue by Property Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              {propertyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={propertyBreakdown}>
                    <XAxis dataKey="propertyType" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="totalRevenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              {propertyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ propertyType, count }) => `${propertyType} (${count})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalRevenue"
                    >
                      {propertyBreakdown.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign size={18} className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{tx.property?.name || 'Booking'}</p>
                      <p className="text-xs text-gray-500">{tx.user?.firstName} {tx.user?.lastName} · {formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-green-600">{formatCurrency(Number(tx.totalAmount))}</p>
                    <p className="text-xs text-gray-500">{tx.payment?.paymentMethod || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
