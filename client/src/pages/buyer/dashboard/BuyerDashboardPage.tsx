import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { buyerApi } from '@/services';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/helpers';
import {
  Search, Hotel, Bed, Building, Home, MapPin, Star, Calendar,
  Heart, CreditCard, ChevronRight, Clock
} from 'lucide-react';

const propertyTypeIcons: Record<string, any> = {
  HOTEL: Hotel, HOSTEL: Building, PG: Bed, RENTAL_ROOM: Home, APARTMENT: Building, GUEST_HOUSE: Home,
};

const propertyTypeColors: Record<string, string> = {
  HOTEL: 'from-blue-500 to-blue-600',
  HOSTEL: 'from-purple-500 to-purple-600',
  PG: 'from-green-500 to-green-600',
  RENTAL_ROOM: 'from-orange-500 to-orange-600',
  APARTMENT: 'from-pink-500 to-pink-600',
  GUEST_HOUSE: 'from-teal-500 to-teal-600',
};

function PropertyCard({ property }: { property: any }) {
  const navigate = useNavigate();
  const price = property.rooms?.[0]?.pricePerMonth || property.rooms?.[0]?.pricePerNight;
  const img = property.images?.[0]?.url;

  return (
    <div
      onClick={() => navigate(`/buyer/property/${property.id}`)}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
    >
      <div className="relative h-44 bg-gray-200 dark:bg-gray-800 overflow-hidden">
        {img ? (
          <img src={img} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {(() => { const Icon = propertyTypeIcons[property.propertyType] || Home; return <Icon size={40} className="text-gray-400" />; })()}
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
          {property.propertyType?.replace('_', ' ')}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[#0f172a] dark:text-white truncate">{property.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <MapPin size={14} />
          <span className="truncate">{property.city}</span>
        </div>
        {property.averageRating && (
          <div className="flex items-center gap-1 mt-2 text-sm">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="font-medium">{Number(property.averageRating).toFixed(1)}</span>
            <span className="text-gray-400">({property.totalReviews} reviews)</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {property.amenities?.slice(0, 3).map((a: any) => (
            <span key={a.name} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
              {a.name}
            </span>
          ))}
        </div>
        {price && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-sky-600 dark:text-sky-400">₹{Number(price).toLocaleString()}<span className="text-xs font-normal text-gray-500">/month</span></span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyerDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['buyerDashboard'],
    queryFn: () => buyerApi.getDashboard().then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  const stats = dashboard?.stats;
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0f2557] to-[#0ea5e9] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">{greeting}, {user?.firstName} 👋</h1>
          <p className="text-sky-100 mt-1">Find your perfect stay</p>

          <div className="mt-4 flex gap-2 max-w-xl">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchQuery && navigate(`/buyer/explore?search=${searchQuery}`)}
                placeholder="Search city, area, college, landmark..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <Button onClick={() => searchQuery && navigate(`/buyer/explore?search=${searchQuery}`)} className="bg-white text-sky-600 hover:bg-sky-50 px-6">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Property Type Quick Access */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { type: 'HOTEL', label: 'Hotels', icon: Hotel },
          { type: 'PG', label: 'PG', icon: Bed },
          { type: 'HOSTEL', label: 'Hostels', icon: Building },
          { type: 'RENTAL_ROOM', label: 'Rooms', icon: Home },
          { type: 'APARTMENT', label: 'Apartments', icon: Building },
          { type: 'GUEST_HOUSE', label: 'Guest Houses', icon: Home },
        ].map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => navigate(`/buyer/explore?propertyType=${type}`)}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-sky-300 dark:hover:border-sky-700 transition-colors flex-shrink-0"
          >
            <div className={`w-10 h-10 bg-gradient-to-br ${propertyTypeColors[type]} rounded-lg flex items-center justify-center`}>
              <Icon size={20} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'text-blue-500' },
            { label: 'Upcoming', value: stats.upcomingBookings, icon: Clock, color: 'text-green-500' },
            { label: 'Wishlist', value: stats.totalWishlist, icon: Heart, color: 'text-red-500' },
            { label: 'Total Spent', value: `₹${Number(stats.totalSpent).toLocaleString()}`, icon: CreditCard, color: 'text-purple-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-gray-100 dark:bg-gray-800", color)}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0f172a] dark:text-white">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recommended Properties */}
      {dashboard?.recommendedProperties?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Recommended for you</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/buyer/explore')}>
              View All <ChevronRight size={16} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboard.recommendedProperties.slice(0, 8).map((property: any) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      )}

      {/* Popular Properties */}
      {dashboard?.popularProperties?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Popular Properties</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/buyer/explore?sort=popular')}>
              View All <ChevronRight size={16} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboard.popularProperties.slice(0, 4).map((property: any) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {dashboard?.recentBookings?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Recent Bookings</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/buyer/bookings')}>
              View All <ChevronRight size={16} />
            </Button>
          </div>
          <div className="space-y-3">
            {dashboard.recentBookings.map((booking: any) => (
              <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/buyer/bookings/${booking.id}`)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    {booking.property?.images?.[0]?.url ? (
                      <img src={booking.property.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home size={24} className="text-gray-400" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0f172a] dark:text-white truncate">{booking.property?.name}</p>
                    <p className="text-sm text-gray-500">{booking.room?.name || 'Standard'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sky-600">₹{Number(booking.totalAmount).toLocaleString()}</p>
                    <p className={cn("text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block",
                      booking.bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      booking.bookingStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                      booking.bookingStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    )}>{booking.bookingStatus}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
