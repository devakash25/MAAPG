import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offerApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Plus, Trash2, Tag, Percent, DollarSign } from 'lucide-react';

export default function OffersListPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discount: '',
    minAmount: '',
    maxDiscount: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
  });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => offerApi.getCoupons({ limit: 50 }).then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => offerApi.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setShowForm(false);
      setFormData({
        code: '', description: '', discountType: 'PERCENTAGE', discount: '',
        minAmount: '', maxDiscount: '', maxUses: '', validFrom: '', validUntil: '',
      });
      addToast('Coupon created', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => offerApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      addToast('Coupon deleted', 'success');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      discount: Number(formData.discount),
      minAmount: formData.minAmount ? Number(formData.minAmount) : undefined,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
      maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Offers & Promotions</h1>
          <p className="text-gray-500 text-sm">Manage coupons and promotional offers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
          <Plus size={16} className="mr-2" /> Create Coupon
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Coupon Code *</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME1000"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Welcome offer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Type *</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount *</label>
                <Input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  placeholder="10"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Amount</label>
                <Input
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Discount</label>
                <Input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Uses</label>
                <Input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valid From *</label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valid Until *</label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit">Create Coupon</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Coupons List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 md:p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Discount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Min Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Uses</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Valid Until</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((coupon: any) => (
                      <tr key={coupon.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Tag size={16} className="text-primary" />
                            <span className="font-mono font-bold">{coupon.code}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {coupon.discountType === 'PERCENTAGE' ? <Percent size={12} className="mr-1" /> : <DollarSign size={12} className="mr-1" />}
                            {coupon.discountType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {coupon.discountType === 'PERCENTAGE' ? `${coupon.discount}%` : `₹${coupon.discount}`}
                        </td>
                        <td className="py-3 px-4 text-sm">{coupon.minAmount ? `₹${coupon.minAmount}` : 'None'}</td>
                        <td className="py-3 px-4 text-sm">{coupon.usedCount}/{coupon.maxUses || '∞'}</td>
                        <td className="py-3 px-4 text-sm">{formatDate(coupon.validUntil)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={coupon.isActive ? 'success' : 'secondary'}>
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => {
                              if (confirm('Delete this coupon?')) deleteMutation.mutate(coupon.id);
                            }} className="text-red-500">
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-3 space-y-3">
                {data?.data?.map((coupon: any) => (
                  <div key={coupon.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-primary" />
                        <span className="font-mono font-bold">{coupon.code}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (confirm('Delete this coupon?')) deleteMutation.mutate(coupon.id);
                      }} className="text-red-500">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {coupon.discountType === 'PERCENTAGE' ? <Percent size={12} className="mr-1" /> : <DollarSign size={12} className="mr-1" />}
                          {coupon.discountType}
                        </Badge>
                        <span className="font-medium">{coupon.discountType === 'PERCENTAGE' ? `${coupon.discount}%` : `₹${coupon.discount}`}</span>
                      </div>
                      <p className="text-sm text-gray-600">Min Amount: {coupon.minAmount ? `₹${coupon.minAmount}` : 'None'}</p>
                      <p className="text-sm text-gray-600">Uses: {coupon.usedCount}/{coupon.maxUses || '∞'}</p>
                      <p className="text-sm text-gray-600">Valid Until: {formatDate(coupon.validUntil)}</p>
                    </div>
                    <Badge variant={coupon.isActive ? 'success' : 'secondary'}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
