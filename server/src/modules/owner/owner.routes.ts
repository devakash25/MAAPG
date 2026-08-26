import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { Dealer, User, Property, Room, Bed, Booking, Enquiry, Review, Notification, Payout, Dealer as DealerModel, Coupon, Complaint, FAQ, AuditLog } from '../../models';

const router = Router();

router.use(authenticate);
router.use(authorize('DEALER'));

function qs(val: unknown): string | undefined {
  if (typeof val === 'string' && val.trim()) return val.trim();
  return undefined;
}

function paginateMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 };
}

async function getDealer(userId: string) {
  const dealer = await Dealer.findOne({ userId }).lean();
  if (!dealer) throw ApiError.notFound('Dealer profile not found');
  return dealer;
}

// ─── DASHBOARD ──────────────────────────────────────
router.get('/dashboard', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const dealerId = dealer._id;

  const [
    totalProperties, liveProperties, pendingProperties, draftProperties, suspendedProperties,
    totalBookings, pendingBookings, confirmedBookings, completedBookings, cancelledBookings,
    totalEnquiries, newEnquiries, totalReviews,
    revenueAgg, commissionAgg,
    totalRooms, totalBeds,
    recentBookings, recentEnquiries, properties,
  ] = await Promise.all([
    Property.countDocuments({ dealerId }),
    Property.countDocuments({ dealerId, status: 'ACTIVE' }),
    Property.countDocuments({ dealerId, status: 'PENDING_VERIFICATION' }),
    Property.countDocuments({ dealerId, status: 'DRAFT' }),
    Property.countDocuments({ dealerId, status: 'SUSPENDED' }),
    Booking.countDocuments({ property: { dealerId } } as any),
    Booking.countDocuments({ property: { dealerId }, bookingStatus: 'PENDING' } as any),
    Booking.countDocuments({ property: { dealerId }, bookingStatus: 'CONFIRMED' } as any),
    Booking.countDocuments({ property: { dealerId }, bookingStatus: 'CONFIRMED', checkIn: { $lte: new Date() }, checkOut: { $gte: new Date() } } as any),
    Booking.countDocuments({ property: { dealerId }, bookingStatus: 'COMPLETED' } as any),
    Booking.countDocuments({ property: { dealerId }, bookingStatus: 'CANCELLED' } as any),
    Enquiry.countDocuments({ property: { dealerId } } as any),
    Enquiry.countDocuments({ property: { dealerId }, status: 'NEW' } as any),
    Review.countDocuments({ property: { dealerId } } as any),
    Booking.aggregate([
      { $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'prop' } },
      { $unwind: '$prop' },
      { $match: { 'prop.dealerId': dealerId, bookingStatus: 'COMPLETED' } },
      { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, platformCommission: { $sum: '$platformCommission' }, dealerAmount: { $sum: '$dealerAmount' } } },
    ]),
    Booking.aggregate([
      { $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'prop' } },
      { $unwind: '$prop' },
      { $match: { 'prop.dealerId': dealerId, bookingStatus: 'COMPLETED' } },
      { $group: { _id: null, platformCommission: { $sum: '$platformCommission' } } },
    ]),
    Room.countDocuments({ property: { dealerId } } as any),
    Bed.countDocuments({ room: { property: { dealerId } } } as any),
    Booking.find({ property: { dealerId } } as any)
      .populate('userId', 'firstName lastName email')
      .populate({ path: 'propertyId', select: 'name propertyType' })
      .sort({ createdAt: -1 }).limit(5).lean(),
    Enquiry.find({ property: { dealerId } } as any)
      .populate({ path: 'propertyId', select: 'name propertyType' })
      .sort({ createdAt: -1 }).limit(5).lean(),
    Property.find({ dealerId }).select('name propertyType status rating totalRevenue totalBookings totalReviews').lean(),
  ]);

  const revenue = (revenueAgg as any)[0] || { totalAmount: 0, platformCommission: 0, dealerAmount: 0 };
  const commission = (commissionAgg as any)[0] || { platformCommission: 0 };

  const occupiedBeds = await Bed.countDocuments({ room: { property: { dealerId } } } as any, { isAvailable: false });
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  ApiResponse.success(res, {
    stats: {
      totalProperties, liveProperties, pendingProperties, draftProperties, suspendedProperties,
      totalBookings, pendingBookings, confirmedBookings, activeBookings: 0, completedBookings, cancelledBookings,
      totalEnquiries, newEnquiries, totalReviews,
      avgRating: 0,
      totalRevenue: Number(revenue.totalAmount), totalCommission: Number(commission.platformCommission),
      dealerEarnings: Number(revenue.dealerAmount), occupancyRate, totalRooms, totalBeds, occupiedBeds,
    },
    propertyPerformance: properties, recentBookings, recentEnquiries, actionItems: [],
  });
});

