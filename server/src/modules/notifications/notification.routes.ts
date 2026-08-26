import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Notification } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = '1', limit = '20', unread } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.user!.userId };
    if (unread === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(where)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(where),
      Notification.countDocuments({ userId: req.user!.userId, isRead: false }),
    ]);

    return ApiResponse.paginated(res, notifications, {
      total, page: pageNum, limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: skip + limitNum < total, hasPrev: pageNum > 1,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    return ApiResponse.success(res, notification);
  } catch (error) {
    next(error);
  }
});

router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
    return ApiResponse.success(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

router.post('/bulk', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { userIds, title, message, type } = req.body;
    const notifications = await Notification.insertMany(
      userIds.map((userId: string) => ({ userId, title, message, type: type || 'SYSTEM_ALERT' }))
    );
    return ApiResponse.success(res, notifications, 'Notifications sent');
  } catch (error) {
    next(error);
  }
});

export default router;
