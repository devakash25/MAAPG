import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Review } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';
import { createAuditLog } from '../audit/audit.routes';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', rating, flagged } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (rating) where.rating = { $gte: Number(rating) };
    if (flagged === 'true') where.isFlagged = true;

    const [reviews, total] = await Promise.all([
      Review.find(where)
        .populate('userId', 'firstName lastName email')
        .populate('propertyId', 'name city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(where),
    ]);

    return ApiResponse.paginated(res, reviews, {
      total, page: pageNum, limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: skip + limitNum < total, hasPrev: pageNum > 1,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/flag', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { isFlagged } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { isFlagged }, { new: true });
    await createAuditLog((req as any).user?.id, 'UPDATE', 'Review', review!.id, null, { isFlagged }, req.ip, req.headers['user-agent']);
    return ApiResponse.success(res, review, isFlagged ? 'Review flagged' : 'Review unflagged');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    await createAuditLog((req as any).user?.id, 'DELETE', 'Review', req.params.id as string, null, null, req.ip as string, req.headers['user-agent'] as string);
    return ApiResponse.success(res, null, 'Review deleted');
  } catch (error) {
    next(error);
  }
});

export default router;
