import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { Star, Flag, Trash2, Search } from 'lucide-react';

export default function ReviewsListPage() {
  const [page, setPage] = useState(1);
  const [flagged, setFlagged] = useState('');
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page, flagged],
    queryFn: () => reviewApi.getAll({ page, limit: 20, flagged: flagged || undefined }).then(res => res.data),
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, isFlagged }: { id: string; isFlagged: boolean }) => reviewApi.flag(id, isFlagged),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      addToast('Review updated', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      addToast('Review deleted', 'success');
      setDeleteModal(null);
    },
  });

  const filteredReviews = data?.data?.filter((review: any) =>
    !search ||
    review.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    review.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    review.property?.name?.toLowerCase().includes(search.toLowerCase()) ||
    review.comment?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Reviews</h1>
        <p className="text-gray-500 text-sm">Manage property reviews and ratings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <select value={flagged} onChange={(e) => { setFlagged(e.target.value); setPage(1); }} className="px-4 py-2 border rounded-lg text-sm w-full sm:w-auto">
              <option value="">All Reviews</option>
              <option value="true">Flagged</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((review: any) => (
                <div key={review.id} className={`border rounded-lg p-4 transition-colors ${review.isFlagged ? 'border-red-200 bg-red-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
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
                        {review.isFlagged && <Badge variant="destructive">Flagged</Badge>}
                      </div>
                      {review.title && <h4 className="font-medium mb-1">{review.title}</h4>}
                      <p className="text-gray-600 text-sm mb-2">{review.comment}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>By: {review.user?.firstName} {review.user?.lastName}</span>
                        <span>Property: {review.property?.name}</span>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                      {review.ownerReply && (
                        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 mb-1">Owner Reply:</p>
                          <p className="text-sm">{review.ownerReply}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 sm:ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => flagMutation.mutate({ id: review.id, isFlagged: !review.isFlagged })}
                        className={review.isFlagged ? 'text-red-500' : 'text-gray-400'}
                      >
                        <Flag size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteModal(review.id)} className="text-red-500">
                        <Trash2 size={16} />
                      </Button>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Review"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteModal && deleteMutation.mutate(deleteModal)}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete this review? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
