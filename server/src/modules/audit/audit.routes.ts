import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { AuditLog } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '50', entity, action } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      AuditLog.find(where)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(where),
    ]);

    return ApiResponse.paginated(res, logs, {
      total, page: pageNum, limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: skip + limitNum < total, hasPrev: pageNum > 1,
    });
  } catch (error) {
    next(error);
  }
});

export const createAuditLog = async (
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  return AuditLog.create({
    userId: userId || undefined, action, entity, entityId, oldValues, newValues, ipAddress, userAgent,
  });
};

export default router;
