import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, Building2, Home, Calendar, DollarSign, TrendingUp } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsPage() {
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getOverview().then(res => res.data.data),
  });

  const { data: propertyAnalytics } = useQuery({
    queryKey: ['propertyAnalytics'],
    queryFn: () => dashboardApi.getPropertyAnalytics().then(res => res.data.data),
  });

  const { data: topDealers } = useQuery({
    queryKey: ['topDealers'],
    queryFn: () => dashboardApi.getTopDealers().then(res => res.data.data),
  });

  const { data: activity } = useQuery({
    queryKey: ['activity'],
    queryFn: () => dashboardApi.getRecentActivity().then(res => res.data.data),
  });

  if (dashboardLoading) {
    return (
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const propertyTypeData = propertyAnalytics?.map((item: any) => ({
    name: item.propertyType,
    count: item._count,
    revenue: Number(item._sum?.totalRevenue || 0),
  })) || [];

  const totalRevenue = propertyTypeData.reduce((sum: number, item: any) => sum + item.revenue, 0);
  const totalProperties = dashboard?.properties?.total || 0;
  const totalUsers = dashboard?.users?.total || 0;
  const totalDealers = dashboard?.dealers?.total || 0;
  const totalBookings = dashboard?.bookings?.total || 0;

  const overviewStats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Dealers', value: totalDealers, icon: Building2, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Properties', value: totalProperties, icon: Home, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Total Bookings', value: totalBookings, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Avg. Occupancy', value: `${totalProperties > 0 ? ((totalBookings / totalProperties) * 10).toFixed(1) : 0}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm">Comprehensive platform analytics and insights</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
        {overviewStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-2 md:p-3 rounded-lg ${stat.bg} flex-shrink-0`}>
                  <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 truncate">{stat.label}</p>
                  <p className="text-base md:text-xl font-bold truncate">{stat.value}</p>
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

        {/* Property Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Property Distribution</CardTitle>
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
                    dataKey="count"
                  >
                    {propertyTypeData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Dealers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Top Dealers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topDealers?.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {topDealers.slice(0, 5).map((dealer: any, index: number) => (
                  <div key={dealer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-gray-400 w-6 flex-shrink-0">#{index + 1}</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{dealer.businessName}</p>
                        <p className="text-xs text-gray-500">{dealer._count?.properties || 0} properties</p>
                      </div>
                    </div>
                    <span className="font-semibold flex-shrink-0 ml-2">{formatCurrency(Number(dealer.totalRevenue || 0))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No dealer data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {activity?.recentBookings?.slice(0, 4).map((booking: any) => (
                <div key={booking.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Calendar size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {booking.user?.firstName} {booking.user?.lastName} booked{' '}
                      <span className="font-medium">{booking.property?.name}</span>
                    </p>
                    <p className="text-xs text-gray-500">Booking</p>
                  </div>
                </div>
              ))}
              {activity?.recentUsers?.slice(0, 3).map((user: any) => (
                <div key={user.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      <span className="font-medium">{user.firstName} {user.lastName}</span> joined
                    </p>
                    <p className="text-xs text-gray-500">User Registration</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Property Type Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Property Type</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Count</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Share</th>
                </tr>
              </thead>
              <tbody>
                {propertyTypeData.map((item: any) => (
                  <tr key={item.name} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-right">{item.count}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.revenue)}</td>
                    <td className="py-3 px-4 text-right">{totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
