import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Coupon, HeroBanner, FAQ } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';

const router = Router();

router.get('/coupons', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', active } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;

    const [coupons, total] = await Promise.all([
      Coupon.find(where).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Coupon.countDocuments(where),
    ]);

    return ApiResponse.paginated(res, coupons, {
      total, page: pageNum, limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: skip + limitNum < total, hasPrev: pageNum > 1,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/coupons', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { code, description, discountType, discount, minAmount, maxDiscount, maxUses, validFrom, validUntil } = req.body;
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) throw ApiError.conflict('Coupon code already exists');

    const coupon = await Coupon.create({
      code: code.toUpperCase(), description, discountType: discountType || 'PERCENTAGE',
      discount, minAmount, maxDiscount, maxUses,
      validFrom: new Date(validFrom), validUntil: new Date(validUntil),
    });

    return ApiResponse.success(res, coupon, 'Coupon created');
  } catch (error) {
    next(error);
  }
});

router.put('/coupons/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return ApiResponse.success(res, coupon, 'Coupon updated');
  } catch (error) {
    next(error);
  }
});

router.delete('/coupons/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, null, 'Coupon deleted');
  } catch (error) {
    next(error);
  }
});

router.get('/banners', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const banners = await HeroBanner.find().sort({ order: 'asc' }).lean();
    return ApiResponse.success(res, banners);
  } catch (error) {
    next(error);
  }
});

router.post('/banners', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const banner = await HeroBanner.create(req.body);
    return ApiResponse.success(res, banner, 'Banner created');
  } catch (error) {
    next(error);
  }
});

router.get('/faqs', async (req, res, next) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ order: 'asc' }).lean();
    return ApiResponse.success(res, faqs);
  } catch (error) {
    next(error);
  }
});

router.post('/faqs', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const faq = await FAQ.create(req.body);
    return ApiResponse.success(res, faq, 'FAQ created');
  } catch (error) {
    next(error);
  }
});

export default router;
