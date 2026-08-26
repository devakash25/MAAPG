import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Settings, Percent } from 'lucide-react';

const propertyTypes = ['HOTEL', 'HOSTEL', 'PG', 'RENTAL_ROOM', 'APARTMENT', 'GUEST_HOUSE'];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll().then(res => res.data.data),
  });

  const { data: commission } = useQuery({
    queryKey: ['commission'],
    queryFn: () => settingsApi.getCommission().then(res => res.data.data),
  });

  const [generalSettings, setGeneralSettings] = useState({
    platform_name: 'MAAPG',
    platform_email: '',
    platform_phone: '',
  });

  const [commissionRates, setCommissionRates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (settings) {
      setGeneralSettings({
        platform_name: settings.platform_name || 'MAAPG',
        platform_email: settings.platform_email || '',
        platform_phone: settings.platform_phone || '',
      });
    }
  }, [settings]);

  useEffect(() => {
    if (commission) {
      setCommissionRates(commission);
    }
  }, [commission]);

  const updateGeneralMutation = useMutation({
    mutationFn: (data: Record<string, string>) => settingsApi.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const updateCommissionMutation = useMutation({
    mutationFn: (data: Record<string, number>) => settingsApi.updateCommission(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['commission'] }),
  });

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateGeneralMutation.mutate(generalSettings);
  };

  const handleCommissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommissionMutation.mutate(commissionRates);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm">Configure platform settings and commission rates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 md:gap-4 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-3 md:px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings size={16} className="inline mr-2" /> General
        </button>
        <button
          onClick={() => setActiveTab('commission')}
          className={`pb-3 px-3 md:px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'commission' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Percent size={16} className="inline mr-2" /> Commission Rates
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGeneralSubmit} className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform Name</label>
                <Input
                  value={generalSettings.platform_name}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, platform_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Support Email</label>
                <Input
                  type="email"
                  value={generalSettings.platform_email}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, platform_email: e.target.value })}
                  placeholder="support@maapg.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Support Phone</label>
                <Input
                  value={generalSettings.platform_phone}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, platform_phone: e.target.value })}
                  placeholder="1800-123-4567"
                />
              </div>
              <Button type="submit" disabled={updateGeneralMutation.isPending}>
                <Save size={16} className="mr-2" />
                {updateGeneralMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Commission Settings */}
      {activeTab === 'commission' && (
        <Card>
          <CardHeader>
            <CardTitle>Commission Rates by Property Type</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCommissionSubmit} className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Set the platform commission percentage for each property type. This will be deducted from each booking.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {propertyTypes.map((type) => (
                  <div key={type} className="border rounded-lg p-3 md:p-4">
                    <label className="text-sm font-medium block mb-2">{type.replace('_', ' ')}</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={commissionRates[type] || ''}
                        onChange={(e) => setCommissionRates({ ...commissionRates, [type]: Number(e.target.value) })}
                        placeholder="10"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="submit" disabled={updateCommissionMutation.isPending}>
                <Save size={16} className="mr-2" />
                {updateCommissionMutation.isPending ? 'Saving...' : 'Save Commission Rates'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
