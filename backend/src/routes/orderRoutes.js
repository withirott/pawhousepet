const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All order routes are protected
router.use(verifyToken);

router.post('/', orderController.createOrder);
router.post('/:id/payment', upload.single('slipImage'), orderController.uploadSlip);
router.get('/me', orderController.getMyOrders);
router.get('/me/sales', orderController.getMySales);
router.get('/:id', orderController.getOrderById);
router.put('/:id/cancel', orderController.cancelOrder);
router.put('/:id/receipt', orderController.confirmReceipt);

router.post('/:id/delivery-proof', upload.single('delivery_proof'), orderController.uploadDeliveryProof);

module.exports = router;
