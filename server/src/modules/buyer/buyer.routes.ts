import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { User, Booking, Enquiry, Wishlist, WishlistCollection, WishlistCollectionItem, Review, Conversation, Payment, Notification, SavedSearch, SavedLocation, BuyerProfile, Dealer, Property, Room, Bed } from '../../models';

const router = Router();

router.use(authenticate);
router.use(authorize('CUSTOMER', 'DEALER'));

function qs(val: unknown): string | undefined {
  if (typeof val === 'string' && val.trim()) return val.trim();
  return undefined;
}

function paginateMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 };
}

// ─── DASHBOARD ──────────────────────────────────────
router.get('/dashboard', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const [totalBookings, upcomingBookings, activeBookings, completedBookings, totalEnquiries, totalWishlist, totalReviews, recentBookings, recentNotifications, recommendedProperties, popularProperties, propertyTypes] = await Promise.all([
    Booking.countDocuments({ userId }),
    Booking.countDocuments({ userId, bookingStatus: 'CONFIRMED', checkIn: { $gte: new Date() } }),
    Booking.countDocuments({ userId, bookingStatus: 'CONFIRMED', checkIn: { $lte: new Date() }, checkOut: { $gte: new Date() } }),
    Booking.countDocuments({ userId, bookingStatus: 'COMPLETED' }),
    Enquiry.countDocuments({ userId }),
    Wishlist.countDocuments({ userId }),
    Review.countDocuments({ userId }),
    Booking.find({ userId })
      .populate({ path: 'propertyId', select: 'id name city propertyType', populate: { path: 'images', match: { isPrimary: true } } })
      .sort({ createdAt: 'desc' }).limit(5).lean(),
    Notification.find({ userId }).sort({ createdAt: 'desc' }).limit(5).lean(),
    Property.find({ status: 'ACTIVE' })
      .populate({ path: 'images', match: { isPrimary: true } })
      .sort({ createdAt: 'desc' }).limit(8).lean(),
    Property.find({ status: 'ACTIVE' })
      .populate({ path: 'images', match: { isPrimary: true } })
      .sort({ totalBookings: -1 }).limit(8).lean(),
    Property.aggregate([{ $match: { status: 'ACTIVE' } }, { $group: { _id: '$propertyType', count: { $sum: 1 } } }]),
  ]);

  const totalSpent = await Booking.aggregate([
    { $match: { userId, bookingStatus: { $in: ['CONFIRMED', 'COMPLETED'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  const user = await User.findById(userId).select('firstName lastName').lean();

  ApiResponse.success(res, {
    user, stats: { totalBookings, upcomingBookings, activeBookings, completedBookings, totalEnquiries, totalWishlist, totalReviews, totalSpent: totalSpent[0]?.total || 0 },
    recentBookings, recentNotifications, recommendedProperties, popularProperties,
    propertyTypes: propertyTypes.map(pt => ({ type: pt._id, count: pt.count })),
  });
});

// ─── EXPLORE ────────────────────────────────────────
router.get('/explore', async (req: Request, res: Response) => {
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '12');
  const search = qs(req.query.search);
  const city = qs(req.query.city);
  const propertyType = qs(req.query.propertyType);
  const sort = qs(req.query.sort) || 'recommended';

  const where: any = { status: 'ACTIVE' };
  if (search) {
    where.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }
  if (city) where.city = { $regex: city, $options: 'i' };
  if (propertyType) where.propertyType = propertyType;

  let sortObj: any = { createdAt: -1 };
  if (sort === 'rating') sortObj = { rating: -1 };
  if (sort === 'popular') sortObj = { totalBookings: -1 };

  const [data, total] = await Promise.all([
    Property.find(where)
      .populate({ path: 'images', match: { isPrimary: true } })
      .populate('rooms', 'pricePerNight pricePerMonth')
      .populate('reviews', 'rating')
      .populate('dealerId', 'businessName')
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum).limit(limitNum)
      .lean(),
    Property.countDocuments(where),
  ]);

  const properties = data.map((p: any) => {
    const avgReview = p.reviews?.length > 0 ? p.reviews.reduce((s: number, r: any) => s + parseFloat(r.rating), 0) / p.reviews.length : null;
    const price = p.rooms?.[0]?.pricePerMonth || p.rooms?.[0]?.pricePerNight || null;
    return { ...p, averageRating: avgReview, startingPrice: price, totalReviews: p.reviews?.length || 0 };
  });

  ApiResponse.success(res, { data: properties, pagination: paginateMeta(total, pageNum, limitNum) });
});

// ─── PROPERTY DETAIL ────────────────────────────────
router.get('/properties/:id', async (req: Request, res: Response) => {
  const property = await Property.findById(req.params.id)
    .populate({ path: 'dealerId', select: 'id businessName businessPhone businessEmail rating totalReviews verificationLevel' })
    .populate('images')
    .populate({ path: 'rooms', populate: [{ path: 'beds' }, { path: 'images' }, { path: 'availability' }], match: { isActive: true } })
    .populate('amenities')
    .populate('rules')
    .populate({ path: 'reviews', populate: { path: 'userId', select: 'firstName lastName' }, options: { sort: { createdAt: -1 }, limit: 10 } })
    .lean();

  if (!property) throw ApiError.notFound('Property not found');

  const userId = req.user!.userId;
  const [wishlistItem, enquiryItem] = await Promise.all([
    Wishlist.findOne({ userId, propertyId: property._id }),
    Enquiry.findOne({ userId, propertyId: property._id }).sort({ createdAt: -1 }),
  ]);

  const avgReview = (property as any).reviews?.length > 0
    ? (property as any).reviews.reduce((s: number, r: any) => s + parseFloat(r.rating), 0) / (property as any).reviews.length
    : null;

  const similarProperties = await Property.find({ _id: { $ne: property._id }, status: 'ACTIVE', propertyType: property.propertyType, city: property.city })
    .populate({ path: 'images', match: { isPrimary: true } })
    .limit(4).lean();

  ApiResponse.success(res, {
    property: { ...property, averageRating: avgReview, totalReviews: (property as any).reviews?.length || 0, isWishlisted: !!wishlistItem, lastEnquiry: enquiryItem },
    similarProperties,
  });
});

// ─── WISHLIST ───────────────────────────────────────
router.get('/wishlist', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '20');

  const where: any = { userId };
  const [data, total] = await Promise.all([
    Wishlist.find(where).populate({ path: 'propertyId', populate: [{ path: 'images', match: { isPrimary: true } }, { path: 'rooms', select: 'pricePerMonth pricePerNight' }, { path: 'reviews', select: 'rating' }] }).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Wishlist.countDocuments(where),
  ]);

  ApiResponse.success(res, { data, pagination: paginateMeta(total, pageNum, limitNum) });
});

router.post('/wishlist/:propertyId', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const existing = await Wishlist.findOne({ userId, propertyId: req.params.propertyId });
  if (existing) {
    await Wishlist.findByIdAndDelete(existing._id);
    ApiResponse.success(res, { wishlisted: false });
    return;
  }
  await Wishlist.create({ userId, propertyId: req.params.propertyId as string });
  ApiResponse.success(res, { wishlisted: true });
});

