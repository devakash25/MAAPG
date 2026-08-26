import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, timeAgo } from '@/utils/helpers';
import {
  Users, Building2, Home, Calendar, DollarSign, AlertTriangle,
  ArrowRight, TrendingUp, Eye, ClipboardList
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useThemeStore } from '@/store/themeStore';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4'];

function AnimatedCounter({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <>{isCurrency ? formatCurrency(displayValue) : displayValue.toLocaleString()}</>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getOverview().then(res => res.data.data),
  });

  const { data: propertyAnalytics } = useQuery({
    queryKey: ['propertyAnalytics'],
    queryFn: () => dashboardApi.getPropertyAnalytics().then(res => res.data.data),
  });

  const { data: activity } = useQuery({
    queryKey: ['activity'],
    queryFn: () => dashboardApi.getRecentActivity().then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-card rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalUsers = dashboard?.users?.total || 0;
  const totalDealers = dashboard?.dealers?.total || 0;
  const totalProperties = dashboard?.properties?.total || 0;
  const totalBookings = dashboard?.bookings?.total || 0;
  const totalRevenue = dashboard?.revenue?.total || 0;
  const pendingDealers = dashboard?.dealers?.pending || 0;
  const activeProperties = dashboard?.properties?.active || 0;
  const pendingComplaints = dashboard?.complaints?.pending || 0;

  const kpis = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      gradient: 'gradient-blue',
      textColor: 'text-white',
      subtext: 'text-sky-100',
      path: '/admin/users',
    },
    {
      title: 'Total Dealers',
      value: totalDealers,
      icon: Building2,
      gradient: 'gradient-green',
      textColor: 'text-white',
      subtext: 'text-emerald-100',
      path: '/admin/dealers',
    },
    {
      title: 'Total Properties',
      value: totalProperties,
      icon: Home,
      gradient: 'gradient-primary',
      textColor: 'text-white',
      subtext: 'text-sky-200',
      path: '/admin/properties',
    },
    {
      title: 'Total Bookings',
      value: totalBookings,
      icon: Calendar,
      gradient: 'gradient-orange',
      textColor: 'text-white',
      subtext: 'text-orange-100',
      path: '/admin/bookings',
    },
    {
      title: 'Total Revenue',
      value: totalRevenue,
      icon: DollarSign,
      gradient: 'gradient-emerald',
      textColor: 'text-white',
      subtext: 'text-emerald-100',
      isCurrency: true,
      path: '/admin/revenue',
    },
    {
      title: 'Pending Dealers',
      value: pendingDealers,
      icon: AlertTriangle,
      gradient: 'gradient-yellow',
      textColor: 'text-white',
      subtext: 'text-yellow-100',
      isAlert: true,
      path: '/admin/dealers',
    },
    {
      title: 'Active Properties',
      value: activeProperties,
      icon: TrendingUp,
      gradient: 'gradient-indigo',
      textColor: 'text-white',
      subtext: 'text-indigo-100',
      path: '/admin/properties',
    },
    {
      title: 'Pending Complaints',
      value: pendingComplaints,
      icon: AlertTriangle,
      gradient: 'gradient-red',
      textColor: 'text-white',
      subtext: 'text-red-100',
      isAlert: true,
      path: '/admin/complaints',
    },
  ];

  const propertyTypeData = propertyAnalytics?.map((item: any) => ({
    name: item.propertyType,
    count: item._count,
    revenue: Number(item._sum?.totalRevenue || 0),
  })) || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const gridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0f2557] via-[#1a3a6b] to-[#0ea5e9] p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold">{greeting}, Admin!</h1>
          <p className="text-sky-200 mt-1 text-sm md:text-base">Here's what's happening across your platform today.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => navigate('/admin/analytics')}
            >
              <Eye size={16} className="mr-2" /> View Analytics
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => navigate('/admin/dealers')}
            >
              <ClipboardList size={16} className="mr-2" /> Pending Verifications
              {pendingDealers > 0 && (
                <Badge className="ml-2 bg-white text-[#0f2557]">{pendingDealers}</Badge>
              )}
            </Button>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.4,-0.9C86.8,14.4,81,28.9,72.4,41.3C63.8,53.7,52.3,64,39.4,71.5C26.5,79,12.2,83.8,-2.5,87.2C-17.2,90.6,-34.4,92.7,-47.3,85.7C-60.2,78.7,-68.8,62.7,-75.1,46.1C-81.4,29.5,-85.4,12.3,-84.8,-4.6C-84.2,-21.5,-79,-38.1,-69.4,-51.1C-59.8,-64.1,-45.8,-73.5,-31.3,-80.3C-16.8,-87.1,-1.8,-91.3,12.3,-88.9C26.4,-86.5,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.title}
            className="animate-slide-up cursor-pointer"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => navigate(kpi.path)}
          >
            <Card className={`overflow-hidden hover-lift border-0 ${kpi.gradient}`}>
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className={`text-xs md:text-sm font-medium ${kpi.subtext} truncate`}>{kpi.title}</p>
                    <p className={`text-xl md:text-2xl font-bold mt-1 ${kpi.textColor}`}>
                      <AnimatedCounter value={kpi.value} isCurrency={kpi.isCurrency} />
                    </p>
                  </div>
                  <div className="p-2.5 md:p-3 rounded-lg bg-white/20 flex-shrink-0">
                    <kpi.icon className={`h-5 w-5 md:h-6 md:w-6 ${kpi.textColor}`} />
                  </div>
                </div>
                <div className={`flex items-center gap-1 mt-3 text-xs ${kpi.subtext}`}>
                  <ArrowRight size={12} />
                  <span>View details</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Revenue Overview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/revenue')}>
                View All <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyTypeData} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0f2557" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Property Type Distribution */}
        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Property Distribution</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/analytics')}>
                Details <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={propertyTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="count"
                    animationBegin={0}
                    animationDuration={1200}
                  >
                    {propertyTypeData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {propertyTypeData.map((item: any, index: number) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Type Performance */}
        <Card className="lg:col-span-2 hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Property Type Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {propertyTypeData.map((item: any, index: number) => {
                const maxRevenue = Math.max(...propertyTypeData.map((d: any) => d.revenue), 1);
                const percentage = (item.revenue / maxRevenue) * 100;
                return (
                  <div key={item.name} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{item.count} properties</span>
                        <span className="font-semibold text-sm">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto sidebar-scrollbar">
              {activity?.recentBookings?.slice(0, 4).map((booking: any, index: number) => (
                <div
                  key={booking.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors animate-slide-in-right"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
                    <Calendar size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{booking.user.firstName} {booking.user.lastName}</span>
                      {' '}booked{' '}
                      <span className="font-medium text-sky-500">{booking.property.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(booking.createdAt)}</p>
                  </div>
                </div>
              ))}
              {activity?.recentUsers?.slice(0, 3).map((user: any, index: number) => (
                <div
                  key={user.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors animate-slide-in-right"
                  style={{ animationDelay: `${(index + 4) * 0.1}s` }}
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{user.firstName} {user.lastName}</span>
                      {' '}joined as{' '}
                      <Badge variant="secondary" className="text-xs">{user.role}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(user.createdAt)}</p>
                  </div>
                </div>
              ))}
              {(!activity?.recentBookings?.length && !activity?.recentUsers?.length) && (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
