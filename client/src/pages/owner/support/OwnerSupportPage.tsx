import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDate } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Plus, MessageSquare, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Send, LifeBuoy, BookOpen } from 'lucide-react';

const statusColors: Record<string, string> = {
  NEW: 'bg-sky-100 text-sky-800',
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  ESCALATED: 'bg-red-100 text-red-800',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function OwnerSupportPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [ticketDetail, setTicketDetail] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tickets' | 'faqs'>('tickets');
  const [formData, setFormData] = useState({ subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['ownerSupport', page, status],
    queryFn: () => ownerApi.getSupportTickets({ page, limit: 20, status: status || undefined }).then(res => res.data),
  });

  const { data: faqs } = useQuery({
    queryKey: ['ownerFaqs'],
    queryFn: () => ownerApi.getFaqs().then(res => res.data.data),
    enabled: activeTab === 'faqs',
  });

  const { data: ticketDetailData } = useQuery({
    queryKey: ['ownerSupportDetail', ticketDetail?.id],
    queryFn: () => ownerApi.getSupportTicket(ticketDetail.id).then(res => res.data.data),
    enabled: !!ticketDetail?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ownerApi.createSupportTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerSupport'] });
      addToast('Ticket created', 'success');
      setCreateModal(false);
      setFormData({ subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
    },
    onError: () => addToast('Failed to create ticket', 'error'),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => ownerApi.replyToSupport(id, { message }),
    onSuccess: () => {
      addToast('Reply sent', 'success');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['ownerSupportDetail'] });
    },
    onError: () => addToast('Failed to send reply', 'error'),
  });

  const ticketList = tickets?.data || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Help & Support</h1>
        <p className="text-gray-500 text-sm">Get help and manage support tickets</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 md:gap-4 border-b overflow-x-auto">
        {[
          { id: 'tickets', label: 'My Tickets', icon: MessageSquare },
          { id: 'faqs', label: 'FAQs', icon: BookOpen },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("pb-3 px-3 md:px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2", activeTab === tab.id ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex gap-2 w-full sm:w-auto">
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2 border rounded-lg text-sm w-full sm:w-auto focus:outline-none bg-white">
                  <option value="">All Status</option>
                  <option value="NEW">New</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <Button onClick={() => setCreateModal(true)} className="w-full sm:w-auto"><Plus size={16} className="mr-2" /> New Ticket</Button>
            </div>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : ticketList.length === 0 ? (
              <div className="text-center py-12">
                <LifeBuoy size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No support tickets</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {ticketList.map((ticket: any) => (
                    <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setTicketDetail(ticket)}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                            <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                            <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{ticket.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(ticket.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {tickets?.pagination && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-3">
                    <p className="text-sm text-gray-500">Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, tickets.pagination.total)} of {tickets.pagination.total}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!tickets.pagination.hasPrev}><ChevronLeft size={14} className="mr-1" /> Prev</Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!tickets.pagination.hasNext}>Next <ChevronRight size={14} className="ml-1" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <Card>
          <CardContent className="p-6">
            {faqs && faqs.length > 0 ? (
              <div className="space-y-3">
                {faqs.map((faq: any) => (
                  <div key={faq.id} className="border rounded-lg overflow-hidden">
                    <button onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm pr-4">{faq.question}</span>
                      {expandedFaq === faq.id ? <ChevronUp size={18} className="flex-shrink-0 text-gray-400" /> : <ChevronDown size={18} className="flex-shrink-0 text-gray-400" />}
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-4 pb-4 text-sm text-gray-600 border-t pt-3">{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No FAQs available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Ticket Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Support Ticket" footer={
        <>
          <Button variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
          <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.subject || !formData.description || createMutation.isPending}>
            {createMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </>
      }>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Brief description of your issue" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none">
                <option value="GENERAL">General</option>
                <option value="TECHNICAL">Technical</option>
                <option value="PAYMENT">Payment</option>
                <option value="BOOKING">Booking</option>
                <option value="PROPERTY">Property</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} placeholder="Describe your issue in detail..." className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
        </div>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal isOpen={!!ticketDetail} onClose={() => setTicketDetail(null)} title={ticketDetail?.subject || 'Ticket Detail'} footer={
        <>
          <Button variant="outline" onClick={() => setTicketDetail(null)}>Close</Button>
          {ticketDetail?.status !== 'RESOLVED' && (
            <Button onClick={() => replyText.trim() && replyMutation.mutate({ id: ticketDetail.id, message: replyText })} disabled={!replyText.trim() || replyMutation.isPending}>
              <Send size={14} className="mr-2" /> {replyMutation.isPending ? 'Sending...' : 'Reply'}
            </Button>
          )}
        </>
      }>
        {ticketDetailData && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge className={statusColors[ticketDetailData.status]}>{ticketDetailData.status}</Badge>
              <Badge className={priorityColors[ticketDetailData.priority]}>{ticketDetailData.priority}</Badge>
              <Badge variant="secondary">{ticketDetailData.category}</Badge>
            </div>
            <p className="text-sm text-gray-600">{ticketDetailData.description}</p>
            <p className="text-xs text-gray-400">Created: {formatDate(ticketDetailData.createdAt)}</p>
            {ticketDetailData.resolution && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs font-medium text-green-700 mb-1">Resolution:</p>
                <p className="text-sm text-green-800">{ticketDetailData.resolution}</p>
              </div>
            )}
            {ticketDetailData.status !== 'RESOLVED' && (
              <div className="pt-3 border-t">
                <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} placeholder="Write a reply..." className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