// ─── WISHLIST COLLECTIONS ───────────────────────────
router.get('/collections', async (req: Request, res: Response) => {
  const collections = await WishlistCollection.find({ userId: req.user!.userId })
    .populate({ path: 'items', populate: { path: 'propertyId', populate: { path: 'images', match: { isPrimary: true } } } })
    .sort({ createdAt: 'desc' }).lean();
  ApiResponse.success(res, collections);
});

router.post('/collections', async (req: Request, res: Response) => {
  const { name, icon } = req.body;
  const collection = await WishlistCollection.create({ userId: req.user!.userId, name, icon });
  ApiResponse.created(res, collection);
});

router.post('/collections/:collectionId/items', async (req: Request, res: Response) => {
  const { propertyId } = req.body;
  const item = await WishlistCollectionItem.create({ collectionId: req.params.collectionId as string, propertyId });
  ApiResponse.created(res, item);
});

router.delete('/collections/:collectionId/items/:propertyId', async (req: Request, res: Response) => {
  await WishlistCollectionItem.deleteMany({ collectionId: req.params.collectionId, propertyId: req.params.propertyId });
  ApiResponse.success(res, { deleted: true });
});

// ─── BOOKINGS ───────────────────────────────────────
router.get('/bookings', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '10');
  const status = qs(req.query.status);

  const where: any = { userId };
  if (status) where.bookingStatus = status;

  const [data, total] = await Promise.all([
    Booking.find(where)
      .populate({ path: 'propertyId', select: 'id name city address propertyType contactPhone', populate: { path: 'images', match: { isPrimary: true } } })
      .populate('roomId', 'id name roomType bedType')
      .populate('payment')
      .sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Booking.countDocuments(where),
  ]);

  ApiResponse.success(res, { data, pagination: paginateMeta(total, pageNum, limitNum) });
});

