import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { getInitials } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Save, User, Mail, Phone, Building, MapPin } from 'lucide-react';

export default function OwnerProfilePage() {

  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['ownerProfile'],
    queryFn: () => ownerApi.getProfile().then(res => res.data.data),
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || user?.firstName || '',
        lastName: profile.lastName || user?.lastName || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        businessName: profile.dealer?.businessName || '',
        city: profile.dealer?.city || '',
        state: profile.dealer?.state || '',
      });
    }
  }, [profile, user]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => ownerApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerProfile'] });
      addToast('Profile updated', 'success');
    },
    onError: () => addToast('Failed to update profile', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Profile</h1>
        <p className="text-gray-500 text-sm">Manage your account information</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0f2557] to-[#0ea5e9] text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {getInitials(formData.firstName || 'O', formData.lastName || '')}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold">{formData.firstName} {formData.lastName}</h2>
              <p className="text-gray-500">{formData.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                {profile?.dealer?.businessTypes?.map((type: string) => (
                  <span key={type} className="px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded text-xs font-medium">
                    {type.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={14} /> First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={14} /> Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail size={14} /> Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone size={14} /> Phone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building size={14} /> Business Name
              </label>
              <Input
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Business name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin size={14} /> City
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin size={14} /> State
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save size={16} className="mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
