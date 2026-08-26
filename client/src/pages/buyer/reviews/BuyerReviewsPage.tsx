import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerApi } from '@/services';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useThemeStore } from '@/store/themeStore';
import { cn, formatDate } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import {
  Star,
  Home,
  ChevronLeft,
  ChevronRight,
  PenLine,
  BarChart3,
} from 'lucide-react';

export default function BuyerReviewsPage() {
  const { theme } = useThemeStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    comment: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['buyerReviews', page],
    queryFn: () =>
      buyerApi.getReviews({ page, limit: 10 }).then((res) => res.data),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['buyerBookingsForReview'],
    queryFn: () =>
      buyerApi
        .getBookings({ status: 'COMPLETED', limit: 50 })
        .then((res) => res.data),
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: any) => buyerApi.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerReviews'] });
      addToast('Review submitted successfully', 'success');
      setReviewModal(false);
      setSelectedBooking(null);
      setReviewForm({ rating: 0, title: '', comment: '' });
    },
    onError: () => addToast('Failed to submit review', 'error'),
  });

  const reviews = data?.data || [];
  const pagination = data?.pagination;
  const completedBookings = bookingsData?.data || [];

  const stats = {
    total: pagination?.total || 0,
    average:
      reviews.length > 0
        ? (
            reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0) /
            reviews.length
          ).toFixed(1)
        : '0.0',
  };

  const handleOpenReviewModal = (booking: any) => {
    setSelectedBooking(booking);
    setReviewForm({ rating: 0, title: '', comment: '' });
    setReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!reviewForm.rating || !reviewForm.comment.trim()) return;
    createReviewMutation.mutate({
      propertyId: selectedBooking?.property?.id,
      bookingId: selectedBooking?.id,
      rating: reviewForm.rating,
      title: reviewForm.title.trim(),
      comment: reviewForm.comment.trim(),
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0f172a] dark:text-white">
            My Reviews
          </h1>
          <p className="text-gray-500 text-sm">Your reviews and feedback</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sky-500">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0f172a] dark:text-white">
                {stats.total}
              </p>
              <p className="text-xs text-gray-500">Total Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-amber-500">
              <Star size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0f172a] dark:text-white">
                {stats.average}
              </p>
              <p className="text-xs text-gray-500">Average Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0f172a] dark:text-white">
              Your Reviews
            </h2>
            {completedBookings.length > 0 && (
              <Button
                size="sm"
                onClick={() => handleOpenReviewModal(completedBookings[0])}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <PenLine size={14} className="mr-1" /> Write Review
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Star size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                No reviews yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Complete a booking to share your experience
              </p>
              {completedBookings.length > 0 && (
                <Button
                  onClick={() => handleOpenReviewModal(completedBookings[0])}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  <PenLine size={14} className="mr-1" /> Write Your First Review
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="border rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-sky-900/10 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Property Image */}
                      <div className="w-full sm:w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                        {review.property?.images?.[0]?.url ? (
                          <img
                            src={review.property.images[0].url}
                            alt={review.property?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home size={24} className="text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h4 className="font-semibold text-[#0f172a] dark:text-white truncate">
                            {review.property?.name || 'Property'}
                          </h4>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < Math.floor(Number(review.rating))
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-gray-300'
                                }
                              />
                            ))}
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-1">
                              {review.rating}
                            </span>
                          </div>
                        </div>

                        {review.title && (
                          <p className="font-medium text-sm text-[#0f172a] dark:text-white mb-1">
                            {review.title}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {review.comment}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(review.createdAt)}
                        </p>

                        {/* Owner Reply */}
                        {review.ownerReply && (
                          <div className="mt-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-100 dark:border-sky-800/30">
                            <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
                              Owner Reply:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {review.ownerReply}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pagination && pagination.total > 10 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t gap-3">
                  <p className="text-sm text-gray-500">
                    Showing {(page - 1) * 10 + 1} to{' '}
                    {Math.min(page * 10, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft size={14} className="mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Write Review Modal */}
      <Modal
        isOpen={reviewModal}
        onClose={() => {
          setReviewModal(false);
          setSelectedBooking(null);
        }}
        title="Write a Review"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setReviewModal(false);
                setSelectedBooking(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={
                !reviewForm.rating ||
                !reviewForm.comment.trim() ||
                createReviewMutation.isPending
              }
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedBooking && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                {selectedBooking.property?.images?.[0]?.url ? (
                  <img
                    src={selectedBooking.property.images[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home size={20} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-sm text-[#0f172a] dark:text-white">
                  {selectedBooking.property?.name}
                </p>
                <p className="text-xs text-gray-500">
                  Booking completed
                </p>
              </div>
            </div>
          )}

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0f172a] dark:text-white">
              Rating *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                  className="p-0.5 transition-colors"
                >
                  <Star
                    size={28}
                    className={
                      star <= reviewForm.rating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-gray-300 hover:text-amber-400'
                    }
                  />
                </button>
              ))}
              {reviewForm.rating > 0 && (
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {reviewForm.rating}/5
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0f172a] dark:text-white">
              Title
            </label>
            <input
              type="text"
              value={reviewForm.title}
              onChange={(e) =>
                setReviewForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Summarize your experience"
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20',
                theme === 'dark'
                  ? 'bg-[#1e293b] border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200'
              )}
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#0f172a] dark:text-white">
              Your Review *
            </label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) =>
                setReviewForm((f) => ({ ...f, comment: e.target.value }))
              }
              placeholder="Share details about your experience with this property..."
              rows={4}
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20',
                theme === 'dark'
                  ? 'bg-[#1e293b] border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200'
              )}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
