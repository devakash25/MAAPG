import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import { formatDateTime } from '@/utils/helpers';

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  APPROVE: 'bg-emerald-100 text-emerald-800',
  REJECT: 'bg-orange-100 text-orange-800',
  SUSPEND: 'bg-gray-100 text-gray-800',
  LOGIN: 'bg-purple-100 text-purple-800',
};

export default function AuditLogsPage() {
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', entity, action, page],
    queryFn: () => auditApi.getAll({ entity, action, page, limit: 50 }).then(res => res.data),
  });

  const filteredLogs = data?.data?.filter((log: any) =>
    !search ||
    log.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    log.entity?.toLowerCase().includes(search.toLowerCase()) ||
    log.action?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Audit Logs</h1>
        <p className="text-gray-500 text-sm">Track all system activities and changes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className="px-4 py-2 border rounded-lg text-sm flex-1 sm:flex-none">
                <option value="">All Entities</option>
                <option value="User">User</option>
                <option value="Dealer">Dealer</option>
                <option value="Property">Property</option>
                <option value="Booking">Booking</option>
                <option value="Payment">Payment</option>
                <option value="Review">Review</option>
                <option value="Complaint">Complaint</option>
                <option value="Settings">Settings</option>
              </select>
              <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="px-4 py-2 border rounded-lg text-sm flex-1 sm:flex-none">
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="APPROVE">Approve</option>
                <option value="REJECT">Reject</option>
                <option value="SUSPEND">Suspend</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(10)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Timestamp</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Entity</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Entity ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log: any) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDateTime(log.createdAt)}</td>
                        <td className="py-3 px-4 text-sm">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{log.entity}</td>
                        <td className="py-3 px-4 text-sm font-mono text-gray-500">
                          {log.entityId ? log.entityId.slice(0, 8) + '...' : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm max-w-xs truncate">
                          {log.newValues ? JSON.stringify(log.newValues).slice(0, 50) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredLogs.map((log: any) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100'}`}>
                          {log.action}
                        </span>
                        <span className="text-sm font-medium">{log.entity}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      By: {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                    </p>
                    {log.entityId && (
                      <p className="text-xs font-mono text-gray-500">ID: {log.entityId.slice(0, 12)}...</p>
                    )}
                    {log.newValues && (
                      <p className="text-xs text-gray-400 mt-1 truncate">Details: {JSON.stringify(log.newValues).slice(0, 60)}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {data?.pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-3">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.pagination.total)} of {data.pagination.total}
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
