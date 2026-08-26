import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Booking, Notification, Property, User } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { createAuditLog } from '../audit/audit.routes';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search, status, type } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.bookingStatus = status;

    const [bookings, total] = await Promise.all([
      Booking.find(where)
        .populate('userId', 'id email firstName lastName phone')
        .populate({ path: 'propertyId', select: 'id name propertyType city', populate: { path: 'dealerId', select: 'id businessName' } })
        .populate('roomId', 'name roomType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(where),
    ]);

    return ApiResponse.paginated(res, bookings, {
      total, page: pageNum, limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: skip + limitNum < total, hasPrev: pageNum > 1,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/overview', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const [total, pending, confirmed, completed, cancelled, failed, recentBookings] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'PENDING' }),
      Booking.countDocuments({ bookingStatus: 'CONFIRMED' }),
      Booking.countDocuments({ bookingStatus: 'COMPLETED' }),
      Booking.countDocuments({ bookingStatus: 'CANCELLED' }),
      Booking.countDocuments({ bookingStatus: 'FAILED' }),
      Booking.find()
        .populate('userId', 'firstName lastName')
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return ApiResponse.success(res, { total, pending, confirmed, completed, cancelled, failed, recentBookings });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'id email firstName lastName phone avatar')
      .populate({ path: 'propertyId', populate: { path: 'dealerId', populate: { path: 'userId', select: 'firstName lastName email phone' } } })
      .populate('roomId')
      .lean();

    if (!booking) throw ApiError.notFound('Booking not found');
    return ApiResponse.success(res, booking);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: status, cancellationReason: reason },
      { new: true }
    )
      .populate('userId', 'firstName lastName email')
      .populate('propertyId', 'name');

    await Notification.create({
      userId: (booking as any).userId._id,
      title: `Booking ${status.charAt(0) + status.slice(1).toLowerCase()}`,
      message: `Your booking at ${(booking as any).propertyId.name} has been ${status.toLowerCase()}.`,
      type: status === 'CONFIRMED' ? 'BOOKING_CONFIRMED' : 'BOOKING_CANCELLED',
    });

    await createAuditLog((req as any).user?.id, 'UPDATE', 'Booking', booking!.id, null, { status }, req.ip, req.headers['user-agent']);

    return ApiResponse.success(res, booking, `Booking ${status.toLowerCase()}`);
  } catch (error) {
    next(error);
  }
});

export default router;
