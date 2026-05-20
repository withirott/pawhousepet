const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Public route to get reviews
router.get('/seller/:sellerId', reviewController.getSellerReviews);

// Protected route to add review
router.post('/', verifyToken, reviewController.addReview);

module.exports = router;
