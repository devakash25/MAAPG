import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { User, Dealer, Property, Booking, Payment, Complaint, Enquiry } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

router.get('/dashboard', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers, newUsersToday, totalDealers, pendingDealers,
      totalProperties, activeProperties, pendingProperties,
      totalBookings, bookingsToday,
      totalRevenueResult, revenueThisMonthResult,
      totalComplaints, pendingComplaints, totalEnquiries,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      Dealer.countDocuments(),
      Dealer.countDocuments({ status: 'PENDING' }),
      Property.countDocuments(),
      Property.countDocuments({ status: 'ACTIVE' }),
      Property.countDocuments({ status: 'PENDING_VERIFICATION' }),
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: today } }),
      Payment.aggregate([{ $match: { paymentStatus: 'SUCCESS' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { paymentStatus: 'SUCCESS', createdAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'NEW' }),
      Enquiry.countDocuments(),
    ]);

    return ApiResponse.success(res, {
      users: { total: totalUsers, newToday: newUsersToday },
      dealers: { total: totalDealers, pending: pendingDealers },
      properties: { total: totalProperties, active: activeProperties, pending: pendingProperties },
      bookings: { total: totalBookings, today: bookingsToday },
      revenue: { total: totalRevenueResult[0]?.total || 0, thisMonth: revenueThisMonthResult[0]?.total || 0 },
      complaints: { total: totalComplaints, pending: pendingComplaints },
      enquiries: { total: totalEnquiries },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/revenue', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const [byPropertyType, recentTransactions] = await Promise.all([
      Booking.aggregate([
        { $group: { _id: '$propertyId', totalAmount: { $sum: '$totalAmount' }, platformCommission: { $sum: '$platformCommission' }, count: { $sum: 1 } } },
      ]),
      Payment.find({ paymentStatus: 'SUCCESS' })
        .populate({ path: 'bookingId', populate: { path: 'propertyId', select: 'name propertyType' } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return ApiResponse.success(res, { byPropertyType, recentTransactions });
  } catch (error) {
    next(error);
  }
});

router.get('/properties/by-type', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const analytics = await Property.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$propertyType', count: { $sum: 1 }, totalRevenue: { $sum: '$totalRevenue' }, totalBookings: { $sum: '$totalBookings' }, avgRating: { $avg: '$rating' } } },
    ]);
    return ApiResponse.success(res, analytics);
  } catch (error) {
    next(error);
  }
});

router.get('/dealers/top', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const topDealers = await Dealer.find({ status: 'APPROVED' })
      .populate('userId', 'firstName lastName email')
      .sort({ totalRevenue: -1 })
      .limit(10)
      .lean();
    return ApiResponse.success(res, topDealers);
  } catch (error) {
    next(error);
  }
});

router.get('/activity', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const [recentUsers, recentDealers, recentBookings, recentComplaints] = await Promise.all([
      User.find().select('firstName lastName email role createdAt').sort({ createdAt: -1 }).limit(5).lean(),
      Dealer.find().populate('userId', 'firstName lastName').sort({ createdAt: -1 }).limit(5).lean(),
      Booking.find().populate('userId', 'firstName lastName').populate('propertyId', 'name').sort({ createdAt: -1 }).limit(5).lean(),
      Complaint.find().populate('userId', 'firstName lastName').sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    return ApiResponse.success(res, { recentUsers, recentDealers, recentBookings, recentComplaints });
  } catch (error) {
    next(error);
  }
});

export default router;
