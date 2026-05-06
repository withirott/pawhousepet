const pool = require('../config/db');

exports.toggleFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Check if favorite exists
        const [existing] = await pool.query(
            'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (existing.length > 0) {
            // Remove from favorites
            await pool.query(
                'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );
            return res.json({ message: 'Removed from favorites', isFavorite: false });
        } else {
            // Add to favorites
            await pool.query(
                'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
                [userId, productId]
            );
            return res.json({ message: 'Added to favorites', isFavorite: true });
        }
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMyFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const [favorites] = await pool.query(`
            SELECT p.*, f.created_at as favorited_at, u.username as seller_name,
                   (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) as image_url
            FROM favorites f
            JOIN products p ON f.product_id = p.id
            JOIN users u ON p.seller_id = u.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `, [userId]);

        res.json(favorites);
    } catch (error) {
        console.error('Get my favorites error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMyFavoriteIds = async (req, res) => {
    try {
        const userId = req.user.id;
        const [favorites] = await pool.query(
            'SELECT product_id FROM favorites WHERE user_id = ?',
            [userId]
        );
        res.json(favorites.map(f => f.product_id));
    } catch (error) {
        console.error('Get favorite ids error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
