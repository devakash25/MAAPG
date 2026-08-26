import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { buyerApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/helpers';
import {
  ArrowLeft, Calendar, Home, MapPin, Phone, Mail, Users, DoorOpen,
  Clock, CheckCircle2, XCircle, CreditCard, AlertTriangle, MessageSquare,
  Shield,
} from 'lucide-react';

const statusStyles: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const statusIcons: Record<string, any> = {
  CONFIRMED: CheckCircle2,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  PENDING: Clock,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BuyerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['buyerBooking', id],
    queryFn: () => buyerApi.getBooking(id!).then(res => res.data.data),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => buyerApi.cancelBooking(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerBooking', id] });
      queryClient.invalidateQueries({ queryKey: ['buyerBookings'] });
      setShowCancelModal(false);
      setCancelReason('');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-32" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">Booking not found</h2>
        <Button className="mt-4" onClick={() => navigate('/buyer/bookings')}>
          Back to Bookings
        </Button>
      </div>
    );
  }

  const StatusIcon = statusIcons[booking.bookingStatus] || Clock;
  const canCancel = ['CONFIRMED', 'PENDING'].includes(booking.bookingStatus);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/buyer/bookings')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to Bookings</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">Booking Details</h1>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
              statusStyles[booking.bookingStatus] || 'bg-gray-100 text-gray-700'
            )}>
              <StatusIcon size={12} />
              {booking.bookingStatus}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">
            ID: {booking.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Home size={18} className="text-sky-500" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-36 h-28 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0">
                  {booking.property?.images?.[0]?.url ? (
                    <img
                      src={booking.property.images[0].url}
                      alt={booking.property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home size={28} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-[#0f172a] dark:text-white">
                    {booking.property?.name}
                  </h3>
                  {booking.property?.address && (
                    <div className="flex items-start gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>{booking.property.address}</span>
                    </div>
                  )}
                  {booking.property?.contactPhone && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Phone size={14} className="text-sky-500 flex-shrink-0" />
                      <span>{booking.property.contactPhone}</span>
                    </div>
                  )}
                  {booking.property?.contactEmail && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Mail size={14} className="text-sky-500 flex-shrink-0" />
                      <span>{booking.property.contactEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DoorOpen size={18} className="text-sky-500" />
                Room Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Room Name</p>
                  <p className="font-medium text-[#0f172a] dark:text-white">{booking.room?.name || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Room Type</p>
                  <p className="font-medium text-[#0f172a] dark:text-white">{booking.room?.roomType || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bed Type</p>
                  <p className="font-medium text-[#0f172a] dark:text-white">{booking.room?.bedType || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar size={18} className="text-sky-500" />
                Booking Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Check-In</p>
                  <p className="font-semibold text-[#0f172a] dark:text-white">{formatDate(booking.checkIn)}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sky-600 dark:text-sky-400 text-lg">→</span>
                  </div>
                </div>
                <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Check-Out</p>
                  <p className="font-semibold text-[#0f172a] dark:text-white">{formatDate(booking.checkOut)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={18} className="text-sky-500" />
                Stay Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guests</p>
                  <p className="font-medium text-[#0f172a] dark:text-white">{booking.guestCount || '—'}</p>
                </div>
                {booking.specialRequests && (
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Special Requests</p>
                    <p className="font-medium text-[#0f172a] dark:text-white text-sm">{booking.specialRequests}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard size={18} className="text-sky-500" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Amount</p>
                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                  ₹{Number(booking.totalAmount).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Status</p>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                  booking.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : booking.paymentStatus === 'REFUNDED'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                )}>
                  {booking.paymentStatus || '—'}
                </span>
              </div>
              {booking.paymentMethod && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Method</p>
                  <p className="font-medium text-[#0f172a] dark:text-white text-sm">{booking.paymentMethod}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield size={18} className="text-sky-500" />
                Cancellation Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">Free cancellation up to 48 hours before check-in</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">50% refund for cancellations within 48 hours</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">No refund for no-shows or last-minute cancellations</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              {canCancel && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowCancelModal(true)}
                >
                  <XCircle size={16} />
                  Cancel Booking
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/buyer/messages')}
              >
                <MessageSquare size={16} />
                Contact Property
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelReason(''); }}
        title="Cancel Booking"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowCancelModal(false); setCancelReason(''); }}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate(cancelReason)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0f172a] dark:text-white mb-1.5">
              Reason for cancellation (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancelling..."
              className="w-full h-24 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#0f172a] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