// ─── PROFILE ────────────────────────────────────────
router.get('/profile', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const user = await User.findById(dealer.userId).select('id email phone firstName lastName avatar isVerified createdAt').lean();
  ApiResponse.success(res, { ...dealer, user, totalRevenue: Number(dealer.totalRevenue) });
});

router.put('/profile', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const { businessName, businessEmail, businessPhone, businessAddress, gstNumber, panNumber, aadharNumber, bankAccountNumber, bankIfscCode, bankName, city, state, businessTypes, firstName, lastName, phone, currentPassword, newPassword } = req.body;

  if (currentPassword && newPassword) {
    const user = await User.findById(dealer.userId);
    if (!user) throw ApiError.notFound('User not found');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) throw ApiError.unauthorized('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(dealer.userId, { passwordHash });
  }

  const userUpdate: any = {};
  if (firstName !== undefined) userUpdate.firstName = firstName;
  if (lastName !== undefined) userUpdate.lastName = lastName;
  if (phone !== undefined) userUpdate.phone = phone;
  if (Object.keys(userUpdate).length > 0) await User.findByIdAndUpdate(dealer.userId, userUpdate);

  const updateData: any = {};
  for (const key of ['businessName', 'businessEmail', 'businessPhone', 'businessAddress', 'gstNumber', 'panNumber', 'aadharNumber', 'bankAccountNumber', 'bankIfscCode', 'bankName', 'city', 'state', 'businessTypes']) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }

  const updated = await Dealer.findByIdAndUpdate(dealer._id, updateData, { new: true });
  ApiResponse.success(res, updated);
});

// ─── PROPERTIES ─────────────────────────────────────
router.get('/properties', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '20');
  const status = qs(req.query.status);
  const propertyType = qs(req.query.propertyType);
  const search = qs(req.query.search);

  const where: any = { dealerId: dealer._id };
  if (status) where.status = status;
  if (propertyType) where.propertyType = propertyType;
  if (search) {
    where.$or = [
      { name: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Property.find(where)
      .populate({ path: 'rooms', select: 'totalBeds availableBeds' })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Property.countDocuments(where),
  ]);

  ApiResponse.paginated(res, data, paginateMeta(total, pageNum, limitNum));
});

router.get('/properties/:id', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const property = await Property.findOne({ _id: req.params.id, dealerId: dealer._id })
    .populate({ path: 'rooms', populate: { path: 'beds' } })
    .lean();
  if (!property) throw ApiError.notFound('Property not found');
  ApiResponse.success(res, property);
});

router.post('/properties', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  if (dealer.status !== 'APPROVED') throw ApiError.forbidden('Your account is not approved yet');

  const { propertyType, name, description, address, city, state, pincode, contactPhone, contactEmail, latitude, longitude, amenities, rules } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

  const property = await Property.create({
    dealerId: dealer._id, propertyType, name, slug,
    description: description || '', address: address || '', city: city || '',
    state: state || '', pincode: pincode || '', contactPhone: contactPhone || '',
    contactEmail, latitude, longitude, status: 'DRAFT',
    amenities: (amenities || []).map((a: any) => ({ name: a.name, icon: a.icon, category: a.category })),
    rules: (rules || []).map((r: string) => ({ rule: r })),
  });

  ApiResponse.created(res, property);
});

router.put('/properties/:id', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const property = await Property.findOne({ _id: req.params.id, dealerId: dealer._id });
  if (!property) throw ApiError.notFound('Property not found');

  const { name, description, address, city, state, pincode, contactPhone, contactEmail, latitude, longitude, status, amenities, rules } = req.body;

  const updateData: any = {};
  for (const key of ['name', 'description', 'address', 'city', 'state', 'pincode', 'contactPhone', 'contactEmail', 'latitude', 'longitude', 'status']) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }

  if (amenities && Array.isArray(amenities)) {
    updateData.amenities = amenities.map((a: any) => ({ name: a.name, icon: a.icon, category: a.category }));
  }
  if (rules && Array.isArray(rules)) {
    updateData.rules = rules.map((r: string) => ({ rule: r }));
  }

  const updated = await Property.findByIdAndUpdate(req.params.id, updateData, { new: true });
  ApiResponse.success(res, updated);
});

