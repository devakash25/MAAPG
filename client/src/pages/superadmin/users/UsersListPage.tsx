import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, getInitials } from '@/utils/helpers';
import { Search, CheckCircle, UserX } from 'lucide-react';

export default function UsersListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, page],
    queryFn: () => userApi.getAll({ search, page, limit: 20 }).then(res => res.data),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userApi.updateStatus(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Users</h1>
          <p className="text-gray-500 text-sm">Manage all platform users</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Bookings</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Joined</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((user: any) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-semibold text-sm">
                              {getInitials(user.firstName, user.lastName)}
                            </div>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : user.role === 'DEALER' ? 'info' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={user.isActive ? 'success' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Blocked'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">{user._count?.bookings || 0}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => blockMutation.mutate({ id: user.id, isActive: !user.isActive })}
                            >
                              {user.isActive ? <UserX size={16} /> : <CheckCircle size={16} />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data?.data?.map((user: any) => (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-semibold text-sm">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => blockMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      >
                        {user.isActive ? <UserX size={16} /> : <CheckCircle size={16} />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : user.role === 'DEALER' ? 'info' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.isActive ? 'success' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Blocked'}
                      </Badge>
                      <span className="text-xs text-gray-500">{user._count?.bookings || 0} bookings</span>
                      <span className="text-xs text-gray-500">{formatDate(user.createdAt)}</span>
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
