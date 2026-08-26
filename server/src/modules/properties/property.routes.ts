import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Property, Room, Bed, Review, Booking, Enquiry, Wishlist } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { createAuditLog } from '../audit/audit.routes';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search, type, status, city, dealerId } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
        { city: { $regex: String(search), $options: 'i' } },
      ];
    }
    if (type) where.propertyType = type;
    if (status) where.status = status;
    if (city) where.city = { $regex: String(city), $options: 'i' };
    if (dealerId) where.dealerId = dealerId;

    const [properties, total] = await Promise.all([
      Property.find(where)
        .populate({ path: 'dealerId', select: 'id businessName', populate: { path: 'userId', select: 'firstName lastName email' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Property.countDocuments(where),
    ]);

    return ApiResponse.paginated(res, properties, {
      total, page: pageNum, limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: skip + limitNum < total, hasPrev: pageNum > 1,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/pending', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const properties = await Property.find({ status: 'PENDING_VERIFICATION' })
      .populate({ path: 'dealerId', select: 'id businessName', populate: { path: 'userId', select: 'firstName lastName email' } })
      .sort({ createdAt: 'asc' })
      .lean();

    return ApiResponse.success(res, properties);
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/overview', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const [total, byType, byStatus] = await Promise.all([
      Property.countDocuments(),
      Property.aggregate([
        { $group: { _id: '$propertyType', count: { $sum: 1 }, totalRevenue: { $sum: '$totalRevenue' } } },
      ]),
      Property.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return ApiResponse.success(res, { total, byType, byStatus });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate({ path: 'dealerId', populate: { path: 'userId', select: 'firstName lastName email phone' } })
      .lean();

    if (!property) throw ApiError.notFound('Property not found');

    const [rooms, reviews] = await Promise.all([
      Room.find({ propertyId: property._id }).populate('beds').lean(),
      Review.find({ propertyId: property._id })
        .populate('userId', 'firstName lastName avatar')
        .limit(10)
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const [roomsCount, bookingsCount, reviewsCount, enquiriesCount, wishlistsCount] = await Promise.all([
      Room.countDocuments({ propertyId: property._id }),
      Booking.countDocuments({ propertyId: property._id }),
      Review.countDocuments({ propertyId: property._id }),
      Enquiry.countDocuments({ propertyId: property._id }),
      Wishlist.countDocuments({ propertyId: property._id }),
    ]);

    return ApiResponse.success(res, {
      ...property,
      rooms,
      reviews,
      _count: { rooms: roomsCount, bookings: bookingsCount, reviews: reviewsCount, enquiries: enquiriesCount, wishlists: wishlistsCount },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/approve', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) throw ApiError.notFound('Property not found');
    if (property.status !== 'PENDING_VERIFICATION') throw ApiError.badRequest('Property is not pending verification');

    const updated = await Property.findByIdAndUpdate(req.params.id, { status: 'ACTIVE' }, { new: true });
    await createAuditLog((req as any).user?.id, 'APPROVE', 'Property', property.id, { status: property.status }, { status: 'ACTIVE' }, req.ip, req.headers['user-agent']);

    return ApiResponse.success(res, updated, 'Property approved');
  } catch (error) {
    next(error);
  }
});

router.put('/:id/reject', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const updated = await Property.findByIdAndUpdate(req.params.id, { status: 'REJECTED' }, { new: true });
    await createAuditLog((req as any).user?.id, 'REJECT', 'Property', req.params.id as string, null, { status: 'REJECTED', reason }, req.ip as string, req.headers['user-agent'] as string);

    return ApiResponse.success(res, updated, 'Property rejected');
  } catch (error) {
    next(error);
  }
});

router.put('/:id/suspend', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const updated = await Property.findByIdAndUpdate(req.params.id, { status: 'SUSPENDED' }, { new: true });
    await createAuditLog((req as any).user?.id, 'SUSPEND', 'Property', req.params.id as string, null, { status: 'SUSPENDED' }, req.ip as string, req.headers['user-agent'] as string);

    return ApiResponse.success(res, updated, 'Property suspended');
  } catch (error) {
    next(error);
  }
});

router.put('/:id/feature', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { isFeatured } = req.body;
    const updated = await Property.findByIdAndUpdate(req.params.id, { isFeatured }, { new: true });
    return ApiResponse.success(res, updated, `Property ${isFeatured ? 'featured' : 'unfeatured'}`);
  } catch (error) {
    next(error);
  }
});

export default router;