router.put('/properties/:id/submit', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const property = await Property.findOne({ _id: req.params.id, dealerId: dealer._id });
  if (!property) throw ApiError.notFound('Property not found');
  if (property.status !== 'DRAFT' && property.status !== 'REJECTED') throw ApiError.badRequest('Only draft or rejected properties can be submitted');

  const updated = await Property.findByIdAndUpdate(req.params.id, { status: 'PENDING_VERIFICATION' }, { new: true });

  const admins = await User.find({ role: 'SUPER_ADMIN' }).select('_id');
  await Notification.insertMany(admins.map((admin) => ({
    userId: admin._id, title: 'Property Submitted for Review',
    message: `${property.name} has been submitted for verification`,
    type: 'PROPERTY_SUBMITTED', data: { propertyId: property._id },
  })));

  ApiResponse.success(res, updated);
});

// ─── ROOMS ──────────────────────────────────────────
router.get('/properties/:propertyId/rooms', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const property = await Property.findOne({ _id: req.params.propertyId, dealerId: dealer._id });
  if (!property) throw ApiError.notFound('Property not found');

  const rooms = await Room.find({ propertyId: property._id })
    .populate('beds')
    .sort({ name: 'asc' })
    .lean();
  ApiResponse.success(res, rooms);
});

router.post('/properties/:propertyId/rooms', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const property = await Property.findOne({ _id: req.params.propertyId, dealerId: dealer._id });
  if (!property) throw ApiError.notFound('Property not found');

  const { name, description, roomType, capacity, bedType, pricePerNight, pricePerMonth, deposit, isAC, hasAttachedBathroom, isFurnished, totalBeds } = req.body;

  const room = await Room.create({
    propertyId: property._id, name, description, roomType,
    capacity: capacity || 1, bedType, pricePerNight, pricePerMonth, deposit,
    isAC: isAC || false, hasAttachedBathroom: hasAttachedBathroom || false,
    isFurnished: isFurnished || false,
    totalBeds: totalBeds || 1, availableBeds: totalBeds || 1,
  });

  if (totalBeds && totalBeds > 0) {
    await Bed.insertMany(
      Array.from({ length: totalBeds }, (_, i) => ({ roomId: room._id, name: `Bed ${i + 1}`, isAvailable: true }))
    );
  }

  ApiResponse.created(res, room);
});

router.put('/rooms/:id', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const room = await Room.findById(req.params.id).populate({ path: 'propertyId', select: 'dealerId' }) as any;
  if (!room || room.propertyId.dealerId.toString() !== dealer._id.toString()) throw ApiError.notFound('Room not found');

  const updated = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
  ApiResponse.success(res, updated);
});

router.delete('/rooms/:id', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const room = await Room.findById(req.params.id).populate({ path: 'propertyId', select: 'dealerId' }) as any;
  if (!room || room.propertyId.dealerId.toString() !== dealer._id.toString()) throw ApiError.notFound('Room not found');

  await Bed.deleteMany({ roomId: room._id });
  await Room.findByIdAndDelete(room._id);

  ApiResponse.success(res, { message: 'Room deleted' });
});

// ─── BEDS ───────────────────────────────────────────
router.put('/beds/:id/toggle', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const bed = await Bed.findById(req.params.id).populate({ path: 'roomId', populate: { path: 'propertyId', select: 'dealerId' } }) as any;
  if (!bed || bed.roomId.propertyId.dealerId.toString() !== dealer._id.toString()) throw ApiError.notFound('Bed not found');

  const updated = await Bed.findByIdAndUpdate(bed._id, { isAvailable: !bed.isAvailable }, { new: true });

  const availableCount = await Bed.countDocuments({ roomId: bed.roomId._id, isAvailable: true });
  await Room.findByIdAndUpdate(bed.roomId._id, { availableBeds: availableCount });

  ApiResponse.success(res, updated);
});

