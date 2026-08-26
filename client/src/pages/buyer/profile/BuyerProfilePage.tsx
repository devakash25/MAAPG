import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerApi } from '@/services';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore } from '@/store/themeStore';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/helpers';
import {
  User,
  Mail,
  Phone,
  Edit3,
  Save,
  Calendar,
  Star,
  MessageCircle,
  Heart,
  MapPin,
  IndianRupee,
  Home,
  BedDouble,
} from 'lucide-react';

export default function BuyerProfilePage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['buyer-profile'],
    queryFn: () => buyerApi.getProfile(),
  });

  const p = (profile as any) ?? {};

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const updateMutation = useMutation({
    mutationFn: (payload: typeof form) => buyerApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-profile'] });
      addToast('Profile updated successfully', 'success');
      setEditing(false);
    },
    onError: () => {
      addToast('Failed to update profile', 'error');
    },
  });

  const startEditing = () => {
    setForm({
      firstName: p.firstName ?? '',
      lastName: p.lastName ?? '',
      phone: p.phone ?? '',
    });
    setEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const initials = [p.firstName, p.lastName]
    .map((n: string) => n?.[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const stats = [
    { label: 'Bookings', value: p.totalBookings ?? 0, icon: Calendar, color: 'text-sky-500', bg: isDark ? 'bg-sky-500/10' : 'bg-sky-50' },
    { label: 'Reviews', value: p.totalReviews ?? 0, icon: Star, color: 'text-amber-500', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50' },
    { label: 'Enquiries', value: p.totalEnquiries ?? 0, icon: MessageCircle, color: 'text-violet-500', bg: isDark ? 'bg-violet-500/10' : 'bg-violet-50' },
    { label: 'Wishlist', value: p.wishlistCount ?? 0, icon: Heart, color: 'text-rose-500', bg: isDark ? 'bg-rose-500/10' : 'bg-rose-50' },
  ];

  const preferences = [
    {
      label: 'Preferred City',
      value: p.preferredCity ?? 'Not set',
      icon: MapPin,
    },
    {
      label: 'Budget Range',
      value: p.budgetRange ?? 'Not set',
      icon: IndianRupee,
    },
    {
      label: 'Property Types',
      value: p.propertyTypes?.join(', ') ?? 'Not set',
      icon: Home,
    },
    {
      label: 'Room Type',
      value: p.roomType ?? 'Not set',
      icon: BedDouble,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className={cn('border-0 shadow-sm overflow-hidden', isDark ? 'bg-gray-800' : 'bg-white')}>
        <div className="h-28 bg-gradient-to-r from-sky-500 to-sky-600" />
        <div className="px-5 sm:px-8 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div
              className={cn(
                'w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold text-white border-4 shadow-lg shrink-0',
                isDark ? 'border-gray-800 bg-sky-600' : 'border-white bg-sky-500'
              )}
            >
              {initials || <User className="h-10 w-10" />}
            </div>
            <div className="flex-1 pb-1">
              <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                {isLoading ? (
                  <span className={cn('inline-block h-6 w-40 rounded animate-pulse', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
                ) : (
                  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Buyer'
                )}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                <span className={cn('flex items-center gap-1.5 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  <Mail className="h-3.5 w-3.5" />
                  {p.email ?? '—'}
                </span>
                <span className={cn('flex items-center gap-1.5 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  <Phone className="h-3.5 w-3.5" />
                  {p.phone ?? '—'}
                </span>
              </div>
            </div>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={startEditing}
                className={cn(isDark && 'border-gray-700 text-gray-300 hover:bg-gray-700')}
              >
                <Edit3 className="h-4 w-4 mr-1.5" /> Edit Profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={cn('p-4 border-0 shadow-sm text-center', isDark ? 'bg-gray-800' : 'bg-white')}
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2', stat.bg)}>
              <stat.icon className={cn('h-5 w-5', stat.color)} />
            </div>
            <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              {stat.value}
            </p>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Profile */}
        <Card className={cn('border-0 shadow-sm', isDark ? 'bg-gray-800' : 'bg-white')}>
          <div className="p-5">
            <h2 className={cn('text-lg font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
              {editing ? 'Edit Profile' : 'Personal Information'}
            </h2>

            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cn('text-sm font-medium mb-1.5 block', isDark ? 'text-gray-300' : 'text-gray-700')}>
                      First Name
                    </label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className={cn(isDark && 'bg-gray-700 border-gray-600 text-white')}
                    />
                  </div>
                  <div>
                    <label className={cn('text-sm font-medium mb-1.5 block', isDark ? 'text-gray-300' : 'text-gray-700')}>
                      Last Name
                    </label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className={cn(isDark && 'bg-gray-700 border-gray-600 text-white')}
                    />
                  </div>
                </div>
                <div>
                  <label className={cn('text-sm font-medium mb-1.5 block', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Phone
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={cn(isDark && 'bg-gray-700 border-gray-600 text-white')}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className={cn(isDark && 'border-gray-700 text-gray-300 hover:bg-gray-700')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'First Name', value: p.firstName ?? '—' },
                  { label: 'Last Name', value: p.lastName ?? '—' },
                  { label: 'Email', value: p.email ?? '—' },
                  { label: 'Phone', value: p.phone ?? '—' },
                ].map((field) => (
                  <div
                    key={field.label}
                    className={cn('flex justify-between items-center py-2 border-b last:border-0', isDark ? 'border-gray-700' : 'border-gray-100')}
                  >
                    <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {field.label}
                    </span>
                    <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Buyer Preferences */}
        <Card className={cn('border-0 shadow-sm', isDark ? 'bg-gray-800' : 'bg-white')}>
          <div className="p-5">
            <h2 className={cn('text-lg font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
              Buyer Preferences
            </h2>
            <div className="space-y-3">
              {preferences.map((pref) => (
                <div
                  key={pref.label}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl',
                    isDark ? 'bg-gray-750' : 'bg-gray-50'
                  )}
                >
                  <div className={cn('p-2 rounded-lg', isDark ? 'bg-sky-500/10' : 'bg-sky-50')}>
                    <pref.icon className="h-4 w-4 text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {pref.label}
                    </p>
                    <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                      {pref.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}