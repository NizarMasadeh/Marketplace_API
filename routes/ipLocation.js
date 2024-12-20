const express = require('express');
const { getIPLocation } = require('../controllers/iplocationController');
const router = express.Router();

router.get('/', getIPLocation);

module.exports = router;