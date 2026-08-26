import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Dealer, User, Property, Notification } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { createAuditLog } from '../audit/audit.routes';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search, status } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      const userIds = (await User.find({
        $or: [
          { email: { $regex: String(search), $options: 'i' } },
          { firstName: { $regex: String(search), $options: 'i' } },
          { phone: { $regex: String(search) } },
        ],
      }).select('_id')).map((u: any) => u._id);
      where.$or = [
        { businessName: { $regex: String(search), $options: 'i' } },
        { userId: { $in: userIds } },
      ];
    }
    if (status) where.status = status;

    const [dealers, total] = await Promise.all([
      Dealer.find(where)
        .populate('userId', 'id email phone firstName lastName avatar createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Dealer.countDocuments(where),
    ]);

    const dealersWithCounts = await Promise.all(
      dealers.map(async (d) => {
        const [propertiesCount, documentsCount] = await Promise.all([
          Property.countDocuments({ dealerId: d._id }),
          Promise.resolve(d.documents?.length || 0),
        ]);
        return { ...d, _count: { properties: propertiesCount, documents: documentsCount } };
      })
    );

    return ApiResponse.paginated(res, dealersWithCounts, {
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

router.get('/pending', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const dealers = await Dealer.find({ status: 'PENDING' })
      .populate('userId', 'id email phone firstName lastName avatar')
      .sort({ createdAt: 'asc' })
      .lean();

    return ApiResponse.success(res, dealers);
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/overview', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const [total, pending, approved, rejected, suspended, blocked] = await Promise.all([
      Dealer.countDocuments(),
      Dealer.countDocuments({ status: 'PENDING' }),
      Dealer.countDocuments({ status: 'APPROVED' }),
      Dealer.countDocuments({ status: 'REJECTED' }),
      Dealer.countDocuments({ status: 'SUSPENDED' }),
      Dealer.countDocuments({ status: 'BLOCKED' }),
    ]);

    return ApiResponse.success(res, { total, pending, approved, rejected, suspended, blocked });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const dealer = await Dealer.findById(req.params.id)
      .populate('userId', 'id email phone firstName lastName avatar lastLoginAt createdAt')
      .lean();

    if (!dealer) throw ApiError.notFound('Dealer not found');

    const properties = await Property.find({ dealerId: dealer._id })
      .select('id name propertyType city status rating totalBookings totalRevenue')
      .lean();

    return ApiResponse.success(res, { ...dealer, properties, _count: { properties: properties.length, documents: dealer.documents?.length || 0 } });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/approve', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) throw ApiError.notFound('Dealer not found');
    if (dealer.status !== 'PENDING' && dealer.status !== 'UNDER_REVIEW') {
      throw ApiError.badRequest('Dealer is not in a verifiable state');
    }

    const updatedDealer = await Dealer.findByIdAndUpdate(
      req.params.id,
      { status: 'APPROVED' },
      { new: true }
    ).populate('userId', 'id email firstName lastName');

    await Notification.create({
      userId: dealer.userId,
      title: 'Dealer Account Approved',
      message: 'Your dealer account has been approved. You can now add properties.',
      type: 'DEALER_APPROVED',
    });

    await createAuditLog((req as any).user?.id, 'APPROVE', 'Dealer', dealer.id, { status: dealer.status }, { status: 'APPROVED' }, req.ip, req.headers['user-agent']);

    return ApiResponse.success(res, updatedDealer, 'Dealer approved successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/:id/reject', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) throw ApiError.notFound('Dealer not found');

    const updatedDealer = await Dealer.findByIdAndUpdate(
      req.params.id,
      { status: 'REJECTED' },
      { new: true }
    ).populate('userId', 'id email firstName lastName');

    await Notification.create({
      userId: dealer.userId,
      title: 'Dealer Account Rejected',
      message: reason || 'Your dealer account has been rejected. Please contact support for more information.',
      type: 'DEALER_REJECTED',
    });

    await createAuditLog((req as any).user?.id, 'REJECT', 'Dealer', dealer.id, { status: dealer.status }, { status: 'REJECTED', reason }, req.ip, req.headers['user-agent']);

    return ApiResponse.success(res, updatedDealer, 'Dealer rejected');
  } catch (error) {
    next(error);
  }
});

router.put('/:id/suspend', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const dealer = await Dealer.findByIdAndUpdate(
      req.params.id,
      { status: 'SUSPENDED' },
      { new: true }
    ).populate('userId', 'id email firstName lastName');

    await createAuditLog((req as any).user?.id, 'SUSPEND', 'Dealer', req.params.id as string, null, { status: 'SUSPENDED' }, req.ip as string, req.headers['user-agent'] as string);

    return ApiResponse.success(res, dealer, 'Dealer suspended');
  } catch (error) {
    next(error);
  }
});

export default router;
