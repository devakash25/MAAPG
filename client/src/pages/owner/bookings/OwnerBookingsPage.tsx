import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/themeStore';
import { cn, formatDate, formatCurrency } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Search, Eye, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: string; icon: any }> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: Clock },
  CONFIRMED: { label: 'Confirmed', variant: 'success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
  COMPLETED: { label: 'Completed', variant: 'info', icon: CheckCircle },
};

export default function OwnerBookingsPage() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ownerBookings', page, status],
    queryFn: () => ownerApi.getBookings({ page, limit: 20, status: status || undefined }).then(res => res.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, bookingStatus }: { id: string; bookingStatus: string }) =>
      ownerApi.updateBookingStatus(id, { bookingStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerBookings'] });
      addToast('Booking updated', 'success');
    },
    onError: () => addToast('Failed to update booking', 'error'),
  });

  const bookings = data?.data?.filter((b: any) =>
    !search ||
    b.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    b.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    b.property?.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Bookings</h1>
        <p className="text-gray-500 text-sm">Manage your property bookings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20",
                  theme === 'dark' ? 'bg-[#1e293b] border-sky-800/30 text-white' : 'bg-white'
                )}
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className={cn(
                "px-4 py-2 border rounded-lg text-sm w-full sm:w-auto focus:outline-none",
                theme === 'dark' ? 'bg-[#1e293b] border-sky-800/30 text-white' : 'bg-white'
              )}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No bookings found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Guest</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Property</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check-in</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check-out</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking: any) => {
                      const statusInfo = statusConfig[booking.bookingStatus] || statusConfig.PENDING;
                      return (
                        <tr key={booking.id} className="border-b hover:bg-gray-50 dark:hover:bg-sky-900/10 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-sm">{booking.user?.firstName} {booking.user?.lastName}</p>
                              <p className="text-xs text-gray-500">{booking.user?.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{booking.property?.name}</td>
                          <td className="py-3 px-4 text-sm">{formatDate(booking.checkIn)}</td>
                          <td className="py-3 px-4 text-sm">{formatDate(booking.checkOut)}</td>
                          <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(Number(booking.totalAmount))}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/owner/bookings/${booking.id}`)}>
                                <Eye size={16} />
                              </Button>
                              {booking.bookingStatus === 'PENDING' && (
                                <>
                                  <Button variant="ghost" size="sm" className="text-green-600" onClick={() => statusMutation.mutate({ id: booking.id, bookingStatus: 'CONFIRMED' })}>
                                    <CheckCircle size={16} />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => statusMutation.mutate({ id: booking.id, bookingStatus: 'CANCELLED' })}>
                                    <XCircle size={16} />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {bookings.map((booking: any) => {
                  const statusInfo = statusConfig[booking.bookingStatus] || statusConfig.PENDING;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-sky-900/10 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{booking.user?.firstName} {booking.user?.lastName}</p>
                          <p className="text-sm text-gray-500">{booking.property?.name}</p>
                        </div>
                        <Badge variant={statusInfo.variant as any} className="flex items-center gap-1">
                          <StatusIcon size={12} /> {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-gray-500 text-xs">Check-in</p>
                          <p className="font-medium">{formatDate(booking.checkIn)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Check-out</p>
                          <p className="font-medium">{formatDate(booking.checkOut)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="font-semibold">{formatCurrency(Number(booking.totalAmount))}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/owner/bookings/${booking.id}`)}>
                            <Eye size={16} />
                          </Button>
                          {booking.bookingStatus === 'PENDING' && (
                            <>
                              <Button variant="ghost" size="sm" className="text-green-600" onClick={() => statusMutation.mutate({ id: booking.id, bookingStatus: 'CONFIRMED' })}>
                                <CheckCircle size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => statusMutation.mutate({ id: booking.id, bookingStatus: 'CANCELLED' })}>
                                <XCircle size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
