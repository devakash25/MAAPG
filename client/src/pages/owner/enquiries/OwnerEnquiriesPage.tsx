import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { MessageCircle, Search, Mail, Phone, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  NEW: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  READ: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  RESPONDED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CLOSED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

export default function OwnerEnquiriesPage() {
  const { theme } = useThemeStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [enquiryStatus, setEnquiryStatus] = useState('');
  const [search, setSearch] = useState('');
  const [respondModal, setRespondModal] = useState<any>(null);
  const [responseNotes, setResponseNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ownerEnquiries', page, enquiryStatus],
    queryFn: () => ownerApi.getEnquiries({ page, limit: 20, status: enquiryStatus || undefined }).then(res => res.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, dealerNotes }: { id: string; status: string; dealerNotes?: string }) =>
      ownerApi.updateEnquiryStatus(id, { status, dealerNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerEnquiries'] });
      addToast('Enquiry updated', 'success');
    },
    onError: () => addToast('Failed to update enquiry', 'error'),
  });

  const enquiries = data?.data?.filter((e: any) =>
    !search ||
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.message?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Enquiries</h1>
        <p className="text-gray-500 text-sm">Manage guest enquiries and messages</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search enquiries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20",
                  theme === 'dark' ? 'bg-[#1e293b] border-sky-800/30 text-white' : 'bg-white'
                )}
              />
            </div>
            <select
              value={enquiryStatus}
              onChange={(e) => { setEnquiryStatus(e.target.value); setPage(1); }}
              className={cn(
                "px-4 py-2 border rounded-lg text-sm w-full sm:w-auto focus:outline-none",
                theme === 'dark' ? 'bg-[#1e293b] border-sky-800/30 text-white' : 'bg-white'
              )}
            >
              <option value="">All Status</option>
              <option value="NEW">New</option>
              <option value="READ">Read</option>
              <option value="RESPONDED">Responded</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No enquiries found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {enquiries.map((enquiry: any) => (
                  <div key={enquiry.id} className={cn(
                    "border rounded-lg p-4 transition-colors hover:bg-gray-50 dark:hover:bg-sky-900/10",
                    enquiry.status === 'NEW' && "border-sky-200 bg-sky-50/50 dark:border-sky-800/30"
                  )}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-sm">{enquiry.name}</h4>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[enquiry.status] || statusColors.NEW)}>
                            {enquiry.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{enquiry.message}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Mail size={12} /> {enquiry.email}</span>
                          {enquiry.phone && <span className="flex items-center gap-1"><Phone size={12} /> {enquiry.phone}</span>}
                          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(enquiry.createdAt).toLocaleDateString()}</span>
                        </div>
                        {enquiry.property && (
                          <p className="text-xs text-gray-500 mt-1">Property: {enquiry.property.name}</p>
                        )}
                      </div>
                      <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                        {enquiry.status === 'NEW' && (
                          <Button variant="outline" size="sm" onClick={() => statusMutation.mutate({ id: enquiry.id, status: 'READ' })}>
                            <CheckCircle size={14} className="mr-1" /> Mark Read
                          </Button>
                        )}
                        {enquiry.status !== 'RESPONDED' && enquiry.status !== 'CLOSED' && (
                          <Button variant="outline" size="sm" onClick={() => { setRespondModal(enquiry); setResponseNotes(''); }}>
                            Respond
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {data?.pagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-3">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!data.pagination.hasPrev}>
                      <ChevronLeft size={14} className="mr-1" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!data.pagination.hasNext}>
                      Next <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Response Modal */}
      <Modal
        isOpen={!!respondModal}
        onClose={() => setRespondModal(null)}
        title="Respond to Enquiry"
        footer={
          <>
            <Button variant="outline" onClick={() => setRespondModal(null)}>Cancel</Button>
            <Button onClick={() => {
              if (respondModal) {
                statusMutation.mutate({ id: respondModal.id, status: 'RESPONDED', dealerNotes: responseNotes });
                setRespondModal(null);
              }
            }} disabled={statusMutation.isPending}>
              {statusMutation.isPending ? 'Sending...' : 'Send Response'}
            </Button>
          </>
        }
      >
        {respondModal && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">{respondModal.name}</p>
              <p className="text-sm text-gray-600 mt-1">{respondModal.message}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Response</label>
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                rows={4}
                placeholder="Write your response to the guest..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
