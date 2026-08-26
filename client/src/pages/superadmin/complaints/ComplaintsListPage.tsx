import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { AlertTriangle, Clock, CheckCircle, Eye } from 'lucide-react';

const statusColors: Record<string, string> = {
  NEW: 'bg-red-100 text-red-800',
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  ESCALATED: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function ComplaintsListPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: analytics } = useQuery({
    queryKey: ['complaintAnalytics'],
    queryFn: () => complaintApi.getAnalytics().then(res => res.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', status, page],
    queryFn: () => complaintApi.getAll({ status, page, limit: 20 }).then(res => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => complaintApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      addToast('Complaint updated', 'success');
    },
  });

  const filteredComplaints = data?.data?.filter((complaint: any) =>
    !search ||
    complaint.subject?.toLowerCase().includes(search.toLowerCase()) ||
    complaint.description?.toLowerCase().includes(search.toLowerCase()) ||
    complaint.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    complaint.user?.lastName?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Complaints</h1>
        <p className="text-gray-500 text-sm">Manage customer complaints and support tickets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
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
              <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">In Progress</p>
                <p className="text-lg md:text-xl font-bold">{analytics?.byStatus?.find((s: any) => s.status === 'IN_PROGRESS')?._count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Resolved</p>
                <p className="text-lg md:text-xl font-bold">{analytics?.byStatus?.find((s: any) => s.status === 'RESOLVED')?._count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">Escalated</p>
                <p className="text-lg md:text-xl font-bold">{analytics?.byStatus?.find((s: any) => s.status === 'ESCALATED')?._count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search complaints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2 border rounded-lg text-sm w-full sm:w-auto">
              <option value="">All Status</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED">Escalated</option>
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Subject</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Priority</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Created</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((complaint: any) => (
                      <tr key={complaint.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium">{complaint.subject}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{complaint.description}</p>
                        </td>
                        <td className="py-3 px-4 text-sm">{complaint.user?.firstName} {complaint.user?.lastName}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[complaint.priority] || 'bg-gray-100'}`}>
                            {complaint.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[complaint.status] || 'bg-gray-100'}`}>
                            {complaint.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(complaint.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/complaints/${complaint.id}`)}>
                              <Eye size={16} />
                            </Button>
                            {complaint.status === 'NEW' && (
                              <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ id: complaint.id, data: { status: 'IN_PROGRESS' } })}>
                                <Clock size={16} />
                              </Button>
                            )}
                            {complaint.status === 'IN_PROGRESS' && (
                              <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ id: complaint.id, data: { status: 'RESOLVED' } })} className="text-green-600">
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
                {filteredComplaints.map((complaint: any) => (
                  <div key={complaint.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{complaint.subject}</p>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/complaints/${complaint.id}`)}>
                        <Eye size={16} />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{complaint.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[complaint.priority] || 'bg-gray-100'}`}>
                        {complaint.priority}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[complaint.status] || 'bg-gray-100'}`}>
                        {complaint.status}
                      </span>
                      <span className="text-xs text-gray-500">{complaint.user?.firstName} {complaint.user?.lastName}</span>
                      <span className="text-xs text-gray-400">{formatDate(complaint.createdAt)}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {complaint.status === 'NEW' && (
                        <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: complaint.id, data: { status: 'IN_PROGRESS' } })}>
                          <Clock size={14} className="mr-1" /> Start
                        </Button>
                      )}
                      {complaint.status === 'IN_PROGRESS' && (
                        <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: complaint.id, data: { status: 'RESOLVED' } })} className="text-green-600">
                          <CheckCircle size={14} className="mr-1" /> Resolve
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
