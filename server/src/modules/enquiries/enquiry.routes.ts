import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Enquiry } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;

    const [enquiries, total] = await Promise.all([
      Enquiry.find(where)
        .populate('userId', 'firstName lastName email phone')
        .populate('propertyId', 'name propertyType city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Enquiry.countDocuments(where),
    ]);

    return ApiResponse.paginated(res, enquiries, {
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
    const [total, byStatus, convertedCount] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Enquiry.countDocuments({ status: 'CONVERTED' }),
    ]);

    return ApiResponse.success(res, {
      total,
      byStatus,
      converted: convertedCount,
      conversionRate: total > 0 ? ((convertedCount / total) * 100).toFixed(2) : 0,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    return ApiResponse.success(res, enquiry, 'Enquiry status updated');
  } catch (error) {
    next(error);
  }
});

export default router;
