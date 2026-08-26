import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
};

export default function PaymentsListPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refundModal, setRefundModal] = useState<{ id: string; amount: number } | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: analytics } = useQuery({
    queryKey: ['paymentAnalytics'],
    queryFn: () => paymentApi.getAnalytics().then(res => res.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payments', status, page],
    queryFn: () => paymentApi.getAll({ status, page, limit: 20 }).then(res => res.data),
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason: string }) => paymentApi.refund(id, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['paymentAnalytics'] });
      addToast('Refund processed successfully', 'success');
      setRefundModal(null); setRefundReason(''); setRefundAmount('');
    },
    onError: () => addToast('Failed to process refund', 'error'),
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Payments</h1>
        <p className="text-gray-500 text-sm">Track all payments and transactions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="hover-lift">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0"><ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-green-600" /></div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-gray-500">Total Revenue</p>
                <p className="text-lg md:text-xl font-bold truncate">{formatCurrency(Number(analytics?.totalRevenue || 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0"><CreditCard className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" /></div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-gray-500">Pending</p>
                <p className="text-lg md:text-xl font-bold truncate">{formatCurrency(Number(analytics?.pendingPayments || 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0"><ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-gray-500">Successful</p>
                <p className="text-lg md:text-xl font-bold">{analytics?.successfulPayments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0"><ArrowDownRight className="h-4 w-4 md:h-5 md:w-5 text-red-600" /></div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-gray-500">Refunded</p>
                <p className="text-lg md:text-xl font-bold truncate">{formatCurrency(Number(analytics?.refundedAmount || 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2 border rounded-lg text-sm w-full sm:w-auto">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Payment ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Property</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Method</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((payment: any) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm">{payment.id.slice(0, 8)}...</td>
                        <td className="py-3 px-4 text-sm">{payment.booking?.user?.firstName} {payment.booking?.user?.lastName}</td>
                        <td className="py-3 px-4 text-sm">{payment.booking?.property?.name}</td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(Number(payment.amount))}</td>
                        <td className="py-3 px-4"><Badge variant="outline">{payment.paymentMethod || 'N/A'}</Badge></td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[payment.paymentStatus] || 'bg-gray-100'}`}>
                            {payment.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(payment.createdAt)}</td>
                        <td className="py-3 px-4 text-right">
                          {payment.paymentStatus === 'SUCCESS' && (
                            <Button variant="ghost" size="sm" onClick={() => { setRefundModal({ id: payment.id, amount: Number(payment.amount) }); setRefundAmount(String(payment.amount)); }} className="text-red-600">
                              Refund
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data?.data?.map((payment: any) => (
                  <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500">{payment.id.slice(0, 8)}...</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[payment.paymentStatus] || 'bg-gray-100'}`}>
                            {payment.paymentStatus}
                          </span>
                        </div>
                        <p className="font-medium">{formatCurrency(Number(payment.amount))}</p>
                        <p className="text-sm text-gray-500">{payment.booking?.property?.name}</p>
                      </div>
                      {payment.paymentStatus === 'SUCCESS' && (
                        <Button variant="ghost" size="sm" onClick={() => { setRefundModal({ id: payment.id, amount: Number(payment.amount) }); setRefundAmount(String(payment.amount)); }} className="text-red-600 flex-shrink-0">
                          Refund
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      <Badge variant="outline" className="text-xs">{payment.paymentMethod || 'N/A'}</Badge>
                      <span>{payment.booking?.user?.firstName} {payment.booking?.user?.lastName}</span>
                      <span>{formatDate(payment.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {data?.pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-3">
              <p className="text-sm text-gray-500">Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!data.pagination.hasPrev}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!data.pagination.hasNext}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!refundModal} onClose={() => { setRefundModal(null); setRefundReason(''); setRefundAmount(''); }} title="Process Refund"
        footer={<>
          <Button variant="outline" onClick={() => setRefundModal(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { if (refundModal && refundReason.trim()) refundMutation.mutate({ id: refundModal.id, amount: parseFloat(refundAmount) || refundModal.amount, reason: refundReason }); }} disabled={!refundReason.trim() || refundMutation.isPending}>
            {refundMutation.isPending ? 'Processing...' : 'Process Refund'}
          </Button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Refund Amount (Max: {refundModal && formatCurrency(refundModal.amount)})</label>
            <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} max={refundModal?.amount} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={3} placeholder="Enter refund reason..." className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
