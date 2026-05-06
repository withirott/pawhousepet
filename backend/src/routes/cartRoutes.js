const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.post('/checkout', cartController.checkoutAll);
router.delete('/:productId', cartController.removeFromCart);

module.exports = router;
