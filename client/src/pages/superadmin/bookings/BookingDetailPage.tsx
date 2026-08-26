import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, getInitials } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, CheckCircle, XCircle, User, Home, CreditCard } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FAILED: 'bg-gray-100 text-gray-800',
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.getById(id!).then(res => res.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => bookingApi.updateStatus(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      addToast('Booking status updated', 'success');
    },
  });

  if (isLoading) {
    return <div className="space-y-4 md:space-y-6 animate-fade-in">{[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white rounded-lg animate-pulse" />)}</div>;
  }

  if (!booking) {
    return <div className="text-center py-12">Booking not found</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="self-start">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">Booking Details</h1>
          <p className="text-gray-500 text-sm">Booking {booking.id.slice(0, 8)}...</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Badge className={statusColors[booking.bookingStatus]}>
            {booking.bookingStatus}
          </Badge>
          {booking.bookingStatus === 'PENDING' && (
            <>
              <Button onClick={() => statusMutation.mutate('CONFIRMED')} className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={16} className="mr-2" /> Confirm
              </Button>
              <Button variant="destructive" onClick={() => statusMutation.mutate('CANCELLED')}>
                <XCircle size={16} className="mr-2" /> Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Booking Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Check-in</p>
                <p className="font-medium">{formatDate(booking.checkIn)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Check-out</p>
                <p className="font-medium">{formatDate(booking.checkOut)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Guests</p>
                <p className="font-medium">{booking.guests || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Room</p>
                <p className="font-medium">{booking.room?.name || 'N/A'} ({booking.room?.roomType || 'N/A'})</p>
              </div>
              {booking.bed && (
                <div>
                  <p className="text-sm text-gray-500">Bed</p>
                  <p className="font-medium">{booking.bed.name}</p>
                </div>
              )}
              {booking.cancellationReason && (
                <div>
                  <p className="text-sm text-gray-500">Cancellation Reason</p>
                  <p className="font-medium text-red-600">{booking.cancellationReason}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={18} /> Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl md:text-3xl font-bold text-primary">{formatCurrency(Number(booking.totalAmount))}</p>
              <p className="text-sm text-gray-500">Total Amount</p>
            </div>
            {booking.payment && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge className={booking.payment.paymentStatus === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {booking.payment.paymentStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Method</span>
                  <span className="text-sm font-medium">{booking.payment.paymentMethod || 'N/A'}</span>
                </div>
                {booking.payment.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Razorpay ID</span>
                    <span className="text-sm font-mono truncate ml-2">{booking.payment.razorpayPaymentId.slice(0, 12)}...</span>
                  </div>
                )}
              </div>
            )}
            {booking.platformCommission > 0 && (
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform Commission</span>
                  <span className="text-green-600">{formatCurrency(Number(booking.platformCommission))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Dealer Amount</span>
                  <span>{formatCurrency(Number(booking.dealerAmount))}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer & Property Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={18} /> Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                {getInitials(booking.user?.firstName || 'U', booking.user?.lastName || '')}
              </div>
              <div className="min-w-0">
                <p className="font-medium">{booking.user?.firstName} {booking.user?.lastName}</p>
                <p className="text-sm text-gray-500 truncate">{booking.user?.email}</p>
                {booking.user?.phone && <p className="text-sm text-gray-500">{booking.user.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home size={18} /> Property
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="font-medium">{booking.property?.name}</p>
              <p className="text-sm text-gray-500">{booking.property?.propertyType} - {booking.property?.city}</p>
              {booking.property?.dealer && (
                <p className="text-sm text-gray-500 mt-1">
                  Dealer: {booking.property.dealer.businessName}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
