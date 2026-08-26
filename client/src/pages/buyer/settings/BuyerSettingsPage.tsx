import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { buyerApi } from '@/services';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore } from '@/store/themeStore';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/helpers';
import {
  Bell,
  Shield,
  Mail,
  MessageSquare,
  Eye,
  EyeOff,
  Save,
  Lock,
} from 'lucide-react';

type Tab = 'notifications' | 'security';

const NOTIFICATION_PREFS_KEY = 'maapg-notification-prefs';

interface NotificationPrefs {
  emailBookingUpdates: boolean;
  emailPaymentAlerts: boolean;
  emailPromotions: boolean;
  smsBookingUpdates: boolean;
  smsPaymentAlerts: boolean;
  smsTwoFactor: boolean;
}

const defaultPrefs: NotificationPrefs = {
  emailBookingUpdates: true,
  emailPaymentAlerts: true,
  emailPromotions: false,
  smsBookingUpdates: false,
  smsPaymentAlerts: true,
  smsTwoFactor: true,
};

export default function BuyerSettingsPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
      return stored ? JSON.parse(stored) : defaultPrefs;
    } catch {
      return defaultPrefs;
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const passwordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      buyerApi.updateProfile(payload),
    onSuccess: () => {
      addToast('Password updated successfully', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: () => {
      addToast('Failed to update password. Please check your current password.', 'error');
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const togglePref = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const notificationOptions = [
    {
      key: 'emailBookingUpdates' as const,
      label: 'Booking Updates',
      desc: 'Receive emails about booking confirmations and changes',
      channel: 'Email',
      icon: Mail,
    },
    {
      key: 'emailPaymentAlerts' as const,
      label: 'Payment Alerts',
      desc: 'Get notified about payment confirmations and failures',
      channel: 'Email',
      icon: Mail,
    },
    {
      key: 'emailPromotions' as const,
      label: 'Promotions & Offers',
      desc: 'Receive exclusive deals and promotional offers',
      channel: 'Email',
      icon: Mail,
    },
    {
      key: 'smsBookingUpdates' as const,
      label: 'Booking Updates',
      desc: 'SMS alerts for booking status changes',
      channel: 'SMS',
      icon: MessageSquare,
    },
    {
      key: 'smsPaymentAlerts' as const,
      label: 'Payment Alerts',
      desc: 'SMS alerts for payment confirmations',
      channel: 'SMS',
      icon: MessageSquare,
    },
    {
      key: 'smsTwoFactor' as const,
      label: 'Two-Factor Auth',
      desc: 'Receive OTP codes via SMS for login verification',
      channel: 'SMS',
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
          Settings
        </h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
          Manage your notification preferences and security settings
        </p>
      </div>

      {/* Tabs */}
      <div className={cn('flex gap-1 p-1 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-100')}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
              activeTab === tab.id
                ? 'bg-white shadow-sm text-sky-500 dark:bg-gray-700 dark:text-sky-400'
                : isDark
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card className={cn('border-0 shadow-sm divide-y divide-transparent', isDark ? 'bg-gray-800' : 'bg-white')}>
          <div className="p-5 pb-3">
            <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
              Notification Preferences
            </h2>
            <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Choose how you want to be notified. Preferences are saved locally.
            </p>
          </div>

          {['Email', 'SMS'].map((channel) => (
            <div key={channel} className="px-5 py-4">
              <p className={cn('text-xs font-semibold uppercase tracking-wider mb-3', isDark ? 'text-gray-500' : 'text-gray-400')}>
                {channel} Notifications
              </p>
              <div className="space-y-3">
                {notificationOptions
                  .filter((opt) => opt.channel === channel)
                  .map((opt) => (
                    <div
                      key={opt.key}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl transition-colors',
                        isDark ? 'bg-gray-750 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <opt.icon className={cn('h-4 w-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
                        <div>
                          <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                            {opt.label}
                          </p>
                          <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePref(opt.key)}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
                          prefs[opt.key] ? 'bg-sky-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5',
                            prefs[opt.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card className={cn('border-0 shadow-sm', isDark ? 'bg-gray-800' : 'bg-white')}>
          <div className="p-5">
            <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
              Change Password
            </h2>
            <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Ensure your account stays secure by using a strong password
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="px-5 pb-5 space-y-4">
            <div>
              <label className={cn('text-sm font-medium mb-1.5 block', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Current Password
              </label>
              <div className="relative">
                <Lock className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className={cn(
                    'pl-10 pr-10',
                    isDark && 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className={cn('absolute right-3 top-1/2 -translate-y-1/2', isDark ? 'text-gray-500' : 'text-gray-400')}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={cn('text-sm font-medium mb-1.5 block', isDark ? 'text-gray-300' : 'text-gray-700')}>
                New Password
              </label>
              <div className="relative">
                <Lock className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                <Input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={cn(
                    'pl-10 pr-10',
                    isDark && 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className={cn('absolute right-3 top-1/2 -translate-y-1/2', isDark ? 'text-gray-500' : 'text-gray-400')}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={cn('text-sm font-medium mb-1.5 block', isDark ? 'text-gray-300' : 'text-gray-700')}>
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={cn(
                    'pl-10 pr-10',
                    isDark && 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className={cn('absolute right-3 top-1/2 -translate-y-1/2', isDark ? 'text-gray-500' : 'text-gray-400')}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword ||
                  passwordMutation.isPending
                }
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Save className="h-4 w-4 mr-1.5" />
                {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}