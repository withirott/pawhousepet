const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const imageOptimizer = require('../middlewares/imageOptimizer');

router.get('/me', verifyToken, userController.getProfile);
router.put('/me', verifyToken, upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'paymentQr', maxCount: 1 }]), imageOptimizer, userController.updateProfile);
router.put('/change-password', verifyToken, userController.changePassword);
router.post('/verify-id', verifyToken, upload.single('idCardImage'), imageOptimizer, userController.verifyId);

module.exports = router;