// ─── BOOKINGS ───────────────────────────────────────
router.get('/bookings', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '20');
  const status = qs(req.query.status);

  const where: any = { property: { dealerId: dealer._id } };
  if (status) where.bookingStatus = status;

  const [data, total] = await Promise.all([
    Booking.find(where)
      .populate('userId', 'id firstName lastName email phone')
      .populate({ path: 'propertyId', select: 'id name propertyType city' })
      .populate('roomId', 'name roomType')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum).limit(limitNum)
      .lean(),
    Booking.countDocuments(where),
  ]);

  ApiResponse.paginated(res, data, paginateMeta(total, pageNum, limitNum));
});

router.get('/bookings/:id', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const booking = await Booking.findOne({ _id: req.params.id })
    .populate('userId', 'id firstName lastName email phone')
    .populate({ path: 'propertyId', select: 'id name propertyType city' })
    .populate('roomId', 'name roomType pricePerNight pricePerMonth')
    .lean() as any;
  if (!booking) throw ApiError.notFound('Booking not found');
  ApiResponse.success(res, booking);
});

router.put('/bookings/:id/status', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const booking = await Booking.findById(req.params.id) as any;
  if (!booking) throw ApiError.notFound('Booking not found');

  const { status, cancellationReason } = req.body;
  const updated = await Booking.findByIdAndUpdate(booking._id, { bookingStatus: status, ...(cancellationReason && { cancellationReason }) }, { new: true });

  await Notification.create({
    userId: booking.userId, title: `Booking ${status}`,
    message: `Your booking has been ${status.toLowerCase()}`,
    type: status === 'CONFIRMED' ? 'BOOKING_CONFIRMED' : 'BOOKING_CANCELLED',
    data: { bookingId: booking._id },
  });

  ApiResponse.success(res, updated);
});

// ─── ENQUIRIES ──────────────────────────────────────
router.get('/enquiries', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '20');
  const status = qs(req.query.status);

  const where: any = { property: { dealerId: dealer._id } };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    Enquiry.find(where)
      .populate('userId', 'id firstName lastName email phone')
      .populate({ path: 'propertyId', select: 'id name propertyType city' })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum).limit(limitNum)
      .lean(),
    Enquiry.countDocuments(where),
  ]);

  ApiResponse.paginated(res, data, paginateMeta(total, pageNum, limitNum));
});

router.put('/enquiries/:id/status', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const enquiry = await Enquiry.findById(req.params.id) as any;
  if (!enquiry) throw ApiError.notFound('Enquiry not found');

  const { status, dealerNotes } = req.body;
  const updated = await Enquiry.findByIdAndUpdate(enquiry._id, { status, ...(dealerNotes !== undefined && { dealerNotes }) }, { new: true });
  ApiResponse.success(res, updated);
});

// ─── REVIEWS ────────────────────────────────────────
router.get('/reviews', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '20');
  const propertyId = qs(req.query.propertyId);

  const where: any = { property: { dealerId: dealer._id } };
  if (propertyId) where.propertyId = propertyId;

  const [data, total] = await Promise.all([
    Review.find(where)
      .populate('userId', 'id firstName lastName')
      .populate('propertyId', 'id name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum).limit(limitNum)
      .lean(),
    Review.countDocuments(where),
  ]);

  ApiResponse.success(res, { data, pagination: paginateMeta(total, pageNum, limitNum) });
});

router.put('/reviews/:id/reply', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const review = await Review.findById(req.params.id) as any;
  if (!review) throw ApiError.notFound('Review not found');

  const { ownerReply } = req.body;
  const updated = await Review.findByIdAndUpdate(review._id, { ownerReply }, { new: true });
  ApiResponse.success(res, updated);
});