router.get('/bookings/:id', async (req: Request, res: Response) => {
  const booking = await Booking.findById(req.params.id)
    .populate({ path: 'propertyId', populate: [{ path: 'images', match: { isPrimary: true } }, { path: 'dealerId', select: 'businessName businessPhone' }] })
    .populate({ path: 'roomId', populate: { path: 'images' } })
    .populate('payment')
    .populate('review')
    .populate('userId', 'firstName lastName email phone')
    .lean();
  if (!booking) throw ApiError.notFound('Booking not found');
  if ((booking as any).userId._id.toString() !== req.user!.userId) throw ApiError.forbidden('Access denied');
  ApiResponse.success(res, booking);
});

router.post('/bookings', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { propertyId, roomId, bedId, checkIn, checkOut, guests, specialRequests } = req.body;

  const property = await Property.findById(propertyId);
  if (!property) throw ApiError.notFound('Property not found');

  let totalAmount = 0;
  if (roomId) {
    const room = await Room.findById(roomId);
    if (!room) throw ApiError.notFound('Room not found');
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    totalAmount = Number(room.pricePerNight || 0) * nights;
    if (totalAmount === 0 && room.pricePerMonth) totalAmount = Number(room.pricePerMonth || 0) * (nights / 30);
  }

  const booking = await Booking.create({
    userId, propertyId, roomId: roomId || null, bedId: bedId || null,
    checkIn: new Date(checkIn), checkOut: new Date(checkOut),
    guests: guests || 1, totalAmount, specialRequests,
    platformCommission: totalAmount * 0.10, dealerAmount: totalAmount * 0.90,
  });

  await Payment.create({ bookingId: booking._id, amount: totalAmount, paymentStatus: 'PENDING' });

  await Notification.create({
    userId: (property as any).dealerId, title: 'New Booking Received',
    message: `New booking for ${property.name}`, type: 'NEW_BOOKING', data: { bookingId: booking._id },
  });

  ApiResponse.created(res, booking);
});

router.put('/bookings/:id/cancel', async (req: Request, res: Response) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.userId.toString() !== req.user!.userId) throw ApiError.forbidden('Access denied');
  if (booking.bookingStatus === 'CANCELLED') throw ApiError.badRequest('Booking already cancelled');

  const updated = await Booking.findByIdAndUpdate(booking._id, { bookingStatus: 'CANCELLED', cancellationReason: req.body.reason || 'Cancelled by user' }, { new: true });
  ApiResponse.success(res, updated);
});

