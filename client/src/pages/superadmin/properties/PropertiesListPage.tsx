import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Search, CheckCircle, XCircle, Ban, Star, Eye } from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-orange-100 text-orange-800',
  UNPUBLISHED: 'bg-purple-100 text-purple-800',
};

export default function PropertiesListPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['properties', search, type, status, page],
    queryFn: () => propertyApi.getAll({ search, type, status, page, limit: 20 }).then(res => res.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => propertyApi.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['properties'] }); addToast('Property approved', 'success'); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => propertyApi.reject(id, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['properties'] }); addToast('Property rejected', 'success'); setRejectModal(null); setRejectReason(''); },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => propertyApi.suspend(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['properties'] }); addToast('Property suspended', 'success'); },
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) => propertyApi.feature(id, isFeatured),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['properties'] }); addToast('Property updated', 'success'); },
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Properties</h1>
        <p className="text-gray-500 text-sm">Manage all properties on the platform</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search properties..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm flex-1 sm:flex-none">
                <option value="">All Types</option>
                <option value="HOTEL">Hotel</option>
                <option value="HOSTEL">Hostel</option>
                <option value="PG">PG</option>
                <option value="RENTAL_ROOM">Rental Room</option>
                <option value="APARTMENT">Apartment</option>
                <option value="GUEST_HOUSE">Guest House</option>
              </select>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm flex-1 sm:flex-none">
                <option value="">All Status</option>
                <option value="PENDING_VERIFICATION">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Property</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Dealer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">City</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rating</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((prop: any) => (
                      <tr key={prop.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium">{prop.name}</p>
                          <p className="text-xs text-gray-500">{prop.totalBookings || 0} bookings</p>
                        </td>
                        <td className="py-3 px-4"><Badge variant="outline">{prop.propertyType}</Badge></td>
                        <td className="py-3 px-4 text-sm">{prop.dealer?.businessName || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{prop.city}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[prop.status] || 'bg-gray-100'}`}>
                            {prop.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-sm">{prop.rating || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{formatCurrency(Number(prop.totalRevenue || 0))}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/properties/${prop.id}`)}><Eye size={16} /></Button>
                            {prop.status === 'PENDING_VERIFICATION' && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate(prop.id)} className="text-green-600"><CheckCircle size={16} /></Button>
                                <Button variant="ghost" size="sm" onClick={() => setRejectModal({ id: prop.id })} className="text-red-600"><XCircle size={16} /></Button>
                              </>
                            )}
                            {prop.status === 'ACTIVE' && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => featureMutation.mutate({ id: prop.id, isFeatured: !prop.isFeatured })} className={prop.isFeatured ? 'text-yellow-500' : 'text-gray-400'}>
                                  <Star size={16} className={prop.isFeatured ? 'fill-current' : ''} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => suspendMutation.mutate(prop.id)} className="text-orange-600"><Ban size={16} /></Button>
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
                {data?.data?.map((prop: any) => (
                  <div key={prop.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{prop.propertyType}</Badge>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[prop.status] || 'bg-gray-100'}`}>
                            {prop.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-medium">{prop.name}</p>
                        <p className="text-xs text-gray-500">{prop.dealer?.businessName || 'N/A'} &middot; {prop.city}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/properties/${prop.id}`)}>
                        <Eye size={16} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        <span>{prop.rating || 'N/A'}</span>
                      </div>
                      <span className="text-gray-500">{prop.totalBookings || 0} bookings</span>
                      <span className="font-medium">{formatCurrency(Number(prop.totalRevenue || 0))}</span>
                    </div>
                    {prop.status === 'PENDING_VERIFICATION' && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => approveMutation.mutate(prop.id)} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                          <CheckCircle size={14} className="mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setRejectModal({ id: prop.id })} className="flex-1">
                          <XCircle size={14} className="mr-1" /> Reject
                        </Button>
                      </div>
                    )}
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

      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Property"
        footer={<>
          <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => rejectModal && rejectMutation.mutate({ id: rejectModal.id, reason: rejectReason })} disabled={!rejectReason.trim()}>Reject</Button>
        </>}>
        <div>
          <label className="block text-sm font-medium mb-1">Reason for rejection</label>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Enter reason..." className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </Modal>
    </div>
  );
}
