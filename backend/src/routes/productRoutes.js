const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const imageOptimizer = require('../middlewares/imageOptimizer');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

const sellerVerified = require('../middlewares/sellerVerified');

// Protected routes (require login)
router.get('/me/items', verifyToken, productController.getMyProducts);
router.post('/', verifyToken, sellerVerified, upload.fields([{ name: 'productImage', maxCount: 5 }, { name: 'vaccineCert', maxCount: 1 }]), imageOptimizer, productController.createProduct);
router.put('/:id', verifyToken, upload.fields([{ name: 'vaccineCert', maxCount: 1 }]), imageOptimizer, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;