// ─── ENQUIRIES ──────────────────────────────────────
router.get('/enquiries', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '10');
  const status = qs(req.query.status);

  const where: any = { userId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    Enquiry.find(where)
      .populate({ path: 'propertyId', select: 'id name city propertyType contactPhone', populate: { path: 'images', match: { isPrimary: true } } })
      .sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Enquiry.countDocuments(where),
  ]);

  ApiResponse.success(res, { data, pagination: paginateMeta(total, pageNum, limitNum) });
});

router.post('/enquiries', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await User.findById(userId).select('firstName lastName email phone').lean();
  const { propertyId, message, moveInDate, budget, duration } = req.body;

  const property = await Property.findById(propertyId);
  if (!property) throw ApiError.notFound('Property not found');

  const enquiry = await Enquiry.create({
    userId, propertyId, name: `${user?.firstName} ${user?.lastName}`, phone: user?.phone || '',
    email: user?.email, message, moveInDate: moveInDate ? new Date(moveInDate) : undefined, budget, duration,
  });

  await Notification.create({
    userId: (property as any).dealerId, title: 'New Enquiry',
    message: `New enquiry for ${property.name}`, type: 'NEW_ENQUIRY', data: { enquiryId: enquiry._id },
  });

  ApiResponse.created(res, enquiry);
});

// ─── REVIEWS ────────────────────────────────────────
router.get('/reviews', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '10');

  const [data, total] = await Promise.all([
    Review.find({ userId })
      .populate({ path: 'propertyId', select: 'id name city', populate: { path: 'images', match: { isPrimary: true } } })
      .sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Review.countDocuments({ userId }),
  ]);

  ApiResponse.success(res, { data, pagination: paginateMeta(total, pageNum, limitNum) });
});

router.post('/reviews', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { propertyId, bookingId, rating, title, comment, photos } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.userId.toString() !== userId) throw ApiError.forbidden('Access denied');
  if (booking.bookingStatus !== 'COMPLETED') throw ApiError.badRequest('Can only review completed bookings');

  const existing = await Review.findOne({ bookingId });
  if (existing) throw ApiError.badRequest('Already reviewed this booking');

  const review = await Review.create({ userId, propertyId, bookingId, rating, title, comment, photos: photos || [], isVerified: true });

  const allReviews = await Review.find({ propertyId }).select('rating').lean();
  const avg = allReviews.reduce((s, r) => s + parseFloat(r.rating as any), 0) / allReviews.length;
  await Property.findByIdAndUpdate(propertyId, { rating: avg, totalReviews: allReviews.length });

  ApiResponse.created(res, review);
});

// ─── MESSAGES ───────────────────────────────────────
router.get('/messages', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const conversations = await Conversation.find({ $or: [{ senderId: userId }, { receiverId: userId }] })
    .populate('sender', 'id firstName lastName')
    .populate('receiver', 'id firstName lastName')
    .sort({ updatedAt: -1 }).lean();
  ApiResponse.success(res, conversations);
});

router.get('/messages/:conversationId', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const conversation = await Conversation.findById(req.params.conversationId)
    .populate('sender', 'id firstName lastName')
    .populate('receiver', 'id firstName lastName')
    .lean() as any;
  if (!conversation) throw ApiError.notFound('Conversation not found');
  if (conversation.senderId.toString() !== userId && conversation.receiverId.toString() !== userId) throw ApiError.forbidden('Access denied');
  ApiResponse.success(res, conversation);
});

router.post('/messages', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { receiverId, content, propertyId } = req.body;

  let conversation = await Conversation.findOne({
    $or: [{ senderId: userId, receiverId }, { senderId: receiverId, receiverId: userId }],
  });

  if (!conversation) {
    conversation = await Conversation.create({ senderId: userId, receiverId, propertyId });
  }

  conversation.messages.push({ senderId: userId, content, isRead: false, createdAt: new Date() } as any);
  await conversation.save();

  ApiResponse.created(res, conversation);
});

