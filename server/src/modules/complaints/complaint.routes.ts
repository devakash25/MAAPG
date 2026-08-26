import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Complaint } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';
import { createAuditLog } from '../audit/audit.routes';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', status, priority } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [complaints, total] = await Promise.all([
      Complaint.find(where)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(where),
    ]);

    return ApiResponse.paginated(res, complaints, {
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
    const [total, byStatus, byPriority] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    ]);
    return ApiResponse.success(res, { total, byStatus, byPriority });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .lean();
    return ApiResponse.success(res, complaint);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { status, priority, adminNotes, resolution } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, priority, adminNotes, resolution },
      { new: true }
    );
    await createAuditLog((req as any).user?.id, 'UPDATE', 'Complaint', complaint!.id, null, { status, priority, adminNotes, resolution }, req.ip, req.headers['user-agent']);
    return ApiResponse.success(res, complaint, 'Complaint updated');
  } catch (error) {
    next(error);
  }
});

export default router;
