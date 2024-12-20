const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  createMerchantProfile,
  getMerchantProfile,
  updateMerchantProfile,
  deleteMerchantProfile,
  getAllMerchants,
} = require('../controllers/merchantController');
const { authMiddleware, isMerchant, isAdmin, isAdminOrMerchant } = require('../middleware/auth');

const validateMerchantProfile = [
  body('email').isEmail().optional(),
  body('full_name').notEmpty().optional(),
  body('country').optional(),
  body('pfp_img').optional(),
  body('bg_img').optional(),
  body('products').optional().isArray(),
  body('stores').optional().isArray(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.post(
  '/profile',
  authMiddleware,
  isMerchant,
  validateMerchantProfile,
  createMerchantProfile
);

router.get(
  '/profile',
  authMiddleware,
  getMerchantProfile
);

router.get(
  '/',
  authMiddleware,
  isAdmin,
  getAllMerchants
)

router.put(
  '/profile',
  authMiddleware,
  isAdminOrMerchant,
  validateMerchantProfile,
  updateMerchantProfile
);

router.patch(
  '/profile',
  authMiddleware,
  isAdminOrMerchant,
  updateMerchantProfile
);

router.delete(
  '/profile',
  authMiddleware,
  isAdminOrMerchant,
  deleteMerchantProfile
);

module.exports = router;

