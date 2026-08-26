import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Room, Bed, Booking, Property } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', propertyId } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;

    const [rooms, total] = await Promise.all([
      Room.find(where)
        .populate({ path: 'propertyId', select: 'id name propertyType city', populate: { path: 'dealerId', select: 'businessName' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Room.countDocuments(where),
    ]);

    const roomsWithCounts = await Promise.all(
      rooms.map(async (r) => {
        const [bookingsCount, bedsCount] = await Promise.all([
          Booking.countDocuments({ roomId: r._id }),
          Bed.countDocuments({ roomId: r._id }),
        ]);
        return { ...r, _count: { bookings: bookingsCount, beds: bedsCount } };
      })
    );

    return ApiResponse.paginated(res, roomsWithCounts, {
      total, page: pageNum, limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: skip + limitNum < total, hasPrev: pageNum > 1,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/inventory/overview', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const [totalRooms, totalBeds, availableBeds, occupiedBeds] = await Promise.all([
      Room.countDocuments(),
      Bed.countDocuments(),
      Bed.countDocuments({ isAvailable: true }),
      Bed.countDocuments({ isAvailable: false }),
    ]);

    return ApiResponse.success(res, {
      totalRooms, totalBeds, availableBeds, occupiedBeds,
      occupancyRate: totalBeds > 0 ? ((totalBeds - availableBeds) / totalBeds * 100).toFixed(2) : 0,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('propertyId')
      .lean();

    if (!room) throw ApiError.notFound('Room not found');

    const [beds, bookingsCount] = await Promise.all([
      Bed.find({ roomId: room._id }).lean(),
      Booking.countDocuments({ roomId: room._id }),
    ]);

    return ApiResponse.success(res, { ...room, beds, _count: { bookings: bookingsCount } });
  } catch (error) {
    next(error);
  }
});

export default router;
