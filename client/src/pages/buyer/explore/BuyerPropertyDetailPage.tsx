import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { buyerApi } from '@/services';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useThemeStore } from '@/store/themeStore';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/helpers';
import {
  Star, MapPin, Phone, MessageSquare, Calendar, Heart, ShieldCheck,
  BadgeCheck, Users, Bed, Wifi, Car, Utensils, WashingMachine,
  Snowflake, Tv, Lock, Dumbbell, Wind, Zap, Camera, ChevronLeft,
  ChevronRight, Home, DoorOpen, ArrowRight, ThumbsUp, ImageIcon, Bath,
  Sofa, BookOpen, ClipboardList, Map, LayoutGrid, TrendingUp,
  CheckCircle,
} from 'lucide-react';

type Tab = 'overview' | 'rooms' | 'amenities' | 'reviews' | 'rules' | 'location' | 'similar';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'rooms', label: 'Rooms', icon: Bed },
  { id: 'amenities', label: 'Amenities', icon: Wifi },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'rules', label: 'Rules', icon: ClipboardList },
  { id: 'location', label: 'Location', icon: Map },
  { id: 'similar', label: 'Similar', icon: LayoutGrid },
];

const amenityIcons: Record<string, any> = {
  wifi: Wifi, parking: Car, food: Utensils, laundry: WashingMachine,
  ac: Snowflake, tv: Tv, security: Lock, gym: Dumbbell, fan: Wind,
  power: Zap, cctv: Camera,
};

const propertyTypeLabels: Record<string, string> = {
  HOTEL: 'Hotel', HOSTEL: 'Hostel', PG: 'Paying Guest',
  RENTAL_ROOM: 'Rental Room', APARTMENT: 'Apartment', GUEST_HOUSE: 'Guest House',
};

