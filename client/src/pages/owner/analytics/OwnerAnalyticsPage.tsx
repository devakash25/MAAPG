import { useQuery } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/helpers';
import { Home, Calendar, DollarSign, TrendingUp, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function OwnerAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['ownerAnalytics'],
    queryFn: () => ownerApi.getAnalytics().then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const stats = data?.totalStats || {};
  const propertiesByType = data?.propertiesByType || [];
  const monthlyRevenue = data?.monthlyRevenue || [];
  const bookingStatus = data?.bookingStatusBreakdown || [];
  const topProperties = data?.topProperties || [];
  const occupancyByType = data?.occupancyByType || [];

  const revenueChange = stats.lastMonthRevenue > 0
    ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100).toFixed(1)
    : '0';

  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue || 0), icon: DollarSign, color: 'bg-green-100 text-green-700' },
    { label: 'Your Earnings', value: formatCurrency(stats.totalEarnings || 0), icon: TrendingUp, color: 'bg-sky-100 text-sky-700' },
    { label: 'Total Bookings', value: stats.totalBookings || 0, icon: Calendar, color: 'bg-purple-100 text-purple-700' },
    { label: 'This Month', value: formatCurrency(stats.thisMonthRevenue || 0), icon: DollarSign, color: 'bg-yellow-100 text-yellow-700', change: revenueChange },
  ];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500 text-sm">Insights and trends for your properties</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{kpi.label}</p>
                  <p className="text-lg md:text-xl font-bold mt-1 truncate">{kpi.value}</p>
                  {'change' in kpi && kpi.change && (
                    <div className="flex items-center gap-1 mt-1">
                      {Number(kpi.change) >= 0 ? <ArrowUpRight size={14} className="text-green-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                      <span className={`text-xs font-medium ${Number(kpi.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{kpi.change}%</span>
                      <span className="text-xs text-gray-400">vs last month</span>
                    </div>
                  )}
                </div>
                <div className={`p-2 rounded-lg flex-shrink-0 ${kpi.color}`}>
                  <kpi.icon size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {monthlyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="commissions" stroke="#10b981" strokeWidth={2} name="Your Earnings" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No revenue data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Properties by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Properties by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {propertiesByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertiesByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type} (${count})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {propertiesByType.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No properties yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Occupancy by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Occupancy by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {occupancyByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="occupancy" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No occupancy data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Booking Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {bookingStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No booking data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Top Properties by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {topProperties.length > 0 ? (
            <div className="space-y-3">
              {topProperties.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg font-bold text-gray-400 w-6">{i + 1}</span>
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <Home size={18} className="text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.propertyType}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm">{formatCurrency(p.totalRevenue)}</p>
                    {p.rating && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" /> {Number(p.rating).toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Home size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No property data yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
