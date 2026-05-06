const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/toggle', favoriteController.toggleFavorite);
router.get('/my-favorites', favoriteController.getMyFavorites);
router.get('/my-favorite-ids', favoriteController.getMyFavoriteIds);

module.exports = router;
