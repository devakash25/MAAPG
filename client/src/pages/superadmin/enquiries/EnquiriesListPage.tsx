import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enquiryApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { Mail, Phone, Clock, CheckCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  INTERESTED: 'bg-green-100 text-green-800',
  CONVERTED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
};

export default function EnquiriesListPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: analytics } = useQuery({
    queryKey: ['enquiryAnalytics'],
    queryFn: () => enquiryApi.getAnalytics().then(res => res.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['enquiries', status, page],
    queryFn: () => enquiryApi.getAll({ status, page, limit: 20 }).then(res => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => enquiryApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enquiries'] }),
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Enquiries</h1>
        <p className="text-gray-500 text-sm">Track and manage customer enquiries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Mail className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Total Enquiries</p>
                <p className="text-lg md:text-xl font-bold">{analytics?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">New</p>
                <p className="text-lg md:text-xl font-bold">{analytics?.byStatus?.find((s: any) => s.status === 'NEW')?._count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Converted</p>
                <p className="text-lg md:text-xl font-bold">{analytics?.converted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><Mail className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Conversion Rate</p>
                <p className="text-lg md:text-xl font-bold">{analytics?.conversionRate || 0}%</p>
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
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="INTERESTED">Interested</option>
              <option value="CONVERTED">Converted</option>
              <option value="CLOSED">Closed</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Property</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Budget</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Move-in</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((enquiry: any) => (
                      <tr key={enquiry.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium">{enquiry.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone size={12} /> {enquiry.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm">{enquiry.property?.name}</p>
                          <p className="text-xs text-gray-500">{enquiry.property?.propertyType}</p>
                        </td>
                        <td className="py-3 px-4 text-sm">{enquiry.budget ? formatCurrency(Number(enquiry.budget)) : 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{enquiry.moveInDate ? formatDate(enquiry.moveInDate) : 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[enquiry.status] || 'bg-gray-100'}`}>
                            {enquiry.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(enquiry.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            {enquiry.status === 'NEW' && (
                              <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ id: enquiry.id, status: 'CONTACTED' })}>
                                <Phone size={16} />
                              </Button>
                            )}
                            {enquiry.status === 'CONTACTED' && (
                              <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ id: enquiry.id, status: 'INTERESTED' })} className="text-green-600">
                                <CheckCircle size={16} />
                              </Button>
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
                {data?.data?.map((enquiry: any) => (
                  <div key={enquiry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{enquiry.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone size={12} /> {enquiry.phone}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[enquiry.status] || 'bg-gray-100'}`}>
                        {enquiry.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      <p className="text-sm text-gray-600">Property: {enquiry.property?.name} ({enquiry.property?.propertyType})</p>
                      <p className="text-sm text-gray-600">Budget: {enquiry.budget ? formatCurrency(Number(enquiry.budget)) : 'N/A'}</p>
                      <p className="text-sm text-gray-600">Move-in: {enquiry.moveInDate ? formatDate(enquiry.moveInDate) : 'N/A'}</p>
                      <p className="text-xs text-gray-400">{formatDate(enquiry.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      {enquiry.status === 'NEW' && (
                        <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: enquiry.id, status: 'CONTACTED' })}>
                          <Phone size={14} className="mr-1" /> Contact
                        </Button>
                      )}
                      {enquiry.status === 'CONTACTED' && (
                        <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: enquiry.id, status: 'INTERESTED' })} className="text-green-600">
                          <CheckCircle size={14} className="mr-1" /> Mark Interested
                        </Button>
                      )}
                    </div>
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
    </div>
  );
}
