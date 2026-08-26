import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, getInitials } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { useState } from 'react';
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, User } from 'lucide-react';

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

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [adminNotes, setAdminNotes] = useState('');
  const [resolution, setResolution] = useState('');

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => complaintApi.getById(id!).then(res => res.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => complaintApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', id] });
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      addToast('Complaint updated', 'success');
    },
  });

  if (isLoading) {
    return <div className="space-y-4 md:space-y-6 animate-fade-in">{[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white rounded-lg animate-pulse" />)}</div>;
  }

  if (!complaint) {
    return <div className="text-center py-12">Complaint not found</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="self-start">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">Complaint Details</h1>
          <p className="text-gray-500 text-sm">{complaint.subject}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge className={statusColors[complaint.status]}>{complaint.status}</Badge>
          <Badge className={priorityColors[complaint.priority]}>{complaint.priority}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Complaint Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Complaint Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Subject</p>
              <p className="font-medium text-lg">{complaint.subject}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
            </div>
            {complaint.category && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Category</p>
                <Badge variant="outline">{complaint.category}</Badge>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{formatDate(complaint.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(complaint.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {complaint.status === 'NEW' && (
              <Button onClick={() => updateMutation.mutate({ status: 'IN_PROGRESS' })} className="w-full">
                <Clock size={16} className="mr-2" /> Start Progress
              </Button>
            )}
            {complaint.status === 'IN_PROGRESS' && (
              <Button onClick={() => updateMutation.mutate({ status: 'RESOLVED' })} className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle size={16} className="mr-2" /> Mark Resolved
              </Button>
            )}
            {complaint.status !== 'ESCALATED' && complaint.status !== 'CLOSED' && (
              <Button variant="destructive" onClick={() => updateMutation.mutate({ status: 'ESCALATED' })} className="w-full">
                <AlertTriangle size={16} className="mr-2" /> Escalate
              </Button>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Add internal notes..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => updateMutation.mutate({ adminNotes })}
                disabled={!adminNotes.trim()}
              >
                Save Notes
              </Button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resolution</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                placeholder="Describe resolution..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => updateMutation.mutate({ resolution, status: 'RESOLVED' })}
                disabled={!resolution.trim()}
              >
                Save & Resolve
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={18} /> User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
              {getInitials(complaint.user?.firstName || 'U', complaint.user?.lastName || '')}
            </div>
            <div className="min-w-0">
              <p className="font-medium">{complaint.user?.firstName} {complaint.user?.lastName}</p>
              <p className="text-sm text-gray-500 truncate">{complaint.user?.email}</p>
              {complaint.user?.phone && <p className="text-sm text-gray-500">{complaint.user.phone}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
