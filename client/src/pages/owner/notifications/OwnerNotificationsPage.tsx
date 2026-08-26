import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { cn, timeAgo } from '@/utils/helpers';
import { Bell, Check, CheckCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const typeColors: Record<string, string> = {
  NEW_BOOKING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  BOOKING_CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  BOOKING_CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  PAYMENT_RECEIVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  NEW_ENQUIRY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  NEW_REVIEW: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  PROPERTY_APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PROPERTY_REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  SYSTEM_ALERT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function OwnerNotificationsPage() {
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['ownerNotifications', unreadOnly, page],
    queryFn: () => ownerApi.getNotifications({ unread: unreadOnly || undefined, page, limit: 20 }).then(res => res.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => ownerApi.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ownerNotifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => ownerApi.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ownerNotifications'] }),
  });

  const notifications = data?.data?.filter((n: any) =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.message?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500 text-sm">Stay updated on your properties</p>
        </div>
        <Button variant="outline" onClick={() => markAllReadMutation.mutate()} className="w-full sm:w-auto">
          <CheckCheck size={16} className="mr-2" /> Mark All Read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => { setUnreadOnly(false); setPage(1); }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none",
                  !unreadOnly ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                )}
              >
                All
              </button>
              <button
                onClick={() => { setUnreadOnly(true); setPage(1); }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none",
                  unreadOnly ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                )}
              >
                Unread
              </button>
            </div>
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20",
                  theme === 'dark' ? 'bg-[#1e293b] border-sky-800/30 text-white' : 'bg-white'
                )}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-colors",
                      notification.isRead ? 'bg-white dark:bg-transparent' : 'bg-sky-50 border-sky-100 dark:bg-sky-900/10 dark:border-sky-800/30'
                    )}
                  >
                    <div className={cn("p-2 rounded-lg flex-shrink-0", typeColors[notification.type] || 'bg-gray-100 dark:bg-gray-800')}>
                      <Bell size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                        {!notification.isRead && <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.createdAt)}</p>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markReadMutation.mutate(notification.id)}
                        className="flex-shrink-0"
                      >
                        <Check size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {data?.pagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-3">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!data.pagination.hasPrev}>
                      <ChevronLeft size={14} className="mr-1" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!data.pagination.hasNext}>
                      Next <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
