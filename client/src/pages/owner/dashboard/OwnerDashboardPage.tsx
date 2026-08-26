import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrency } from '@/utils/helpers';
import {
  Home, Calendar, MessageCircle, DollarSign, Star,
  ArrowRight, AlertCircle, CheckCircle,
  Plus
} from 'lucide-react';

function AnimatedCounter({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const steps = 50;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(timer); }
      else setDisplayValue(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{isCurrency ? formatCurrency(displayValue) : displayValue.toLocaleString()}</>;
}

export default function OwnerDashboardPage() {
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['ownerDashboard'],
    queryFn: () => ownerApi.getDashboard().then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-card rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-card rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const performance = data?.propertyPerformance || [];
  const actionItems = data?.actionItems || [];
  const recentBookings = data?.recentBookings || [];
  const recentEnquiries = data?.recentEnquiries || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const kpis = [
    { label: 'Properties', value: stats?.totalProperties || 0, sub: `${stats?.liveProperties || 0} live`, icon: Home, color: 'from-[#0f2557] to-[#1a3a6b]', textColor: 'text-white', subtext: 'text-sky-100' },
    { label: 'Bookings', value: stats?.totalBookings || 0, sub: `${stats?.pendingBookings || 0} pending`, icon: Calendar, color: 'from-emerald-500 to-emerald-600', textColor: 'text-white', subtext: 'text-emerald-100' },
    { label: 'Enquiries', value: stats?.totalEnquiries || 0, sub: `${stats?.newEnquiries || 0} new`, icon: MessageCircle, color: 'from-sky-500 to-sky-600', textColor: 'text-white', subtext: 'text-sky-100' },
    { label: 'Revenue', value: stats?.dealerEarnings || 0, sub: `${stats?.occupancyRate || 0}% occupancy`, icon: DollarSign, color: 'from-purple-500 to-purple-600', textColor: 'text-white', subtext: 'text-purple-100', isCurrency: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0f2557] via-[#1a3a6b] to-[#0ea5e9] p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold">{greeting}, {user?.firstName || 'Owner'}!</h1>
          <p className="text-sky-200 mt-1 text-sm md:text-base">Here's how your properties are performing.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => navigate('/owner/properties/add')}>
              <Plus size={16} className="mr-2" /> Add Property
            </Button>
            <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => navigate('/owner/bookings')}>
              <Calendar size={16} className="mr-2" /> View Bookings
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
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={`overflow-hidden border-0 bg-gradient-to-br ${kpi.color}`}>
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className={`text-xs md:text-sm font-medium ${kpi.subtext} truncate`}>{kpi.label}</p>
                  <p className={`text-xl md:text-2xl font-bold mt-1 ${kpi.textColor}`}>
                    <AnimatedCounter value={kpi.value} isCurrency={kpi.isCurrency} />
                  </p>
                  <p className={`text-xs ${kpi.subtext} mt-1`}>{kpi.sub}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/20">
                  <kpi.icon className={`h-5 w-5 md:h-6 md:w-6 ${kpi.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Property Performance */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Property Performance</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/owner/properties')}>
                View All <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {performance.length > 0 ? (
              <div className="space-y-4">
                {performance.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer" onClick={() => navigate(`/owner/properties/${p.id}`)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                        <Home size={18} className="text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.propertyType} • {p.totalBookings} bookings</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-semibold text-sm">{formatCurrency(Number(p.totalRevenue))}</p>
                      {p.rating && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
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
                <p className="text-muted-foreground">No properties yet</p>
                <Button size="sm" className="mt-3" onClick={() => navigate('/owner/properties/add')}>
                  <Plus size={16} className="mr-2" /> Add Your First Property
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Required */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-500" /> Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actionItems.length > 0 ? (
              <div className="space-y-3">
                {actionItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                    )} />
                    <p className="text-sm">{item.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                <p className="text-muted-foreground">All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar size={14} className="text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{b.user?.firstName} {b.user?.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{b.property?.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={b.bookingStatus === 'CONFIRMED' ? 'success' : b.bookingStatus === 'PENDING' ? 'warning' : 'secondary'}>
                        {b.bookingStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No bookings yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Enquiries</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEnquiries.length > 0 ? (
              <div className="space-y-3">
                {recentEnquiries.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={14} className="text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{e.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{e.property?.name}</p>
                      </div>
                    </div>
                    <Badge variant={e.status === 'NEW' ? 'info' : 'secondary'}>{e.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No enquiries yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
