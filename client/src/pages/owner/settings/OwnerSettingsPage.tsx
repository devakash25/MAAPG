import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { cn } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Save, Bell, Shield } from 'lucide-react';

export default function OwnerSettingsPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('notifications');

  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('ownerNotificationSettings');
    return saved ? JSON.parse(saved) : {
      emailBookings: true,
      emailEnquiries: true,
      emailReviews: true,
      emailPayments: true,
      smsBookings: false,
      smsEnquiries: false,
    };
  });

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => ownerApi.updateProfile(data),
    onSuccess: () => {
      addToast('Settings saved', 'success');
    },
    onError: () => addToast('Failed to save settings', 'error'),
  });

  const handleNotificationSave = () => {
    localStorage.setItem('ownerNotificationSettings', JSON.stringify(notificationSettings));
    addToast('Notification preferences saved', 'success');
  };

  const handleSecuritySave = () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    updateMutation.mutate({ password: securitySettings.newPassword, currentPassword: securitySettings.currentPassword });
    setSecuritySettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 md:gap-4 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "pb-3 px-3 md:px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2",
              activeTab === tab.id ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-w-xl">
              <div>
                <h4 className="text-sm font-medium mb-3">Email Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'emailBookings', label: 'New bookings' },
                    { key: 'emailEnquiries', label: 'New enquiries' },
                    { key: 'emailReviews', label: 'New reviews' },
                    { key: 'emailPayments', label: 'Payment updates' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                        className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500"
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3">SMS Notifications</h4>
                <div className="space-y-3">
                  {[
                    { key: 'smsBookings', label: 'New bookings' },
                    { key: 'smsEnquiries', label: 'New enquiries' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                        className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500"
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleNotificationSave} disabled={updateMutation.isPending}>
                <Save size={16} className="mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password</label>
                <Input
                  type="password"
                  value={securitySettings.currentPassword}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  value={securitySettings.newPassword}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input
                  type="password"
                  value={securitySettings.confirmPassword}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
              <Button onClick={handleSecuritySave} disabled={updateMutation.isPending || !securitySettings.currentPassword || !securitySettings.newPassword}>
                <Shield size={16} className="mr-2" />
                {updateMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
