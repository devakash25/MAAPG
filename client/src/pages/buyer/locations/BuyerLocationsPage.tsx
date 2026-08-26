import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerApi } from '@/services';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/helpers';
import {
  MapPin,
  Plus,
  Trash2,
  Home,
  Briefcase,
  GraduationCap,
  X,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  home: Home,
  office: Briefcase,
  school: GraduationCap,
  default: MapPin,
};

export default function BuyerLocationsPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', address: '', city: '', area: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['buyer-locations'],
    queryFn: () => buyerApi.getSavedLocations(),
  });

  const locations = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => buyerApi.createSavedLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-locations'] });
      setForm({ label: '', address: '', city: '', area: '' });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => buyerApi.deleteSavedLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-locations'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.address.trim()) return;
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Saved Locations
          </h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Manage your saved addresses for quick access
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4 mr-1.5" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1.5" /> Add Location
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className={cn('p-5 border-0 shadow-sm', isDark ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={cn('text-lg font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
            New Location
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cn('text-sm font-medium mb-1.5 block', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Label *
              </label>
              <Input
                placeholder="e.g. Home, Office"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className={cn(
                  isDark && 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                )}
              />
            </div>
            <div>
              <label className={cn('text-sm font-medium mb-1.5 block', isDark ? 'text-gray-300' : 'text-gray-700')}>
                City
              </label>
              <Input
                placeholder="e.g. Mumbai"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={cn(
                  isDark && 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={cn('text-sm font-medium mb-1.5 block', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Address *
              </label>
              <Input
                placeholder="Full address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={cn(
                  isDark && 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={cn('text-sm font-medium mb-1.5 block', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Area / Locality
              </label>
              <Input
                placeholder="e.g. Andheri West"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className={cn(
                  isDark && 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                )}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button
                type="submit"
                disabled={!form.label.trim() || !form.address.trim() || createMutation.isPending}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                {createMutation.isPending ? 'Saving...' : 'Save Location'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className={cn('border-0 shadow-sm', isDark ? 'bg-gray-800' : 'bg-white')}>
        {isLoading ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-28 rounded-xl animate-pulse',
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                )}
              />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-16">
            <div className={cn('w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4', isDark ? 'bg-gray-700' : 'bg-gray-100')}>
              <MapPin className={cn('h-10 w-10', isDark ? 'text-gray-500' : 'text-gray-400')} />
            </div>
            <p className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
              No saved locations
            </p>
            <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-400')}>
              Add your frequently visited places for quick booking
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-sky-500 hover:bg-sky-600 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add First Location
            </Button>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {locations.map((loc: any) => {
              const Icon = iconMap[loc.label?.toLowerCase()] ?? MapPin;
              return (
                <div
                  key={loc._id}
                  className={cn(
                    'group relative p-4 rounded-xl border transition-colors',
                    isDark
                      ? 'border-gray-700 bg-gray-750 hover:border-sky-500/50'
                      : 'border-gray-200 bg-gray-50 hover:border-sky-400'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg shrink-0', isDark ? 'bg-sky-500/10' : 'bg-sky-50')}>
                      <Icon className="h-5 w-5 text-sky-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                        {loc.label}
                      </p>
                      <p className={cn('text-sm mt-0.5 truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        {loc.address}
                      </p>
                      {(loc.city || loc.area) && (
                        <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-400')}>
                          {[loc.area, loc.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(loc._id)}
                      disabled={deleteMutation.isPending}
                      className={cn(
                        'p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity',
                        isDark
                          ? 'text-red-400 hover:bg-red-500/10'
                          : 'text-red-500 hover:bg-red-50'
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}