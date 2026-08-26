import { useQuery } from '@tanstack/react-query';
import { dashboardApi, settingsApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/helpers';
import { DollarSign, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function RevenuePage() {
  const { data: propertyAnalytics } = useQuery({
    queryKey: ['propertyAnalytics'],
    queryFn: () => dashboardApi.getPropertyAnalytics().then(res => res.data.data),
  });

  const { data: commissionData } = useQuery({
    queryKey: ['commission'],
    queryFn: () => settingsApi.getCommission().then(res => res.data.data),
  });

  const propertyTypeData = propertyAnalytics?.map((item: any) => ({
    name: item.propertyType,
    revenue: Number(item._sum?.totalRevenue || 0),
    bookings: item._count,
  })) || [];

  const totalRevenue = propertyTypeData.reduce((sum: number, item: any) => sum + item.revenue, 0);

  const commissionRates = commissionData?.rates || {};
  const totalCommission = propertyTypeData.reduce((sum: number, item: any) => {
    const rate = (commissionRates[item.name] || 10) / 100;
    return sum + (item.revenue * rate);
  }, 0);
  const avgCommissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue * 100) : 10;

  const dealerPayouts = totalRevenue - totalCommission;

  const getCommissionRate = (propertyType: string) => {
    return (commissionRates[propertyType] || 10) / 100;
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Revenue</h1>
        <p className="text-gray-500 text-sm">Track platform revenue and financial metrics</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Total Revenue</p>
                <p className="text-lg md:text-2xl font-bold truncate">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-lg flex-shrink-0"><DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500 truncate">Commission ({avgCommissionRate.toFixed(1)}%)</p>
                <p className="text-lg md:text-2xl font-bold truncate">{formatCurrency(totalCommission)}</p>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-lg flex-shrink-0"><CreditCard className="h-5 w-5 md:h-6 md:w-6 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Dealer Payouts</p>
                <p className="text-lg md:text-2xl font-bold truncate">{formatCurrency(dealerPayouts)}</p>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 rounded-lg flex-shrink-0"><ArrowUpRight className="h-5 w-5 md:h-6 md:w-6 text-purple-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Refunds</p>
                <p className="text-lg md:text-2xl font-bold truncate">{formatCurrency(0)}</p>
              </div>
              <div className="p-2 md:p-3 bg-red-100 rounded-lg flex-shrink-0"><ArrowDownRight className="h-5 w-5 md:h-6 md:w-6 text-red-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue by Property Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Revenue by Property Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#0088FE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={propertyTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {propertyTypeData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Property Type</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Bookings</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Commission Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Commission</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Dealer Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Share</th>
                </tr>
              </thead>
              <tbody>
                {propertyTypeData.map((item: any) => {
                  const rate = getCommissionRate(item.name);
                  const commission = item.revenue * rate;
                  return (
                    <tr key={item.name} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-right">{item.bookings}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.revenue)}</td>
                      <td className="py-3 px-4 text-right">{(rate * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right text-green-600">{formatCurrency(commission)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.revenue - commission)}</td>
                      <td className="py-3 px-4 text-right">{totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
