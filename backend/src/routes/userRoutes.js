const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/me', verifyToken, userController.getProfile);
router.put('/me', verifyToken, upload.single('profileImage'), userController.updateProfile);
router.put('/change-password', verifyToken, userController.changePassword);

module.exports = router;
