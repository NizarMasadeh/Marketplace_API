const express = require('express');
const router = express.Router();
const { uploadImage, listImages } = require('../controllers/imageController');
const { authMiddleware } = require('../middleware/auth');

router.post('/upload', uploadImage);
router.get('/list', authMiddleware, listImages);

module.exports = router;