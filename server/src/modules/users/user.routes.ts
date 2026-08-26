import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { User, Booking, Review, Complaint } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search, role, status } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.$or = [
        { email: { $regex: String(search), $options: 'i' } },
        { firstName: { $regex: String(search), $options: 'i' } },
        { lastName: { $regex: String(search), $options: 'i' } },
        { phone: { $regex: String(search) } },
      ];
    }
    if (role) where.role = role;
    if (status === 'active') where.isActive = true;
    if (status === 'blocked') where.isActive = false;

    const [users, total] = await Promise.all([
      User.find(where)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(where),
    ]);

    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const [bookingsCount, reviewsCount, complaintsCount] = await Promise.all([
          Booking.countDocuments({ userId: u._id }),
          Review.countDocuments({ userId: u._id }),
          Complaint.countDocuments({ userId: u._id }),
        ]);
        return { ...u, _count: { bookings: bookingsCount, reviews: reviewsCount, complaints: complaintsCount } };
      })
    );

    return ApiResponse.paginated(res, usersWithCounts, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: skip + limitNum < total,
      hasPrev: pageNum > 1,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').lean();
    if (!user) throw ApiError.notFound('User not found');

    const [bookingsCount, reviewsCount, wishlistsCount, enquiriesCount, complaintsCount] = await Promise.all([
      Booking.countDocuments({ userId: user._id }),
      Review.countDocuments({ userId: user._id }),
      require('../../models').Wishlist.countDocuments({ userId: user._id }),
      require('../../models').Enquiry.countDocuments({ userId: user._id }),
      Complaint.countDocuments({ userId: user._id }),
    ]);

    return ApiResponse.success(res, {
      ...user,
      _count: { bookings: bookingsCount, reviews: reviewsCount, wishlists: wishlistsCount, enquiries: enquiriesCount, complaints: complaintsCount },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('email isActive').lean();

    return ApiResponse.success(res, user, `User ${isActive ? 'activated' : 'blocked'} successfully`);
  } catch (error) {
    next(error);
  }
});

export default router;
