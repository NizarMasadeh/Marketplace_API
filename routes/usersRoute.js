const express = require('express');
const router = express.Router();
const { getAnalytics, getTrackedUsers, trackUserVisit} = require('../controllers/usersController')

router.post('/track', trackUserVisit);
router.get('/users', getTrackedUsers);
router.get('/analytics', getAnalytics);

module.exports = router;