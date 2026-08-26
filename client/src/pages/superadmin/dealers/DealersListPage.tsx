import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dealerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate, getInitials } from '@/utils/helpers';
import { Search, Eye, CheckCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-gray-100 text-gray-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

export default function DealersListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['dealers', search, status, page],
    queryFn: () => dealerApi.getAll({ search, status, page, limit: 20 }).then(res => res.data),
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dealers</h1>
          <p className="text-gray-500 text-sm">Manage all property dealers</p>
        </div>
        <Link to="/admin/dealers?status=PENDING">
          <Button variant="outline" size="sm">
            <CheckCircle size={16} className="mr-2" />
            Pending Verification
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search dealers..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-4 py-2 border rounded-lg text-sm w-full sm:w-auto"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Dealer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Business</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Properties</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Registered</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((dealer: any) => (
                      <tr key={dealer.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center font-semibold text-sm">
                              {getInitials(dealer.user.firstName, dealer.user.lastName)}
                            </div>
                            <div>
                              <p className="font-medium">{dealer.user.firstName} {dealer.user.lastName}</p>
                              <p className="text-sm text-gray-500">{dealer.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{dealer.businessName}</p>
                          <p className="text-sm text-gray-500">{dealer.businessType || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[dealer.status] || 'bg-gray-100'}`}>
                            {dealer.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{dealer._count?.properties || 0}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(dealer.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end">
                            <Link to={`/admin/dealers/${dealer.id}`}>
                              <Button variant="ghost" size="sm"><Eye size={16} /></Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data?.data?.map((dealer: any) => (
                  <Link key={dealer.id} to={`/admin/dealers/${dealer.id}`}>
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center justify-center font-semibold text-sm">
                            {getInitials(dealer.user.firstName, dealer.user.lastName)}
                          </div>
                          <div>
                            <p className="font-medium">{dealer.user.firstName} {dealer.user.lastName}</p>
                            <p className="text-xs text-gray-500">{dealer.businessName}</p>
                          </div>
                        </div>
                        <Eye size={16} className="text-gray-400" />
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[dealer.status] || 'bg-gray-100'}`}>
                          {dealer.status}
                        </span>
                        <span className="text-xs text-gray-500">{dealer._count?.properties || 0} properties</span>
                        <span className="text-xs text-gray-500">{formatDate(dealer.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
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
    </div>
  );
}
