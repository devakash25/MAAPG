import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealerApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, getInitials } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, CheckCircle, XCircle, Ban } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-gray-100 text-gray-800',
};

export default function DealerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: dealer, isLoading } = useQuery({
    queryKey: ['dealer', id],
    queryFn: () => dealerApi.getById(id!).then(res => res.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: () => dealerApi.approve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer', id] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      addToast('Dealer approved successfully', 'success');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => dealerApi.reject(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer', id] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      addToast('Dealer rejected', 'success');
      setRejectModal(false);
      setRejectReason('');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => dealerApi.suspend(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer', id] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      addToast('Dealer suspended', 'success');
    },
  });

  if (isLoading) {
    return <div className="space-y-4 md:space-y-6 animate-fade-in">{[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white rounded-lg animate-pulse" />)}</div>;
  }

  if (!dealer) {
    return <div className="text-center py-12">Dealer not found</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="self-start">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">Dealer Details</h1>
          <p className="text-gray-500 text-sm">{dealer.businessName}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {dealer.status === 'PENDING' && (
            <>
              <Button onClick={() => approveMutation.mutate()} className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={16} className="mr-2" /> Approve
              </Button>
              <Button variant="destructive" onClick={() => setRejectModal(true)}>
                <XCircle size={16} className="mr-2" /> Reject
              </Button>
            </>
          )}
          {dealer.status === 'APPROVED' && (
            <Button variant="destructive" onClick={() => suspendMutation.mutate()}>
              <Ban size={16} className="mr-2" /> Suspend
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Dealer Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dealer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl md:text-2xl flex-shrink-0">
                {getInitials(dealer.user?.firstName || '', dealer.user?.lastName || '')}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-bold">{dealer.user?.firstName} {dealer.user?.lastName}</h3>
                <p className="text-gray-500 truncate">{dealer.user?.email}</p>
                <Badge className={statusColors[dealer.status]}>{dealer.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-sm text-gray-500">Business Name</p>
                <p className="font-medium">{dealer.businessName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Business Type</p>
                <p className="font-medium">{dealer.businessType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Business Email</p>
                <p className="font-medium truncate">{dealer.businessEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Business Phone</p>
                <p className="font-medium">{dealer.businessPhone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GST Number</p>
                <p className="font-medium">{dealer.gstNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PAN Number</p>
                <p className="font-medium">{dealer.panNumber || 'N/A'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">Business Address</p>
                <p className="font-medium">{dealer.businessAddress || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl md:text-3xl font-bold text-primary">{dealer.totalProperties}</p>
                <p className="text-sm text-gray-500">Properties</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl md:text-3xl font-bold text-green-600">{formatCurrency(Number(dealer.totalRevenue))}</p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{dealer.totalBookings}</p>
                <p className="text-sm text-gray-500">Bookings</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl md:text-3xl font-bold text-yellow-600">{dealer.rating || 'N/A'}</p>
                <p className="text-sm text-gray-500">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {dealer.documents?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {dealer.documents.map((doc: any) => (
                <div key={doc.id} className="border rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{doc.type}</span>
                    <Badge variant={doc.verified ? 'success' : 'warning'}>
                      {doc.verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm mt-2 block">
                    View Document
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {dealer.properties?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Property</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">City</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rating</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dealer.properties.map((prop: any) => (
                    <tr key={prop.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{prop.name}</td>
                      <td className="py-3 px-4"><Badge variant="outline">{prop.propertyType}</Badge></td>
                      <td className="py-3 px-4">{prop.city}</td>
                      <td className="py-3 px-4">
                        <Badge variant={prop.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {prop.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{prop.rating || 'N/A'}</td>
                      <td className="py-3 px-4">{formatCurrency(Number(prop.totalRevenue))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No properties yet</p>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal}
        onClose={() => { setRejectModal(false); setRejectReason(''); }}
        title="Reject Dealer"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate(rejectReason)} disabled={!rejectReason.trim()}>
              Reject
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium mb-1">Reason for rejection</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Enter reason..."
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </Modal>
    </div>
  );
}