// ─── PAYMENTS ───────────────────────────────────────
router.get('/payments', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '10');

  const bookingIds = (await Booking.find({ userId }).select('_id')).map(b => b._id);

  const [data, total] = await Promise.all([
    Payment.find({ bookingId: { $in: bookingIds } })
      .populate({ path: 'bookingId', populate: [{ path: 'propertyId', select: 'name' }, { path: 'roomId', select: 'name' }] })
      .sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Payment.countDocuments({ bookingId: { $in: bookingIds } }),
  ]);

  const [totalSpent, pendingAmount, refundedAmount] = await Promise.all([
    Payment.aggregate([{ $match: { bookingId: { $in: bookingIds }, paymentStatus: 'SUCCESS' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: { bookingId: { $in: bookingIds }, paymentStatus: 'PENDING' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: { bookingId: { $in: bookingIds }, paymentStatus: 'REFUNDED' } }, { $group: { _id: null, total: { $sum: '$refundAmount' } } }]),
  ]);

  ApiResponse.success(res, {
    data, pagination: paginateMeta(total, pageNum, limitNum),
    summary: { totalSpent: totalSpent[0]?.total || 0, pendingAmount: pendingAmount[0]?.total || 0, refundedAmount: refundedAmount[0]?.total || 0 },
  });
});

// ─── NOTIFICATIONS ──────────────────────────────────
router.get('/notifications', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '20');
  const unreadOnly = qs(req.query.unreadOnly) === 'true';

  const where: any = { userId };
  if (unreadOnly) where.isRead = false;

  const [data, total, unreadCount] = await Promise.all([
    Notification.find(where).sort({ createdAt: 'desc' }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Notification.countDocuments(where),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  ApiResponse.success(res, { data, pagination: paginateMeta(total, pageNum, limitNum), unreadCount });
});

router.put('/notifications/:id/read', async (req: Request, res: Response) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  ApiResponse.success(res, { read: true });
});

router.put('/notifications/read-all', async (req: Request, res: Response) => {
  await Notification.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
  ApiResponse.success(res, { read: true });
});

// ─── SAVED SEARCHES ────────────────────────────────
router.get('/saved-searches', async (req: Request, res: Response) => {
  const searches = await SavedSearch.find({ userId: req.user!.userId }).sort({ createdAt: 'desc' }).lean();
  ApiResponse.success(res, searches);
});

router.post('/saved-searches', async (req: Request, res: Response) => {
  const { name, query, city, propertyType, priceMin, priceMax, amenities, alertEnabled } = req.body;
  const search = await SavedSearch.create({ userId: req.user!.userId, name, query, city, propertyType, priceMin, priceMax, amenities: amenities || [], alertEnabled: alertEnabled || false });
  ApiResponse.created(res, search);
});

router.delete('/saved-searches/:id', async (req: Request, res: Response) => {
  await SavedSearch.findByIdAndDelete(req.params.id);
  ApiResponse.success(res, { deleted: true });
});

// ─── SAVED LOCATIONS ────────────────────────────────
router.get('/saved-locations', async (req: Request, res: Response) => {
  const locations = await SavedLocation.find({ userId: req.user!.userId }).sort({ createdAt: 'desc' }).lean();
  ApiResponse.success(res, locations);
});

router.post('/saved-locations', async (req: Request, res: Response) => {
  const { label, address, city, area, latitude, longitude, icon } = req.body;
  const location = await SavedLocation.create({ userId: req.user!.userId, label, address, city, area, latitude, longitude, icon });
  ApiResponse.created(res, location);
});

router.delete('/saved-locations/:id', async (req: Request, res: Response) => {
  await SavedLocation.findByIdAndDelete(req.params.id);
  ApiResponse.success(res, { deleted: true });
});

