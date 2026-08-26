import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDate, formatCurrency } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Tag, Plus, Search, Percent, DollarSign, Calendar, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';

export default function OwnerOffersPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '', description: '', discountType: 'PERCENTAGE', discount: 0,
    minAmount: 0, maxDiscount: 0, validFrom: '', validUntil: '', maxUses: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ownerOffers', page],
    queryFn: () => ownerApi.getOffers({ page, limit: 20 }).then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ownerApi.createOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerOffers'] });
      addToast('Offer created', 'success');
      setCreateModal(false);
      resetForm();
    },
    onError: () => addToast('Failed to create offer', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ownerApi.updateOffer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerOffers'] });
      addToast('Offer updated', 'success');
      setEditModal(null);
    },
    onError: () => addToast('Failed to update offer', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ownerApi.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerOffers'] });
      addToast('Offer deleted', 'success');
      setDeleteModal(null);
    },
    onError: () => addToast('Failed to delete offer', 'error'),
  });

  const resetForm = () => {
    setFormData({ code: '', description: '', discountType: 'PERCENTAGE', discount: 0, minAmount: 0, maxDiscount: 0, validFrom: '', validUntil: '', maxUses: 0 });
  };

  const openEdit = (coupon: any) => {
    setFormData({
      code: coupon.code, description: coupon.description || '',
      discountType: coupon.discountType, discount: Number(coupon.discount),
      minAmount: Number(coupon.minAmount || 0), maxDiscount: Number(coupon.maxDiscount || 0),
      validFrom: coupon.validFrom?.split('T')[0] || '', validUntil: coupon.validUntil?.split('T')[0] || '',
      maxUses: coupon.maxUses || 0,
    });
    setEditModal(coupon);
  };

  const coupons = data?.data?.filter((c: any) =>
    !search || c.code?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Offers & Coupons</h1>
          <p className="text-gray-500 text-sm">Create and manage discount coupons</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateModal(true); }} className="w-full sm:w-auto">
          <Plus size={16} className="mr-2" /> Create Offer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search coupons..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12">
              <Tag size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No offers created yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {coupons.map((coupon: any) => {
                  const isExpired = new Date(coupon.validUntil) < new Date();
                  return (
                    <div key={coupon.id} className={cn("border rounded-lg p-4 transition-colors", isExpired ? 'opacity-60' : 'hover:bg-gray-50')}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-mono font-bold text-sm">{coupon.code}</h4>
                            <Badge variant={coupon.discountType === 'PERCENTAGE' ? 'info' : 'success'}>
                              {coupon.discountType === 'PERCENTAGE' ? <Percent size={12} className="mr-1" /> : <DollarSign size={12} className="mr-1" />}
                              {coupon.discountType === 'PERCENTAGE' ? `${coupon.discount}% off` : `${formatCurrency(coupon.discount)} off`}
                            </Badge>
                            {isExpired && <Badge variant="destructive">Expired</Badge>}
                            {!coupon.isActive && <Badge variant="secondary">Disabled</Badge>}
                          </div>
                          {coupon.description && <p className="text-sm text-gray-600 mb-1">{coupon.description}</p>}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            {coupon.minAmount > 0 && <span>Min: {formatCurrency(coupon.minAmount)}</span>}
                            {coupon.maxDiscount > 0 && <span>Max discount: {formatCurrency(coupon.maxDiscount)}</span>}
                            {coupon.maxUses > 0 && <span>Uses: {coupon.usedCount}/{coupon.maxUses}</span>}
                            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}><Edit size={16} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ id: coupon.id, data: { isActive: !coupon.isActive } })}>
                            {coupon.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteModal(coupon.id)}><Trash2 size={16} /></Button>
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
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!data.pagination.hasPrev}><ChevronLeft size={14} className="mr-1" /> Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!data.pagination.hasNext}>Next <ChevronRight size={14} className="ml-1" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={createModal || !!editModal}
        onClose={() => { setCreateModal(false); setEditModal(null); }}
        title={editModal ? 'Edit Offer' : 'Create Offer'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setCreateModal(false); setEditModal(null); }}>Cancel</Button>
            <Button onClick={() => {
              if (editModal) updateMutation.mutate({ id: editModal.id, data: formData });
              else createMutation.mutate(formData);
            }} disabled={!formData.code || createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Coupon Code</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What's this offer about?" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Discount Type</label>
              <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{formData.discountType === 'PERCENTAGE' ? 'Percentage Off' : 'Amount Off'}</label>
              <input type="number" min="0" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Order Amount</label>
              <input type="number" min="0" value={formData.minAmount} onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Discount Cap</label>
              <input type="number" min="0" value={formData.maxDiscount} onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valid From</label>
              <input type="date" value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valid Until</label>
              <input type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Uses (0 = unlimited)</label>
            <input type="number" min="0" value={formData.maxUses} onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Offer"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteModal && deleteMutation.mutate(deleteModal)}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete this coupon? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
