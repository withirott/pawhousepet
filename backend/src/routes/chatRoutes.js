const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', chatController.getChats);
router.post('/start', chatController.createOrGetChat);
router.get('/:id/messages', chatController.getMessages);

module.exports = router;
