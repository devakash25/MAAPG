import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, getInitials } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Ban, Star, MapPin } from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-orange-100 text-orange-800',
  UNPUBLISHED: 'bg-purple-100 text-purple-800',
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyApi.getById(id!).then(res => res.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: () => propertyApi.approve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      addToast('Property approved successfully', 'success');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => propertyApi.reject(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      addToast('Property rejected', 'success');
      setRejectModal(false);
      setRejectReason('');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => propertyApi.suspend(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      addToast('Property suspended', 'success');
    },
  });

  const featureMutation = useMutation({
    mutationFn: (isFeatured: boolean) => propertyApi.feature(id!, isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      addToast('Property updated', 'success');
    },
  });

  if (isLoading) {
    return <div className="space-y-4 md:space-y-6 animate-fade-in">{[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white rounded-lg animate-pulse" />)}</div>;
  }

  if (!property) {
    return <div className="text-center py-12">Property not found</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)} className="self-start">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">Property Details</h1>
          <p className="text-gray-500 text-sm">{property.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {property.status === 'PENDING_VERIFICATION' && (
            <>
              <Button onClick={() => approveMutation.mutate()} className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={16} className="mr-2" /> Approve
              </Button>
              <Button variant="destructive" onClick={() => setRejectModal(true)}>
                <XCircle size={16} className="mr-2" /> Reject
              </Button>
            </>
          )}
          {property.status === 'ACTIVE' && (
            <>
              <Button variant="outline" onClick={() => featureMutation.mutate(!property.isFeatured)}>
                <Star size={16} className={`mr-2 ${property.isFeatured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                {property.isFeatured ? 'Unfeature' : 'Feature'}
              </Button>
              <Button variant="destructive" onClick={() => suspendMutation.mutate()}>
                <Ban size={16} className="mr-2" /> Suspend
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Property Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                {property.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-bold truncate">{property.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-1">{property.description}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline">{property.propertyType}</Badge>
                  <Badge className={statusColors[property.status]}>{property.status?.replace('_', ' ')}</Badge>
                  {property.isFeatured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-sm">{property.address}, {property.city}, {property.state}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pincode</p>
                <p className="font-medium">{property.pincode || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-medium">{property.rating || 'N/A'} ({property._count?.reviews || 0} reviews)</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Verification Level</p>
                <p className="font-medium">{property.verificationLevel || 'UNVERIFIED'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="font-medium">{formatCurrency(Number(property.totalRevenue || 0))}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="font-medium">{property.totalBookings || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl md:text-3xl font-bold text-primary">{property._count?.rooms || 0}</p>
                <p className="text-sm text-gray-500">Rooms</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{property._count?.bookings || 0}</p>
                <p className="text-sm text-gray-500">Bookings</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl md:text-3xl font-bold text-green-600">{property._count?.reviews || 0}</p>
                <p className="text-sm text-gray-500">Reviews</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl md:text-3xl font-bold text-yellow-600">{property._count?.wishlists || 0}</p>
                <p className="text-sm text-gray-500">Wishlists</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dealer Info */}
      {property.dealer && (
        <Card>
          <CardHeader>
            <CardTitle>Dealer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                {getInitials(property.dealer.user?.firstName || 'D', property.dealer.user?.lastName || '')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{property.dealer.businessName}</p>
                <p className="text-sm text-gray-500 truncate">{property.dealer.user?.email}</p>
              </div>
              <Badge className={`flex-shrink-0 ${statusColors[property.dealer.status] || 'bg-gray-100'}`}>
                {property.dealer.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rooms */}
      {property.rooms?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rooms ({property.rooms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Room</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Capacity</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Price/Night</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Beds</th>
                  </tr>
                </thead>
                <tbody>
                  {property.rooms.map((room: any) => (
                    <tr key={room.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{room.name}</td>
                      <td className="py-3 px-4"><Badge variant="outline">{room.roomType}</Badge></td>
                      <td className="py-3 px-4">{room.capacity}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(Number(room.pricePerNight))}</td>
                      <td className="py-3 px-4 text-right">{room.beds?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {property.reviews?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {property.reviews.map((review: any) => (
                <div key={review.id} className="border rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < Math.floor(Number(review.rating)) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{review.rating}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      by {review.user?.firstName} {review.user?.lastName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  {review.ownerReply && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 mb-1">Owner Reply:</p>
                      <p className="text-sm">{review.ownerReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal}
        onClose={() => { setRejectModal(false); setRejectReason(''); }}
        title="Reject Property"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate(rejectReason)} disabled={!rejectReason.trim()}>
              Reject
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium mb-1">Reason for rejection</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Enter reason..."
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </Modal>
    </div>
  );
}