// ─── FINANCE ────────────────────────────────────────
router.get('/finance/overview', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);

  const [revenueAgg, payoutAgg, recentTransactions] = await Promise.all([
    Booking.aggregate([
      { $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'prop' } },
      { $unwind: '$prop' },
      { $match: { 'prop.dealerId': dealer._id, bookingStatus: 'COMPLETED' } },
      { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, platformCommission: { $sum: '$platformCommission' }, dealerAmount: { $sum: '$dealerAmount' }, count: { $sum: 1 } } },
    ]),
    Payout.aggregate([{ $match: { dealerId: dealer._id } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Booking.find({ bookingStatus: 'COMPLETED' })
      .populate('userId', 'firstName lastName')
      .populate('propertyId', 'name')
      .sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const revenue = revenueAgg[0] || { totalAmount: 0, platformCommission: 0, dealerAmount: 0, count: 0 };
  const payout = payoutAgg[0] || { total: 0, count: 0 };

  ApiResponse.success(res, {
    stats: {
      totalRevenue: Number(revenue.totalAmount), totalCommission: Number(revenue.platformCommission),
      totalEarnings: Number(revenue.dealerAmount), totalPaidOut: Number(payout.total),
      pendingPayout: Number(revenue.dealerAmount) - Number(payout.total),
      totalBookings: revenue.count,
    },
    recentTransactions,
  });
});

// ─── NOTIFICATIONS ──────────────────────────────────
router.get('/notifications', async (req: Request, res: Response) => {
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '20');
  const unread = qs(req.query.unread);

  const where: any = { userId: req.user!.userId };
  if (unread === 'true') where.isRead = false;

  const [data, total, unreadCount] = await Promise.all([
    Notification.find(where).sort({ createdAt: 'desc' })
      .skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Notification.countDocuments(where),
    Notification.countDocuments({ userId: req.user!.userId, isRead: false }),
  ]);

  ApiResponse.success(res, { data, pagination: paginateMeta(total, pageNum, limitNum), unreadCount });
});

router.put('/notifications/:id/read', async (req: Request, res: Response) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.userId }, { isRead: true });
  ApiResponse.success(res, { message: 'Marked as read' });
});

router.put('/notifications/read-all', async (req: Request, res: Response) => {
  await Notification.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
  ApiResponse.success(res, { message: 'All marked as read' });
});

// ─── DOCUMENTS ──────────────────────────────────────
router.get('/documents', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  ApiResponse.success(res, dealer.documents || []);
});

router.post('/documents', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const { type, url, fileName } = req.body;

  const doc = { type: type || 'OTHER', url: url || '', fileName: fileName || '', verified: false, createdAt: new Date() };
  await Dealer.findByIdAndUpdate(dealer._id, { $push: { documents: doc } });
  ApiResponse.created(res, doc);
});

router.delete('/documents/:id', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  await Dealer.findByIdAndUpdate(dealer._id, { $pull: { documents: { _id: req.params.id } } });
  ApiResponse.success(res, { message: 'Document deleted' });
});

// ─── PROPERTY TYPE SUMMARY ──────────────────────────
router.get('/property-summary', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);

  const properties = await Property.aggregate([
    { $match: { dealerId: dealer._id } },
    { $group: { _id: '$propertyType', count: { $sum: 1 }, totalRevenue: { $sum: '$totalRevenue' }, avgRating: { $avg: '$rating' } } },
  ]);

  ApiResponse.success(res, properties.map((p) => ({
    propertyType: p._id, count: p.count, totalRevenue: Number(p.totalRevenue), avgRating: p.avgRating ? Number(p.avgRating) : 0,
  })));
});

// ─── INVENTORY ──────────────────────────────────────
router.get('/inventory', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const propertyId = qs(req.query.propertyId);

  const where: any = { property: { dealerId: dealer._id } };
  if (propertyId) where.propertyId = propertyId;

  const rooms = await Room.find(where)
    .populate({ path: 'propertyId', select: 'id name propertyType' })
    .populate('beds')
    .sort({ createdAt: 'desc' })
    .lean();

  const stats = {
    totalRooms: rooms.length,
    totalBeds: rooms.reduce((sum, r) => sum + (r.totalBeds || 0), 0),
    availableBeds: rooms.reduce((sum, r) => sum + (r.availableBeds || 0), 0),
    occupiedBeds: rooms.reduce((sum, r) => sum + ((r.totalBeds || 0) - (r.availableBeds || 0)), 0),
  };

  ApiResponse.success(res, { rooms, stats });
});

