import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FAILED: 'bg-gray-100 text-gray-800',
};

export default function BookingsListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', search, status, page],
    queryFn: () => bookingApi.getAll({ search, status, page, limit: 20 }).then(res => res.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bookingApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      addToast('Booking status updated', 'success');
    },
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Bookings</h1>
        <p className="text-gray-500 text-sm">Manage all bookings on the platform</p>
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
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2 border rounded-lg text-sm w-full sm:w-auto">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Booking ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Property</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check-in</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Check-out</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((booking: any) => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4"><span className="font-mono text-sm">{booking.id.slice(0, 8)}...</span></td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{booking.user?.firstName} {booking.user?.lastName}</p>
                          <p className="text-xs text-gray-500">{booking.user?.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{booking.property?.name}</p>
                          <p className="text-xs text-gray-500">{booking.property?.propertyType}</p>
                        </td>
                        <td className="py-3 px-4 text-sm">{formatDate(booking.checkIn)}</td>
                        <td className="py-3 px-4 text-sm">{formatDate(booking.checkOut)}</td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(Number(booking.totalAmount))}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.bookingStatus] || 'bg-gray-100'}`}>
                            {booking.bookingStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                              <Eye size={16} />
                            </Button>
                            {booking.bookingStatus === 'PENDING' && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => statusMutation.mutate({ id: booking.id, status: 'CONFIRMED' })} className="text-green-600">
                                  <CheckCircle size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => statusMutation.mutate({ id: booking.id, status: 'CANCELLED' })} className="text-red-600">
                                  <XCircle size={16} />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data?.data?.map((booking: any) => (
                  <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500">{booking.id.slice(0, 8)}...</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.bookingStatus] || 'bg-gray-100'}`}>
                            {booking.bookingStatus}
                          </span>
                        </div>
                        <p className="font-medium">{booking.user?.firstName} {booking.user?.lastName}</p>
                        <p className="text-sm text-gray-500">{booking.property?.name}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                          <Eye size={16} />
                        </Button>
                        {booking.bookingStatus === 'PENDING' && (
                          <Button variant="ghost" size="sm" onClick={() => statusMutation.mutate({ id: booking.id, status: 'CONFIRMED' })} className="text-green-600">
                            <CheckCircle size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      <span>In: {formatDate(booking.checkIn)}</span>
                      <span>Out: {formatDate(booking.checkOut)}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(Number(booking.totalAmount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {data?.pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-3">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!data.pagination.hasPrev}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!data.pagination.hasNext}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
