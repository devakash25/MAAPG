import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerApi } from '@/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/helpers';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'PG', label: 'PG' },
  { value: 'RENTAL_ROOM', label: 'Rental Room' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'GUEST_HOUSE', label: 'Guest House' },
] as const;

const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    label: 'Pending Review',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  APPROVED: {
    icon: CheckCircle,
    label: 'Approved',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  REJECTED: {
    icon: XCircle,
    label: 'Rejected',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
} as const;

export default function BuyerBecomeOwnerPage() {
  const queryClient = useQueryClient();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [form, setForm] = useState({
    businessName: '',
    businessTypes: [] as string[],
    city: '',
    state: '',
    businessPhone: '',
    businessEmail: '',
    businessAddress: '',
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['buyerProfile'],
    queryFn: () => buyerApi.getProfile().then(res => res.data),
  });

  const submitMutation = useMutation({
    mutationFn: (data: typeof form) => buyerApi.becomeOwner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerProfile'] });
    },
  });

  const toggleBusinessType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      businessTypes: prev.businessTypes.includes(type)
        ? prev.businessTypes.filter((t) => t !== type)
        : [...prev.businessTypes, type],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(form);
  };

  const dealer = profile?.dealer;

  if (profileLoading) {
    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'h-24 rounded-xl animate-pulse',
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  if (dealer) {
    const statusInfo = STATUS_CONFIG[dealer.status as keyof typeof STATUS_CONFIG];
    const StatusIcon = statusInfo?.icon || Clock;

    return (
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className={cn('text-2xl font-bold mb-6', isDark ? 'text-white' : 'text-gray-900')}>
            Become an Owner
          </h1>

          <Card
            className={cn(
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <CardHeader>
              <CardTitle className={cn(isDark ? 'text-white' : 'text-gray-900')}>
                Your Application Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <StatusIcon className="w-6 h-6" />
                <Badge variant="outline" className={cn('text-sm', statusInfo?.color)}>
                  {statusInfo?.label || dealer.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Business Name
                  </p>
                  <p className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                    {dealer.businessName}
                  </p>
                </div>
                <div>
                  <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Business Types
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dealer.businessTypes?.map((type: any) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className={cn(
                          isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>City</p>
                  <p className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                    {dealer.city}
                  </p>
                </div>
                <div>
                  <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>State</p>
                  <p className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                    {dealer.state}
                  </p>
                </div>
              </div>

              {dealer.status === 'REJECTED' && dealer.rejectionReason && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className={cn('text-sm font-medium text-red-500')}>Rejection Reason</p>
                  <p className={cn('text-sm mt-1', isDark ? 'text-gray-300' : 'text-gray-600')}>
                    {dealer.rejectionReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className={cn('text-2xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
          Become an Owner
        </h1>
        <p className={cn('text-sm mb-6', isDark ? 'text-gray-400' : 'text-gray-600')}>
          List your property on MAAPG and start receiving bookings
        </p>

        {submitMutation.isSuccess ? (
          <Card
            className={cn(
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
              <h2 className={cn('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                Application Submitted!
              </h2>
              <p className={cn('text-center max-w-md', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Your application has been submitted successfully. We will review it and get back to you
                within 2-3 business days.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card
            className={cn(
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <CardHeader>
              <CardTitle className={cn(isDark ? 'text-white' : 'text-gray-900')}>
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className={cn(isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Business Name *
                  </label>
                  <div className="relative">
                    <Building2
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    />
                    <Input
                      placeholder="Enter your business name"
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      required
                      className={cn(
                        'pl-10',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-200'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={cn(isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Business Types *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BUSINESS_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => toggleBusinessType(type.value)}
                        className={cn(
                          'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                          form.businessTypes.includes(type.value)
                            ? 'bg-sky-500 border-sky-500 text-white'
                            : isDark
                            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={cn(isDark ? 'text-gray-300' : 'text-gray-700')}>City *</label>
                    <div className="relative">
                      <MapPin
                        className={cn(
                          'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        )}
                      />
                      <Input
                        placeholder="City"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        required
                        className={cn(
                          'pl-10',
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-gray-50 border-gray-200'
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={cn(isDark ? 'text-gray-300' : 'text-gray-700')}>State *</label>
                    <Input
                      placeholder="State"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      required
                      className={cn(
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-200'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={cn(isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Business Phone *
                  </label>
                  <div className="relative">
                    <Phone
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    />
                    <Input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={form.businessPhone}
                      onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
                      required
                      className={cn(
                        'pl-10',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-200'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={cn(isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Business Email *
                  </label>
                  <div className="relative">
                    <Mail
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    />
                    <Input
                      type="email"
                      placeholder="business@example.com"
                      value={form.businessEmail}
                      onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
                      required
                      className={cn(
                        'pl-10',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-200'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={cn(isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Business Address *
                  </label>
                  <Input
                    placeholder="Full business address"
                    value={form.businessAddress}
                    onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
                    required
                    className={cn(
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200'
                    )}
                  />
                </div>

                {submitMutation.isError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-500">
                      {submitMutation.error?.message || 'Something went wrong. Please try again.'}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitMutation.isPending || form.businessTypes.length === 0}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
