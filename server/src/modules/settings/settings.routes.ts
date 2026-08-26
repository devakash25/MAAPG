import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { PlatformSettings } from '../../models';
import { ApiResponse } from '../../utils/apiResponse';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const settings = await PlatformSettings.find().lean();
    const settingsMap = settings.reduce((acc: Record<string, string>, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    return ApiResponse.success(res, settingsMap);
  } catch (error) {
    next(error);
  }
});

router.put('/', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { settings } = req.body;
    const updates = Object.entries(settings).map(([key, value]) =>
      PlatformSettings.findOneAndUpdate({ key }, { value: String(value) }, { upsert: true, new: true })
    );
    await Promise.all(updates);
    return ApiResponse.success(res, null, 'Settings updated');
  } catch (error) {
    next(error);
  }
});

router.get('/commission', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const commissionSetting = await PlatformSettings.findOne({ key: 'commission_rates' }).lean();
    const rates = commissionSetting
      ? JSON.parse(commissionSetting.value)
      : { HOTEL: 10, HOSTEL: 8, PG: 8, RENTAL_ROOM: 5, APARTMENT: 7, GUEST_HOUSE: 7 };
    return ApiResponse.success(res, rates);
  } catch (error) {
    next(error);
  }
});

router.put('/commission', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { rates } = req.body;
    await PlatformSettings.findOneAndUpdate(
      { key: 'commission_rates' },
      { value: JSON.stringify(rates) },
      { upsert: true, new: true }
    );
    return ApiResponse.success(res, rates, 'Commission rates updated');
  } catch (error) {
    next(error);
  }
});

export default router;
