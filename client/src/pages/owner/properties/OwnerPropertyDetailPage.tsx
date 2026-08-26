import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/helpers';
import { ArrowLeft, Send, Star, MapPin, Bed } from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-orange-100 text-orange-800',
};

export default function OwnerPropertyDetailPage() {
  const [replyText, setReplyText] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const propertyId = window.location.pathname.split('/').pop() || '';

  const { data: property, isLoading } = useQuery({
    queryKey: ['ownerProperty', propertyId],
    queryFn: () => ownerApi.getProperty(propertyId).then(res => res.data.data),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['ownerPropertyReviews', propertyId],
    queryFn: () => ownerApi.getReviews({ propertyId }).then(res => res.data),
  });

  const submitMutation = useMutation({
    mutationFn: () => ownerApi.submitProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerProperty', propertyId] });
      addToast('Property submitted for review', 'success');
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      ownerApi.replyToReview(reviewId, { ownerReply: reply }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerPropertyReviews'] });
      setReplyText('');
      addToast('Reply posted', 'success');
    },
  });

  if (isLoading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-card rounded-lg animate-pulse" />)}</div>;
  if (!property) return <div className="text-center py-12">Property not found</div>;

  const reviews = reviewsData?.data || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="self-start">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">{property.name}</h1>
          <p className="text-gray-500 text-sm">{property.propertyType} • {property.city}, {property.state}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge className={statusColors[property.status]}>{property.status?.replace('_', ' ')}</Badge>
          {property.status === 'DRAFT' && (
            <Button size="sm" onClick={() => submitMutation.mutate()}>
              <Send size={14} className="mr-1" /> Submit for Review
            </Button>
          )}
        </div>
      </div>

      {/* Property Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Property Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-sm">{property.address}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="font-medium flex items-center gap-1">
                  {property.rating ? <><Star size={14} className="text-yellow-500 fill-yellow-500" /> {Number(property.rating).toFixed(1)}</> : 'N/A'}
                  <span className="text-gray-400 text-xs ml-1">({property.totalReviews || 0} reviews)</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="font-medium">{formatCurrency(Number(property.totalRevenue || 0))}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="font-medium">{property.totalBookings || 0}</p>
              </div>
            </div>
            {property.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{property.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">{property.rooms?.length || 0}</p>
                <p className="text-sm text-gray-500">Rooms</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{property._count?.bookings || 0}</p>
                <p className="text-sm text-gray-500">Bookings</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{property._count?.enquiries || 0}</p>
                <p className="text-sm text-gray-500">Enquiries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms */}
      {property.rooms?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Rooms ({property.rooms.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {property.rooms.map((room: any) => (
                <div key={room.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{room.name}</p>
                    <Badge variant={room.isActive ? 'success' : 'secondary'}>{room.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Type: {room.roomType || 'N/A'}</p>
                    <p className="flex items-center gap-1"><Bed size={12} /> {room.availableBeds}/{room.totalBeds} beds available</p>
                    {room.pricePerNight && <p>₹{room.pricePerNight}/night</p>}
                    {room.pricePerMonth && <p>₹{room.pricePerMonth}/month</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amenities */}
      {property.amenities?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a: any) => (
                <span key={a.id} className="px-3 py-1 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 rounded-full text-sm">{a.name}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Reviews</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < Math.floor(Number(review.rating)) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{review.rating}</span>
                    <span className="text-sm text-gray-500 ml-2">by {review.user?.firstName} {review.user?.lastName}</span>
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 mb-2">{review.comment}</p>}
                  {review.ownerReply && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 mb-1">Your Reply:</p>
                      <p className="text-sm">{review.ownerReply}</p>
                    </div>
                  )}
                  {!review.ownerReply && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => replyMutation.mutate({ reviewId: review.id, reply: replyText })}
                        disabled={!replyText.trim()}
                      >
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
