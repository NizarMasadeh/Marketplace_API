const express = require('express');
const router = express.Router();
const { authMiddleware, isMerchant, isAdmin, isAdminOrMerchant } = require('../middleware/auth');
const { createStore, getStoreById, getStoreByMerchantId, updateStore, deleteStore, getAllStores } = require('../controllers/storeController');


router.post('/', authMiddleware, isMerchant, createStore);

router.get('/', authMiddleware, isAdminOrMerchant, getStoreById);
router.get('/all', authMiddleware, isAdmin, getAllStores);

router.get('/merchant', authMiddleware, isAdminOrMerchant, getStoreByMerchantId);
router.put('/', authMiddleware, isAdminOrMerchant, updateStore);
router.patch('/', authMiddleware, isAdminOrMerchant, updateStore);
router.delete('/', authMiddleware, isAdminOrMerchant, deleteStore);

module.exports = router;