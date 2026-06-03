const pool = require('../config/db');

exports.addReview = async (req, res) => {
    try {
        const reviewerId = req.user.id;
        const { orderId, rating, comment } = req.body;

        if (!orderId || !rating) {
            return res.status(400).json({ message: 'Order ID and rating are required' });
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Verify order belongs to user and is completed - JOIN products to get seller_id
        const [orders] = await pool.query(
            `SELECT o.id, o.status, p.seller_id 
             FROM orders o 
             JOIN products p ON o.product_id = p.id 
             WHERE o.id = ? AND o.buyer_id = ?`,
            [orderId, reviewerId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อนี้' });
        }

        const order = orders[0];

        if (order.status !== 'completed') {
            return res.status(400).json({ message: 'สามารถรีวิวได้เฉพาะออเดอร์ที่สำเร็จแล้วเท่านั้น' });
        }

        // Insert review
        try {
            await pool.query(
                'INSERT INTO reviews (order_id, reviewer_id, seller_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
                [orderId, reviewerId, order.seller_id, rating, comment || null]
            );

            // Notify seller
            const io = req.app.get('io');
            if (io) io.to(`user_${order.seller_id}`).emit('new_notification');
            await pool.query('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)', 
                [order.seller_id, 'new_product', 'คุณได้รับรีวิวใหม่จากผู้ซื้อ']);

            res.status(201).json({ message: 'รีวิวสำเร็จ ขอบคุณสำหรับความคิดเห็น!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'คุณได้รีวิวออเดอร์นี้ไปแล้ว' });
            }
            throw error;
        }
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getSellerReviews = async (req, res) => {
    try {
        const { sellerId } = req.params;

        const [reviews] = await pool.query(`
            SELECT r.id, r.rating, r.comment, r.created_at, u.username as reviewer_name, u.profile_image as reviewer_image
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            WHERE r.seller_id = ?
            ORDER BY r.created_at DESC
        `, [sellerId]);

        // Calculate average
        const [avgResult] = await pool.query(`
            SELECT AVG(rating) as averageRating, COUNT(id) as totalReviews
            FROM reviews
            WHERE seller_id = ?
        `, [sellerId]);

        res.json({
            reviews,
            stats: {
                averageRating: parseFloat(avgResult[0].averageRating || 0).toFixed(1),
                totalReviews: avgResult[0].totalReviews
            }
        });
    } catch (error) {
        console.error('Get seller reviews error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
