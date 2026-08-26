import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Payment, Booking, Notification, User } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { createAuditLog } from '../audit/audit.routes';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', status, method } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.paymentStatus = status;
    if (method) where.paymentMethod = method;

    const [payments, total] = await Promise.all([
      Payment.find(where)
        .populate({ path: 'bookingId', populate: [{ path: 'userId', select: 'firstName lastName email' }, { path: 'propertyId', select: 'name', populate: { path: 'dealerId', select: 'businessName' } }] })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(where),
    ]);

    return ApiResponse.paginated(res, payments, {
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
    const [totalRevenueResult, pendingPaymentsResult, successfulPayments, refundedAmountResult, byMethod] = await Promise.all([
      Payment.aggregate([{ $match: { paymentStatus: 'SUCCESS' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { paymentStatus: 'PENDING' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.countDocuments({ paymentStatus: 'SUCCESS' }),
      Payment.aggregate([{ $match: { paymentStatus: 'REFUNDED' } }, { $group: { _id: null, total: { $sum: '$refundAmount' } } }]),
      Payment.aggregate([{ $match: { paymentStatus: 'SUCCESS' } }, { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    ]);

    return ApiResponse.success(res, {
      totalRevenue: totalRevenueResult[0]?.total || 0,
      pendingPayments: pendingPaymentsResult[0]?.total || 0,
      successfulPayments,
      refundedAmount: refundedAmountResult[0]?.total || 0,
      byMethod,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({ path: 'bookingId', populate: [{ path: 'userId', select: 'firstName lastName email phone' }, { path: 'propertyId', populate: { path: 'dealerId', populate: { path: 'userId', select: 'firstName lastName email' } } }] })
      .lean();

    if (!payment) throw ApiError.notFound('Payment not found');
    return ApiResponse.success(res, payment);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/refund', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const payment = await Payment.findById(req.params.id).populate('bookingId').lean() as any;
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.paymentStatus !== 'SUCCESS') throw ApiError.badRequest('Can only refund successful payments');

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: amount === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundAmount: amount,
        refundReason: reason,
        refundedAt: new Date(),
      },
      { new: true }
    );

    await Notification.create({
      userId: payment.bookingId.userId,
      title: 'Payment Refunded',
      message: `Your payment of ₹${amount} has been refunded.`,
      type: 'PAYMENT_RECEIVED',
    });

    await createAuditLog((req as any).user?.id, 'UPDATE', 'Payment', payment._id, { paymentStatus: payment.paymentStatus }, { paymentStatus: updatedPayment!.paymentStatus, refundAmount: amount, reason }, req.ip, req.headers['user-agent']);

    return ApiResponse.success(res, updatedPayment, 'Refund processed');
  } catch (error) {
    next(error);
  }
});

export default router;
