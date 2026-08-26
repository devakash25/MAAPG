import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { buyerApi } from '@/services';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/helpers';
import {
  Heart, MapPin, Star, Hotel, Bed, Building, Home, Trash2, Search, ArrowRight
} from 'lucide-react';

const propertyTypeIcons: Record<string, any> = {
  HOTEL: Hotel, HOSTEL: Building, PG: Bed, RENTAL_ROOM: Home, APARTMENT: Building, GUEST_HOUSE: Home,
};

const tabs = [
  { key: 'ALL', label: 'All' },
  { key: 'HOTEL', label: 'Hotels' },
  { key: 'PG', label: 'PG' },
  { key: 'HOSTEL', label: 'Hostels' },
  { key: 'RENTAL_ROOM', label: 'Rooms' },
];

function WishlistCard({ property, onRemove }: { property: any; onRemove: () => void }) {
  const navigate = useNavigate();
  const price = property.rooms?.[0]?.pricePerMonth || property.rooms?.[0]?.pricePerNight;
  const img = property.images?.[0]?.url;
  const Icon = propertyTypeIcons[property.propertyType] || Home;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div
        onClick={() => navigate(`/buyer/property/${property.id}`)}
        className="cursor-pointer"
      >
        <div className="relative h-44 bg-gray-200 dark:bg-gray-800 overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon size={40} className="text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
            {property.propertyType?.replace('_', ' ')}
          </div>
          {property.averageRating && (
            <div className="absolute top-2 right-12 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Star size={12} className="text-amber-500 fill-amber-500" />
              {Number(property.averageRating).toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              onClick={() => navigate(`/buyer/property/${property.id}`)}
              className="font-semibold text-[#0f172a] dark:text-white truncate cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              {property.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
              <MapPin size={14} />
              <span className="truncate">{property.city}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="flex-shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={16} />
          </Button>
        </div>

        {property.amenities?.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {property.amenities.slice(0, 3).map((a: any) => (
              <span
                key={a.name}
                className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400"
              >
                {a.name}
              </span>
            ))}
          </div>
        )}

        {price && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
              ₹{Number(price).toLocaleString()}
              <span className="text-xs font-normal text-gray-500">/month</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/buyer/property/${property.id}`)}
              className="text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20"
            >
              View <ArrowRight size={14} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BuyerWishlistPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['wishlist', { page, propertyType: activeTab === 'ALL' ? undefined : activeTab }],
    queryFn: () =>
      buyerApi
        .getWishlist({
          page,
          limit: 12,
          propertyType: activeTab === 'ALL' ? undefined : activeTab,
        })
        .then((res) => res.data.data),
  });

  const removeMutation = useMutation({
    mutationFn: (propertyId: string) => buyerApi.toggleWishlist(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const properties = wishlistData?.items || wishlistData?.wishlist || [];
  const totalPages = wishlistData?.totalPages || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">My Wishlist</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {properties.length > 0
            ? `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} saved`
            : 'No saved properties yet'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.key
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-sky-300 dark:hover:border-sky-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-800 rounded-xl h-80" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Heart size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-[#0f172a] dark:text-white mb-1">
            No saved properties
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
            {activeTab === 'ALL'
              ? "You haven't saved any properties yet. Start exploring to find your perfect stay!"
              : `No ${activeTab.toLowerCase().replace('_', ' ')} properties in your wishlist.`}
          </p>
          <Button
            onClick={() => window.location.href = '/buyer/explore'}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Search size={16} className="mr-2" />
            Explore Properties
          </Button>
        </div>
      ) : (
        <>
          {/* Property Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property: any) => (
              <WishlistCard
                key={property.id}
                property={property}
                onRemove={() => removeMutation.mutate(property.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