export default function BuyerPropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useThemeStore();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const [enquiryForm, setEnquiryForm] = useState({
    moveInDate: '', budget: '', duration: '', message: '',
  });

  const [bookingForm, setBookingForm] = useState({
    checkIn: '', checkOut: '', guests: '1', specialRequests: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['buyerProperty', id],
    queryFn: () => buyerApi.getProperty(id!).then(res => res.data.data),
    enabled: !!id,
  });

  const wishlistMutation = useMutation({
    mutationFn: () => buyerApi.toggleWishlist(id!),
    onSuccess: (res) => {
      queryClient.setQueryData(['buyerProperty', id], (old: any) => {
        if (!old) return old;
        return { ...old, property: { ...old.property, isWishlisted: res.data.data.isWishlisted } };
      });
      addToast(res.data.data.isWishlisted ? 'Added to wishlist' : 'Removed from wishlist', 'success');
    },
    onError: () => addToast('Failed to update wishlist', 'error'),
  });

  const enquiryMutation = useMutation({
    mutationFn: (data: any) => buyerApi.createEnquiry({ ...data, propertyId: id }),
    onSuccess: () => {
      addToast('Enquiry sent successfully!', 'success');
      setShowEnquiryModal(false);
      setEnquiryForm({ moveInDate: '', budget: '', duration: '', message: '' });
    },
    onError: () => addToast('Failed to send enquiry', 'error'),
  });

  const bookingMutation = useMutation({
    mutationFn: (data: any) => buyerApi.createBooking(data),
    onSuccess: () => {
      addToast('Booking request submitted!', 'success');
      setShowBookingModal(false);
      setBookingForm({ checkIn: '', checkOut: '', guests: '1', specialRequests: '' });
      setSelectedRoom(null);
    },
    onError: () => addToast('Failed to submit booking', 'error'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl mx-auto">
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const property = data?.property;
  const similarProperties = data?.similarProperties || [];

  if (!property) {
    return (
      <div className="text-center py-20">
        <Home size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Property not found</h2>
        <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const images = property.images || [];
  const rooms = property.rooms || [];
  const amenities = property.amenities || [];
  const reviews = property.reviews || [];
  const rules = property.rules || [];
  const lowestPrice = rooms.length > 0
    ? Math.min(...rooms.map((r: any) => Number(r.pricePerMonth || r.pricePerNight || 0)))
    : null;

  const averageRating = property.averageRating
    ? Number(property.averageRating)
    : reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / reviews.length
      : 0;

  const handleEnquirySubmit = () => {
    if (!enquiryForm.message.trim()) {
      addToast('Please enter a message', 'error');
      return;
    }
    enquiryMutation.mutate(enquiryForm);
  };

  const handleBookingSubmit = () => {
    if (!bookingForm.checkIn || !bookingForm.checkOut) {
      addToast('Please select check-in and check-out dates', 'error');
      return;
    }
    bookingMutation.mutate({
      propertyId: id,
      roomId: selectedRoom?.id,
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      guests: Number(bookingForm.guests),
      specialRequests: bookingForm.specialRequests,
    });
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={16}
          className={cn(
            'transition-colors',
            i <= Math.round(rating)
              ? 'text-amber-500 fill-amber-500'
              : 'text-gray-300 dark:text-gray-600'
          )}
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-sky-600 transition-colors"
      >
        <ChevronLeft size={16} /> Back to listings
      </button>

      {/* Photo Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 rounded-xl overflow-hidden">
          <div className="lg:col-span-2 relative h-80 lg:h-[420px] bg-gray-200 dark:bg-gray-800">
            <img
              src={images[selectedImageIndex]?.url}
              alt={property.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(i => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(i => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <ImageIcon size={14} /> {selectedImageIndex + 1}/{images.length}
            </div>
          </div>
          <div className="hidden lg:grid grid-rows-2 gap-2">
            {images.slice(1, 3).map((img: any, i: number) => (
              <div
                key={i}
                className="relative bg-gray-200 dark:bg-gray-800 cursor-pointer overflow-hidden"
                onClick={() => setSelectedImageIndex(i + 1)}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                {i === 1 && images.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xl font-semibold">+{images.length - 3} more</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Property Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-[#0f172a] dark:text-white">{property.name}</h1>
            <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full text-xs font-medium">
              {propertyTypeLabels[property.propertyType] || property.propertyType}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {averageRating > 0 && (
              <div className="flex items-center gap-1.5">
                {renderStars(averageRating)}
                <span className="font-semibold text-sm text-gray-800 dark:text-white">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={14} />
              {property.address || property.city}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {property.ownerPhone && (
            <Button variant="outline" onClick={() => window.open(`tel:${property.ownerPhone}`)}>
              <Phone size={16} className="mr-2" /> Contact Owner
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowEnquiryModal(true)}>
            <MessageSquare size={16} className="mr-2" /> Enquire Now
          </Button>
          <Button onClick={() => setShowBookingModal(true)}>
            <Calendar size={16} className="mr-2" /> Book Now
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => wishlistMutation.mutate()}
            disabled={wishlistMutation.isPending}
          >
            <Heart
              size={20}
              className={cn(
                'transition-colors',
                property.isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'
              )}
            />
          </Button>
        </div>
      </div>

      {/* Price */}
      {lowestPrice !== null && (
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Starting from</p>
            <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">
              ₹{lowestPrice.toLocaleString()}<span className="text-sm font-normal text-gray-500">/month</span>
            </p>
          </div>
          <Button onClick={() => setShowBookingModal(true)} className="px-8">
            Book Now <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                <Icon size={16} /> {tab.label}
                {tab.id === 'reviews' && reviews.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 rounded-full text-xs">
                    {reviews.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#0f172a] dark:text-white mb-3">About this property</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {property.description || 'No description available for this property.'}
                </p>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3">
              {property.owner?.isVerified && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800">
                  <ShieldCheck size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Verified Owner</span>
                </div>
              )}
              {property.isVerified && (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                  <BadgeCheck size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Verified Property</span>
                </div>
              )}
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Rooms', value: rooms.length, icon: Bed },
                { label: 'Amenities', value: amenities.length, icon: Wifi },
                { label: 'Reviews', value: reviews.length, icon: Star },
                { label: 'Rating', value: averageRating > 0 ? averageRating.toFixed(1) : 'N/A', icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-800">
                  <Icon size={20} className="mx-auto text-sky-500 mb-2" />
                  <p className="text-xl font-bold text-[#0f172a] dark:text-white">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            {rooms.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DoorOpen size={40} className="mx-auto mb-3 text-gray-400" />
                <p>No rooms available</p>
              </div>
            ) : (
              rooms.map((room: any) => (
                <Card key={room.id} className={cn('transition-all', selectedRoom?.id === room.id && 'ring-2 ring-sky-500')}>
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[#0f172a] dark:text-white">{room.name}</h4>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded-full text-gray-600 dark:text-gray-400">
                            {room.roomType || 'Standard'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {room.bedType && (
                            <span className="flex items-center gap-1"><Bed size={14} /> {room.bedType}</span>
                          )}
                          {room.capacity && (
                            <span className="flex items-center gap-1"><Users size={14} /> {room.capacity} guests</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {room.hasAc && (
                            <span className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                              <Snowflake size={12} /> AC
                            </span>
                          )}
                          {room.hasBathroom && (
                            <span className="flex items-center gap-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                              <Bath size={12} /> Private Bath
                            </span>
                          )}
                          {room.isFurnished && (
                            <span className="flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
                              <Sofa size={12} /> Furnished
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                            ₹{Number(room.pricePerMonth || room.pricePerNight || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">/month</p>
                        </div>
                        <Button
                          size="sm"
                          variant={selectedRoom?.id === room.id ? 'default' : 'outline'}
                          onClick={() => {
                            setSelectedRoom(room);
                            setShowBookingModal(true);
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === 'amenities' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {amenities.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Wifi size={40} className="mx-auto mb-3 text-gray-400" />
                <p>No amenities listed</p>
              </div>
            ) : (
              amenities.map((amenity: any, i: number) => {
                const Icon = amenityIcons[amenity.name?.toLowerCase()] || CheckCircle;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-sky-600 dark:text-sky-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{amenity.name}</span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {reviews.length > 0 && (
              <Card>
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-[#0f172a] dark:text-white">{averageRating.toFixed(1)}</p>
                    {renderStars(averageRating)}
                    <p className="text-sm text-gray-500 mt-1">{reviews.length} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter((r: any) => Math.round(Number(r.rating)) === star).length;
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="w-6 text-right text-gray-500">{star}</span>
                          <Star size={12} className="text-amber-500 fill-amber-500" />
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-xs text-gray-500">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Star size={40} className="mx-auto mb-3 text-gray-400" />
                <p>No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center text-sm font-semibold text-sky-600">
                            {review.user?.firstName?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-[#0f172a] dark:text-white">
                              {review.user?.firstName} {review.user?.lastName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {renderStars(Number(review.rating))}
                              <span className="text-xs text-gray-500">
                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm"><ThumbsUp size={14} /></Button>
                      </div>
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                      {review.ownerReply && (
                        <div className="mt-3 ml-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                          <p className="text-xs font-medium text-gray-500 mb-1">Owner Reply</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{review.ownerReply}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <Card>
            <CardContent className="p-6">
              {rules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ClipboardList size={40} className="mx-auto mb-3 text-gray-400" />
                  <p>No rules specified</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {rules.map((rule: any, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-0.5 w-6 h-6 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center text-xs font-medium text-sky-600 flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{typeof rule === 'string' ? rule : rule.text || rule.rule || JSON.stringify(rule)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-sky-500" />
                <span className="font-medium text-[#0f172a] dark:text-white">
                  {property.address || property.city || 'Location not available'}
                </span>
              </div>
              {property.latitude && property.longitude ? (
                <div className="w-full h-72 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden">
                  <iframe
                    title="Property Location"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=demo&q=${property.latitude},${property.longitude}`}
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="h-72 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Map size={40} className="mx-auto mb-2 text-gray-400" />
                    <p>Map location not available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Similar Properties Tab */}
        {activeTab === 'similar' && (
          <div>
            {similarProperties.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <LayoutGrid size={40} className="mx-auto mb-3 text-gray-400" />
                <p>No similar properties found</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {similarProperties.map((sp: any) => {
                  const spPrice = sp.rooms?.[0]?.pricePerMonth || sp.rooms?.[0]?.pricePerNight;
                  return (
                    <div
                      key={sp.id}
                      onClick={() => navigate(`/buyer/property/${sp.id}`)}
                      className="min-w-[260px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-lg transition-all flex-shrink-0"
                    >
                      <div className="h-40 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        {sp.images?.[0]?.url ? (
                          <img src={sp.images[0].url} alt={sp.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home size={32} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-[#0f172a] dark:text-white truncate">{sp.name}</h4>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <MapPin size={12} /> {sp.city}
                        </div>
                        {sp.averageRating && (
                          <div className="flex items-center gap-1 mt-1 text-xs">
                            <Star size={12} className="text-amber-500 fill-amber-500" />
                            <span className="font-medium">{Number(sp.averageRating).toFixed(1)}</span>
                          </div>
                        )}
                        {spPrice && (
                          <p className="mt-2 font-bold text-sky-600 dark:text-sky-400 text-sm">
                            ₹{Number(spPrice).toLocaleString()}<span className="text-xs font-normal text-gray-500">/mo</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      <Modal
        isOpen={showEnquiryModal}
        onClose={() => setShowEnquiryModal(false)}
        title="Send Enquiry"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEnquiryModal(false)}>Cancel</Button>
            <Button onClick={handleEnquirySubmit} disabled={enquiryMutation.isPending}>
              {enquiryMutation.isPending ? 'Sending...' : 'Send Enquiry'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Move-in Date</label>
            <Input
              type="date"
              value={enquiryForm.moveInDate}
              onChange={e => setEnquiryForm(f => ({ ...f, moveInDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget (₹/month)</label>
            <Input
              type="number"
              placeholder="e.g. 10000"
              value={enquiryForm.budget}
              onChange={e => setEnquiryForm(f => ({ ...f, budget: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
            <Input
              placeholder="e.g. 6 months"
              value={enquiryForm.duration}
              onChange={e => setEnquiryForm(f => ({ ...f, duration: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
            <textarea
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]'
              )}
              placeholder="Tell the owner about your requirements..."
              value={enquiryForm.message}
              onChange={e => setEnquiryForm(f => ({ ...f, message: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => { setShowBookingModal(false); setSelectedRoom(null); }}
        title="Book Property"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowBookingModal(false); setSelectedRoom(null); }}>Cancel</Button>
            <Button onClick={handleBookingSubmit} disabled={bookingMutation.isPending}>
              {bookingMutation.isPending ? 'Submitting...' : 'Confirm Booking'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!selectedRoom && rooms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Room</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rooms.map((room: any) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      'p-4 text-left rounded-xl border-2 transition-all',
                      selectedRoom?.id === room.id
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                    )}
                  >
                    <p className="font-medium text-[#0f172a] dark:text-white">{room.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      ₹{Number(room.pricePerMonth || room.pricePerNight || 0).toLocaleString()}/mo
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedRoom && (
            <div className="flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl">
              <div>
                <p className="font-medium text-[#0f172a] dark:text-white">{selectedRoom.name}</p>
                <p className="text-sm text-gray-500">
                  ₹{Number(selectedRoom.pricePerMonth || selectedRoom.pricePerNight || 0).toLocaleString()}/mo
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRoom(null)}>Change</Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Check-in Date</label>
              <Input
                type="date"
                value={bookingForm.checkIn}
                onChange={e => setBookingForm(f => ({ ...f, checkIn: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Check-out Date</label>
              <Input
                type="date"
                value={bookingForm.checkOut}
                onChange={e => setBookingForm(f => ({ ...f, checkOut: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Guests</label>
            <Input
              type="number"
              min="1"
              max="10"
              value={bookingForm.guests}
              onChange={e => setBookingForm(f => ({ ...f, guests: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Special Requests</label>
            <textarea
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]'
              )}
              placeholder="Any special requirements..."
              value={bookingForm.specialRequests}
              onChange={e => setBookingForm(f => ({ ...f, specialRequests: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
