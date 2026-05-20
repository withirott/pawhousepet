const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const imageOptimizer = require('../middlewares/imageOptimizer');

router.use(verifyToken);

router.get('/:id', transactionController.getTransaction);
router.post('/:id/slip', upload.single('slip_image'), imageOptimizer, transactionController.uploadSlip);

module.exports = router;