// ─── PROFILE ────────────────────────────────────────
router.get('/profile', async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId).select('-passwordHash').lean() as any;
  if (!user) throw ApiError.notFound('User not found');

  const [buyerProfile, dealer, bookingsCount, reviewsCount, wishlistsCount, enquiriesCount] = await Promise.all([
    BuyerProfile.findOne({ userId: user._id }).lean(),
    Dealer.findOne({ userId: user._id }).select('id status businessName businessTypes').lean(),
    Booking.countDocuments({ userId: user._id }),
    Review.countDocuments({ userId: user._id }),
    Wishlist.countDocuments({ userId: user._id }),
    Enquiry.countDocuments({ userId: user._id }),
  ]);

  ApiResponse.success(res, { ...user, buyerProfile, dealer, _count: { bookings: bookingsCount, reviews: reviewsCount, wishlists: wishlistsCount, enquiries: enquiriesCount } });
});

router.put('/profile', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { firstName, lastName, phone, avatar, currentPassword, newPassword, buyerProfile } = req.body;

  if (currentPassword && newPassword) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw ApiError.unauthorized('Current password is incorrect');
    const hash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, { passwordHash: hash });
  }

  const userUpdate: any = {};
  if (firstName !== undefined) userUpdate.firstName = firstName;
  if (lastName !== undefined) userUpdate.lastName = lastName;
  if (phone !== undefined) userUpdate.phone = phone;
  if (avatar !== undefined) userUpdate.avatar = avatar;
  if (Object.keys(userUpdate).length > 0) await User.findByIdAndUpdate(userId, userUpdate);

  if (buyerProfile) {
    await BuyerProfile.findOneAndUpdate({ userId }, buyerProfile, { upsert: true, new: true });
  }

  ApiResponse.success(res, { updated: true });
});

// ─── BECOME OWNER ───────────────────────────────────
router.post('/become-owner', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { businessName, businessTypes, city, state, businessPhone, businessEmail, businessAddress } = req.body;

  const existingDealer = await Dealer.findOne({ userId });
  if (existingDealer) throw ApiError.badRequest('Already registered as owner');

  const dealer = await Dealer.create({ userId, businessName, businessTypes: businessTypes || [], city, state, businessPhone, businessEmail, businessAddress, status: 'PENDING' });

  await Notification.create({ userId, title: 'Owner Registration Submitted', message: 'Your owner registration is under review.', type: 'DEALER_REGISTRATION' });

  ApiResponse.created(res, dealer);
});

// ─── COMPARE ────────────────────────────────────────
router.post('/compare', async (req: Request, res: Response) => {
  const { propertyIds } = req.body;
  if (!Array.isArray(propertyIds) || propertyIds.length < 2 || propertyIds.length > 4) throw ApiError.badRequest('Provide 2-4 property IDs to compare');

  const properties = await Property.find({ _id: { $in: propertyIds } })
    .populate({ path: 'images', match: { isPrimary: true } })
    .populate('rooms', 'pricePerMonth pricePerNight isAC hasAttachedBathroom isFurnished bedType')
    .populate('amenities', 'name')
    .populate('reviews', 'rating')
    .lean();

  ApiResponse.success(res, properties);
});

// ─── POPULAR LOCATIONS ──────────────────────────────
router.get('/locations/popular', async (req: Request, res: Response) => {
  const locations = await Property.aggregate([
    { $match: { status: 'ACTIVE' } },
    { $group: { _id: '$city', count: { $sum: 1 } } },
    { $sort: { count: -1 } }, { $limit: 10 },
  ]);
  ApiResponse.success(res, locations.map(l => ({ city: l._id, count: l.count })));
});

// ─── CATEGORIES ─────────────────────────────────────
router.get('/categories', async (req: Request, res: Response) => {
  const types = await Property.aggregate([
    { $match: { status: 'ACTIVE' } },
    { $group: { _id: '$propertyType', count: { $sum: 1 } } },
  ]);
  ApiResponse.success(res, types.map(t => ({ type: t._id, count: t.count })));
});

export default router;
