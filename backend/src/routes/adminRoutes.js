const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(isAdmin);

router.get('/stats', adminController.getStats);
router.get('/orders', adminController.getAllTransactions); // Kept route name as orders so frontend doesn't break entirely, but it fetches transactions
router.put('/transactions/:transactionId/verify', adminController.verifyTransaction);

// User Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
