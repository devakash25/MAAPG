import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerApi } from '@/services';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/helpers';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Calendar,
  CreditCard,
  AlertTriangle,
  Info,
  Megaphone,
  Inbox,
} from 'lucide-react';

const typeIcon: Record<string, any> = {
  booking: Calendar,
  payment: CreditCard,
  message: MessageSquare,
  alert: AlertTriangle,
  info: Info,
  promotion: Megaphone,
};

const typeColor: Record<string, string> = {
  booking: 'text-sky-500 bg-sky-500/10',
  payment: 'text-emerald-500 bg-emerald-500/10',
  message: 'text-violet-500 bg-violet-500/10',
  alert: 'text-amber-500 bg-amber-500/10',
  info: 'text-blue-500 bg-blue-500/10',
  promotion: 'text-pink-500 bg-pink-500/10',
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function BuyerNotificationsPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['buyer-notifications', unreadOnly],
    queryFn: () => buyerApi.getNotifications({ unreadOnly }),
  });

  const notifications = (data as any)?.data ?? [];
  const unreadCount = (data as any)?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => buyerApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => buyerApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-notifications'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Notifications
          </h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You are all caught up'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={cn(
              isDark && 'border-gray-700 text-gray-300 hover:bg-gray-700',
              unreadOnly && 'bg-sky-500/10 border-sky-500 text-sky-500'
            )}
          >
            <Bell className="h-4 w-4 mr-1.5" />
            {unreadOnly ? 'Show All' : 'Unread Only'}
          </Button>
          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card className={cn('border-0 shadow-sm', isDark ? 'bg-gray-800' : 'bg-white')}>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-20 rounded-xl animate-pulse',
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                )}
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className={cn('h-14 w-14 mx-auto mb-4', isDark ? 'text-gray-600' : 'text-gray-300')} />
            <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
              {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-400')}>
              {unreadOnly
                ? "You're all caught up!"
                : "We'll let you know when something happens."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-transparent">
            {notifications.map((notification: any) => {
              const Icon = typeIcon[notification.type] ?? Bell;
              const colorClass = typeColor[notification.type] ?? 'text-gray-500 bg-gray-500/10';
              const isUnread = !notification.read;

              return (
                <button
                  key={notification._id}
                  onClick={() => {
                    if (isUnread) markReadMutation.mutate(notification._id);
                  }}
                  className={cn(
                    'w-full text-left p-4 sm:px-5 flex items-start gap-4 transition-colors',
                    isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50',
                    isUnread && (isDark ? 'bg-sky-500/5' : 'bg-sky-500/5')
                  )}
                >
                  <div className={cn('p-2.5 rounded-xl shrink-0 mt-0.5', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm font-medium leading-snug',
                          isDark ? 'text-white' : 'text-gray-900',
                          isUnread && 'font-semibold'
                        )}
                      >
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {isUnread && (
                          <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                        )}
                        <span className={cn('text-xs whitespace-nowrap', isDark ? 'text-gray-500' : 'text-gray-400')}>
                          {notification.createdAt ? timeAgo(notification.createdAt) : ''}
                        </span>
                      </div>
                    </div>
                    <p className={cn('text-sm mt-1 line-clamp-2', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {notification.message}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}