import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, User, Home, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: string; icon: any }> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: Clock },
  CONFIRMED: { label: 'Confirmed', variant: 'success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
  COMPLETED: { label: 'Completed', variant: 'info', icon: CheckCircle },
};

export default function OwnerBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['ownerBooking', id],
    queryFn: () => ownerApi.getBooking(id!).then(res => res.data.data),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => ownerApi.updateBookingStatus(id!, { bookingStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerBooking', id] });
      queryClient.invalidateQueries({ queryKey: ['ownerBookings'] });
      addToast('Booking updated', 'success');
    },
    onError: () => addToast('Failed to update booking', 'error'),
  });

  if (isLoading) {
    return <div className="space-y-4"><div className="h-64 bg-gray-100 rounded-xl animate-pulse" /></div>;
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Booking not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/owner/bookings')}>Back to Bookings</Button>
      </div>
    );
  }

  const statusInfo = statusConfig[booking.bookingStatus] || statusConfig.PENDING;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/owner/bookings')}><ArrowLeft size={18} /></Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Booking Details</h1>
          <p className="text-gray-500 text-sm">Booking #{booking.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Booking Information</CardTitle>
              <Badge variant={statusInfo.variant as any} className="flex items-center gap-1">
                <StatusIcon size={14} /> {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Home size={18} className="text-sky-600" />
                <div>
                  <p className="text-xs text-gray-500">Property</p>
                  <p className="font-medium text-sm">{booking.property?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Home size={18} className="text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">Room</p>
                  <p className="font-medium text-sm">{booking.room?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={18} className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Check-in</p>
                  <p className="font-medium text-sm">{formatDate(booking.checkIn)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={18} className="text-red-600" />
                <div>
                  <p className="text-xs text-gray-500">Check-out</p>
                  <p className="font-medium text-sm">{formatDate(booking.checkOut)}</p>
                </div>
              </div>
            </div>
            {booking.cancellationReason && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs font-medium text-red-700 mb-1">Cancellation Reason:</p>
                <p className="text-sm text-red-800">{booking.cancellationReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Guest Info */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Guest</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                  <User size={18} className="text-sky-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{booking.user?.firstName} {booking.user?.lastName}</p>
                  <p className="text-xs text-gray-500">{booking.user?.email}</p>
                </div>
              </div>
              {booking.user?.phone && <p className="text-sm text-gray-600">Phone: {booking.user.phone}</p>}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Payment</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Total Amount</span><span className="font-bold">{formatCurrency(Number(booking.totalAmount))}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Platform Commission</span><span className="text-red-600">{formatCurrency(Number(booking.platformCommission))}</span></div>
              <div className="flex justify-between text-sm border-t pt-2"><span className="font-medium">Your Earnings</span><span className="font-bold text-green-600">{formatCurrency(Number(booking.dealerAmount))}</span></div>
              {booking.payment && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">Payment: {booking.payment.paymentMethod} ({booking.payment.paymentStatus})</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {booking.bookingStatus === 'PENDING' && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => statusMutation.mutate({ status: 'CONFIRMED' })} disabled={statusMutation.isPending}>
                  <CheckCircle size={16} className="mr-2" /> Confirm Booking
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => statusMutation.mutate({ status: 'CANCELLED' })} disabled={statusMutation.isPending}>
                  <XCircle size={16} className="mr-2" /> Reject Booking
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
