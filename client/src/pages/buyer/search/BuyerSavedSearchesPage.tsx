import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerApi } from '@/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/helpers';
import {
  Search,
  Bell,
  BellOff,
  Trash2,
  MapPin,
  Home,
  DollarSign,
  Sparkles,
  Plus,
  Bookmark,
} from 'lucide-react';

const BUSINESS_TYPES: Record<string, string> = {
  HOTEL: 'Hotel',
  HOSTEL: 'Hostel',
  PG: 'PG',
  RENTAL_ROOM: 'Rental Room',
  APARTMENT: 'Apartment',
  GUEST_HOUSE: 'Guest House',
};

export default function BuyerSavedSearchesPage() {
  const queryClient = useQueryClient();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');

  const { data: searches, isLoading } = useQuery({
    queryKey: ['buyerSavedSearches'],
    queryFn: () => buyerApi.getSavedSearches().then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => buyerApi.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerSavedSearches'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; queryDetails: Record<string, unknown> }) =>
      buyerApi.createSavedSearch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerSavedSearches'] });
      setIsCreateOpen(false);
      setNewSearchName('');
    },
  });

  const handleCreateSearch = () => {
    if (!newSearchName.trim()) return;
    createMutation.mutate({
      name: newSearchName.trim(),
      queryDetails: {},
    });
  };

  const formatPriceRange = (min?: number, max?: number) => {
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `₹${min.toLocaleString()}+`;
    if (max) return `Up to ₹${max.toLocaleString()}`;
    return null;
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              Saved Searches
            </h1>
            <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Manage your saved search preferences and alerts
            </p>
          </div>

          <Button onClick={() => setIsCreateOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Save Current Search
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-32 rounded-xl animate-pulse',
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                )}
              />
            ))}
          </div>
        ) : !searches?.length ? (
          <Card
            className={cn(
              'border-dashed',
              isDark
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            )}
          >
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bookmark
                className={cn(
                  'w-16 h-16 mb-4',
                  isDark ? 'text-gray-600' : 'text-gray-300'
                )}
              />
              <p className={cn('text-lg font-medium', isDark ? 'text-gray-300' : 'text-gray-600')}>
                No saved searches yet. Search and save your preferences.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {searches.map((search: any) => (
              <Card
                key={search.id}
                className={cn(
                  'transition-all hover:shadow-md',
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10">
                        <Search className="w-5 h-5 text-sky-500" />
                      </div>
                      <div>
                        <CardTitle
                          className={cn(
                            'text-lg',
                            isDark ? 'text-white' : 'text-gray-900'
                          )}
                        >
                          {search.name}
                        </CardTitle>
                        <p
                          className={cn(
                            'text-xs mt-0.5',
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          )}
                        >
                          Saved {new Date(search.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8',
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        )}
                        title={search.alertEnabled ? 'Disable alerts' : 'Enable alerts'}
                      >
                        {search.alertEnabled ? (
                          <Bell className="w-4 h-4 text-sky-500" />
                        ) : (
                          <BellOff
                            className={cn(
                              'w-4 h-4',
                              isDark ? 'text-gray-500' : 'text-gray-400'
                            )}
                          />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => deleteMutation.mutate(search.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {search.queryDetails?.city && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'gap-1',
                          isDark
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <MapPin className="w-3 h-3" />
                        {search.queryDetails.city}
                      </Badge>
                    )}
                    {search.queryDetails?.type && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'gap-1',
                          isDark
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <Home className="w-3 h-3" />
                        {BUSINESS_TYPES[search.queryDetails.type] || search.queryDetails.type}
                      </Badge>
                    )}
                    {search.queryDetails?.minPrice || search.queryDetails?.maxPrice ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'gap-1',
                          isDark
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <DollarSign className="w-3 h-3" />
                        {formatPriceRange(
                          search.queryDetails.minPrice,
                          search.queryDetails.maxPrice
                        )}
                      </Badge>
                    ) : null}
                    {search.queryDetails?.amenities?.length > 0 && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'gap-1',
                          isDark
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <Sparkles className="w-3 h-3" />
                        {search.queryDetails.amenities.length} amenities
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Search Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Save Search"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSearch} disabled={!newSearchName.trim() || createMutation.isPending} className="bg-sky-500 hover:bg-sky-600 text-white">
              {createMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Name</label>
            <Input placeholder="e.g., Hotels in Mumbai" value={newSearchName} onChange={(e) => setNewSearchName(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
