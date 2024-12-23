const router = require('express').Router();
const { insertUserData } = require('../controllers/nzrmUsersController');

router.post('/', insertUserData);

module.exports = router;