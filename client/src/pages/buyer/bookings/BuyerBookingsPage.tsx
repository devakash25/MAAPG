import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { buyerApi } from '@/services';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/helpers';
import {
  Calendar, Home, ChevronLeft, ChevronRight, Clock, CheckCircle2,
  XCircle, Filter, MapPin, ArrowRight,
} from 'lucide-react';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
] as const;

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

function BookingCard({ booking }: { booking: any }) {
  const navigate = useNavigate();
  const StatusIcon = statusIcons[booking.bookingStatus] || Clock;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:border-sky-300 dark:hover:border-sky-700 group"
      onClick={() => navigate(`/buyer/bookings/${booking.id}`)}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-44 h-44 sm:h-auto bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
            {booking.property?.images?.[0]?.url ? (
              <img
                src={booking.property.images[0].url}
                alt={booking.property.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Home size={32} className="text-gray-400" />
              </div>
            )}
            <div className="absolute top-2 left-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                statusStyles[booking.bookingStatus] || 'bg-gray-100 text-gray-700'
              )}>
                <StatusIcon size={12} />
                {booking.bookingStatus}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-[#0f172a] dark:text-white text-base truncate">
                {booking.property?.name || 'Property'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {booking.room?.name || 'Standard Room'}
              </p>

              <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <MapPin size={14} className="text-sky-500 flex-shrink-0" />
                <span className="truncate">{booking.property?.city || '—'}</span>
              </div>

              <div className="flex items-center gap-2 mt-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Calendar size={14} className="text-sky-500" />
                  <span>{formatDate(booking.checkIn)}</span>
                </div>
                <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                <span>{formatDate(booking.checkOut)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                ₹{Number(booking.totalAmount).toLocaleString()}
              </span>
              <Button variant="ghost" size="sm" className="text-sky-600 dark:text-sky-400 group-hover:bg-sky-50 dark:group-hover:bg-sky-950">
                View Details <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BuyerBookingsPage() {
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  const { data, isLoading } = useQuery({
    queryKey: ['buyerBookings', page, activeTab],
    queryFn: () => buyerApi.getBookings({ page, status: activeTab || undefined, limit }).then(res => res.data.data),
  });

  const bookings: any[] = data?.bookings || [];
  const totalPages: number = data?.totalPages || 1;
  const total: number = data?.total || 0;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-96" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-24" />
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">My Bookings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {total} booking{total !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Filter size={16} className="text-gray-400 flex-shrink-0" />
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setPage(1); }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              activeTab === key
                ? "bg-sky-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-[#0f172a] dark:text-white">No bookings found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {activeTab ? `No ${activeTab.toLowerCase()} bookings yet` : "You haven't made any bookings yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((booking: any) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft size={16} />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | string)[]>((acc, p, i, arr) => {
              if (i > 0 && (arr[i - 1] as number) !== p - 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              typeof p === 'string' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className={p === page ? 'bg-sky-500 hover:bg-sky-600' : ''}
                >
                  {p}
                </Button>
              )
            )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
