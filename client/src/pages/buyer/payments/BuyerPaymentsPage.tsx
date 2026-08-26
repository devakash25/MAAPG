import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buyerApi } from '@/services';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/helpers';
import {
  CreditCard,
  TrendingUp,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function BuyerPaymentsPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['buyer-payments', page],
    queryFn: () => buyerApi.getPayments({ page }),
  });

  const payments = (data as any)?.data ?? [];
  const totalPages = (data as any)?.totalPages ?? 1;

  const totalSpent = payments
    .filter((p: any) => p.status === 'SUCCESS')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const pendingAmount = payments
    .filter((p: any) => p.status === 'PENDING')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const refundedAmount = payments
    .filter((p: any) => p.status === 'REFUNDED')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const summaryCards = [
    {
      label: 'Total Spent',
      value: `$${totalSpent.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
    },
    {
      label: 'Pending',
      value: `$${pendingAmount.toLocaleString()}`,
      icon: Clock,
      color: 'text-amber-500',
      bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
    },
    {
      label: 'Refunded',
      value: `$${refundedAmount.toLocaleString()}`,
      icon: RotateCcw,
      color: 'text-sky-500',
      bg: isDark ? 'bg-sky-500/10' : 'bg-sky-50',
    },
  ];

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SUCCESS: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      PENDING: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      FAILED: 'bg-red-500/15 text-red-600 dark:text-red-400',
      REFUNDED: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    };
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          styles[status] ?? styles.PENDING
        )}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
          Payments
        </h1>
        <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
          View your payment history and transaction details
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card
            key={card.label}
            className={cn(
              'p-5 border-0 shadow-sm',
              isDark ? 'bg-gray-800' : 'bg-white'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-xl', card.bg)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
              <div>
                <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  {card.label}
                </p>
                <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  {card.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className={cn('border-0 shadow-sm', isDark ? 'bg-gray-800' : 'bg-white')}>
        <div className="p-5">
          <h2 className={cn('text-lg font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
            Payment History
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-16 rounded-lg animate-pulse',
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  )}
                />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className={cn('h-12 w-12 mx-auto mb-3', isDark ? 'text-gray-600' : 'text-gray-300')} />
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                No payments found
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
                      <th className={cn('text-left py-3 px-4 text-xs font-medium uppercase tracking-wider', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        Booking Ref
                      </th>
                      <th className={cn('text-left py-3 px-4 text-xs font-medium uppercase tracking-wider', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        Property
                      </th>
                      <th className={cn('text-left py-3 px-4 text-xs font-medium uppercase tracking-wider', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        Amount
                      </th>
                      <th className={cn('text-left py-3 px-4 text-xs font-medium uppercase tracking-wider', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        Method
                      </th>
                      <th className={cn('text-left py-3 px-4 text-xs font-medium uppercase tracking-wider', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        Status
                      </th>
                      <th className={cn('text-left py-3 px-4 text-xs font-medium uppercase tracking-wider', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent">
                    {payments.map((payment: any) => (
                      <tr
                        key={payment._id}
                        className={cn(
                          'transition-colors',
                          isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                        )}
                      >
                        <td className="py-3 px-4">
                          <span className={cn('text-sm font-mono', isDark ? 'text-gray-300' : 'text-gray-700')}>
                            {payment.bookingReference ?? payment._id?.slice(0, 8) ?? '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                            {payment.propertyName ?? '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                            ${payment.amount?.toLocaleString() ?? '0'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                            {payment.paymentMethod ?? '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{statusBadge(payment.status)}</td>
                        <td className="py-3 px-4">
                          <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                            {payment.createdAt
                              ? new Date(payment.createdAt).toLocaleDateString()
                              : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {payments.map((payment: any) => (
                  <div
                    key={payment._id}
                    className={cn(
                      'p-4 rounded-xl border',
                      isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn('text-sm font-mono', isDark ? 'text-gray-300' : 'text-gray-700')}>
                        {payment.bookingReference ?? payment._id?.slice(0, 8)}
                      </span>
                      {statusBadge(payment.status)}
                    </div>
                    <p className={cn('text-sm mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>
                      {payment.propertyName ?? 'Property'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-base font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                        ${payment.amount?.toLocaleString() ?? '0'}
                      </span>
                      <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        {payment.paymentMethod ?? '—'} &middot;{' '}
                        {payment.createdAt
                          ? new Date(payment.createdAt).toLocaleDateString()
                          : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={cn(
                      isDark && 'border-gray-700 text-gray-300 hover:bg-gray-700'
                    )}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={cn(
                      isDark && 'border-gray-700 text-gray-300 hover:bg-gray-700'
                    )}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}