// ─── ANALYTICS ──────────────────────────────────────
router.get('/analytics', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);

  const [propertiesByType, bookingStatusBreakdown, topProperties] = await Promise.all([
    Property.aggregate([
      { $match: { dealerId: dealer._id } },
      { $group: { _id: '$propertyType', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
    ]),
    Booking.aggregate([
      { $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'prop' } },
      { $unwind: '$prop' },
      { $match: { 'prop.dealerId': dealer._id } },
      { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
    ]),
    Property.find({ dealerId: dealer._id })
      .select('name propertyType rating totalRevenue totalBookings')
      .sort({ totalRevenue: -1 }).limit(5).lean(),
  ]);

  ApiResponse.success(res, {
    propertiesByType: propertiesByType.map((p) => ({ type: p._id, count: p.count, avgRating: p.avgRating ? Number(p.avgRating) : 0 })),
    bookingStatusBreakdown: bookingStatusBreakdown.map((b) => ({ status: b._id, count: b.count })),
    topProperties: topProperties.map((p) => ({ ...p, totalRevenue: Number(p.totalRevenue), rating: p.rating ? Number(p.rating) : null })),
    monthlyRevenue: [],
    occupancyByType: [],
    totalStats: { totalRevenue: 0, totalEarnings: 0, totalCommission: 0, totalBookings: 0, thisMonthRevenue: 0, lastMonthRevenue: 0 },
  });
});

// ─── OFFERS ─────────────────────────────────────────
router.get('/offers', async (req: Request, res: Response) => {
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '20');
  const [data, total] = await Promise.all([
    Coupon.find({ isActive: true }).sort({ createdAt: 'desc' }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Coupon.countDocuments({ isActive: true }),
  ]);
  ApiResponse.paginated(res, data, paginateMeta(total, pageNum, limitNum));
});

router.post('/offers', async (req: Request, res: Response) => {
  const { code, description, discountType, discount, minAmount, maxDiscount, validFrom, validUntil, maxUses } = req.body;
  const coupon = await Coupon.create({
    code, description, discountType: discountType || 'PERCENTAGE', discount,
    minAmount: minAmount || null, maxDiscount: maxDiscount || null,
    validFrom: new Date(validFrom), validUntil: new Date(validUntil), maxUses: maxUses || null,
  });
  ApiResponse.created(res, coupon);
});

router.put('/offers/:id', async (req: Request, res: Response) => {
  const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  ApiResponse.success(res, updated);
});

router.delete('/offers/:id', async (req: Request, res: Response) => {
  await Coupon.findByIdAndDelete(req.params.id);
  ApiResponse.success(res, { message: 'Offer deleted' });
});

// ─── SUPPORT ────────────────────────────────────────
router.get('/support', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const pageNum = parseInt(qs(req.query.page) || '1');
  const limitNum = parseInt(qs(req.query.limit) || '20');
  const status = qs(req.query.status);

  const where: any = { userId: dealer.userId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    Complaint.find(where).sort({ createdAt: 'desc' }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Complaint.countDocuments(where),
  ]);
  ApiResponse.paginated(res, data, paginateMeta(total, pageNum, limitNum));
});

router.post('/support', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const { subject, description, category, propertyId, priority } = req.body;
  const complaint = await Complaint.create({
    userId: dealer.userId, subject, description, category: category || 'GENERAL',
    propertyId: propertyId || null, priority: priority || 'MEDIUM', status: 'NEW',
  });
  ApiResponse.created(res, complaint);
});

router.get('/support/:id', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const complaint = await Complaint.findOne({ _id: req.params.id, userId: dealer.userId }).lean();
  if (!complaint) throw ApiError.notFound('Support ticket not found');
  ApiResponse.success(res, complaint);
});

router.post('/support/:id/reply', async (req: Request, res: Response) => {
  const dealer = await getDealer(req.user!.userId);
  const complaint = await Complaint.findOne({ _id: req.params.id, userId: dealer.userId }) as any;
  if (!complaint) throw ApiError.notFound('Support ticket not found');

  const admins = await User.find({ role: 'SUPER_ADMIN' }).select('_id');
  await Notification.insertMany(admins.map((admin) => ({
    userId: admin._id, title: 'Owner Reply on Support Ticket',
    message: `Owner replied to: ${complaint.subject}`, type: 'SYSTEM_ALERT',
    data: { complaintId: complaint._id },
  })));

  const updated = await Complaint.findByIdAndUpdate(complaint._id, { status: 'IN_PROGRESS' }, { new: true });
  ApiResponse.success(res, updated);
});

// ─── FAQ ────────────────────────────────────────────
router.get('/faqs', async (req: Request, res: Response) => {
  const faqs = await FAQ.find().sort({ createdAt: 'desc' }).lean();
  ApiResponse.success(res, faqs);
});

export default router;
