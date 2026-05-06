const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes (require login)
router.get('/me/items', verifyToken, productController.getMyProducts);
router.post('/', verifyToken, upload.fields([{ name: 'productImage', maxCount: 5 }, { name: 'vaccineCert', maxCount: 1 }]), productController.createProduct);
router.put('/:id', verifyToken, upload.fields([{ name: 'vaccineCert', maxCount: 1 }]), productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;
