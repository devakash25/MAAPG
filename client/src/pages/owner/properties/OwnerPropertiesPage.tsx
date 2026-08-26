import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Search, Plus, Home, Star, Eye, Edit, Send } from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  SUSPENDED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function OwnerPropertiesPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['ownerProperties', status, page],
    queryFn: () => ownerApi.getProperties({ status, page, limit: 20, search }).then(res => res.data),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => ownerApi.submitProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerProperties'] });
      addToast('Property submitted for review', 'success');
    },
  });

  const properties = data?.data || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">My Properties</h1>
          <p className="text-gray-500 text-sm">Manage all your properties</p>
        </div>
        <Button onClick={() => navigate('/owner/properties/add')} className="w-full sm:w-auto">
          <Plus size={16} className="mr-2" /> Add Property
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2 border rounded-lg text-sm w-full sm:w-auto">
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_VERIFICATION">Pending</option>
              <option value="ACTIVE">Live</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Home size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No properties found</p>
              <Button onClick={() => navigate('/owner/properties/add')}>
                <Plus size={16} className="mr-2" /> Add Your First Property
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((property: any) => (
                <div key={property.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                        <Home size={20} className="text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{property.name}</p>
                        <p className="text-xs text-gray-500">{property.propertyType} • {property.city}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={statusColors[property.status] || 'bg-gray-100'}>
                            {property.status?.replace('_', ' ')}
                          </Badge>
                          {property.rating && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Star size={12} className="text-yellow-500 fill-yellow-500" /> {Number(property.rating).toFixed(1)}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{property._count?.bookings || 0} bookings</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-sm">{formatCurrency(Number(property.totalRevenue || 0))}</span>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/owner/properties/${property.id}`)}>
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/owner/properties/${property.id}`)}>
                        <Edit size={16} />
                      </Button>
                      {property.status === 'DRAFT' && (
                        <Button variant="outline" size="sm" onClick={() => submitMutation.mutate(property.id)}>
                          <Send size={14} className="mr-1" /> Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
}
