const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/nzd-lamoor/lamoorController');

router.get('/messages', messageController.getMessages);
router.post('/messages', messageController.createMessage);
router.put('/messages/:id', messageController.updateMessage);
router.delete('/messages/:id', messageController.deleteMessage);
router.get('/conversation', messageController.getConversation);

module.exports = router;