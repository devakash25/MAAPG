import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useThemeStore } from '@/store/themeStore';
import { cn, formatDate } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Star, MessageSquare, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function OwnerReviewsPage() {
  const { theme } = useThemeStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [replyModal, setReplyModal] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ownerReviews', page],
    queryFn: () => ownerApi.getReviews({ page, limit: 20 }).then(res => res.data),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, ownerReply }: { id: string; ownerReply: string }) =>
      ownerApi.replyToReview(id, { ownerReply }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerReviews'] });
      addToast('Reply submitted', 'success');
      setReplyModal(null);
      setReplyText('');
    },
    onError: () => addToast('Failed to submit reply', 'error'),
  });

  const reviews = data?.data?.filter((r: any) =>
    !search ||
    r.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    r.property?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Reviews</h1>
          <p className="text-gray-500 text-sm">Manage guest reviews for your properties</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <Star size={20} className="text-yellow-500 fill-yellow-500" />
          <span className="font-bold text-lg">{averageRating}</span>
          <span className="text-sm text-gray-500">({data?.pagination?.total || 0} reviews)</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20",
                theme === 'dark' ? 'bg-[#1e293b] border-sky-800/30 text-white' : 'bg-white'
              )}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No reviews yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {reviews.map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-sky-900/10 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < Math.floor(Number(review.rating)) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{review.rating}</span>
                        </div>
                        {review.title && <h4 className="font-medium text-sm mb-1">{review.title}</h4>}
                        <p className="text-gray-600 text-sm mb-2">{review.comment}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>By: {review.user?.firstName} {review.user?.lastName}</span>
                          <span>Property: {review.property?.name}</span>
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                        {review.ownerReply && (
                          <div className="mt-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-100 dark:border-sky-800/30">
                            <p className="text-xs font-medium text-sky-600 mb-1">Your Reply:</p>
                            <p className="text-sm">{review.ownerReply}</p>
                          </div>
                        )}
                      </div>
                      {!review.ownerReply && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setReplyModal(review); setReplyText(''); }}
                          className="flex-shrink-0"
                        >
                          <MessageSquare size={14} className="mr-1" /> Reply
                        </Button>
                      )}
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

      {/* Reply Modal */}
      <Modal
        isOpen={!!replyModal}
        onClose={() => setReplyModal(null)}
        title="Reply to Review"
        footer={
          <>
            <Button variant="outline" onClick={() => setReplyModal(null)}>Cancel</Button>
            <Button onClick={() => replyMutation.mutate({ id: replyModal?.id, ownerReply: replyText })} disabled={!replyText.trim() || replyMutation.isPending}>
              {replyMutation.isPending ? 'Submitting...' : 'Submit Reply'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {replyModal && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < Math.floor(Number(replyModal.rating)) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                ))}
              </div>
              <p className="text-sm text-gray-600">{replyModal.comment}</p>
            </div>
          )}
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20",
              theme === 'dark' ? 'bg-[#1e293b] border-sky-800/30 text-white' : 'bg-white'
            )}
          />
        </div>
      </Modal>
    </div>
  );
}
