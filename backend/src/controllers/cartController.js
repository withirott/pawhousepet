const pool = require('../config/db');

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const [items] = await pool.query(`
            SELECT c.id as cart_item_id, c.product_id, 
                   p.name, p.price, p.species, p.breed, p.status, p.seller_id,
                   pi.image_url as product_image
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `, [userId]);

        res.json(items);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        // Check product exists and is available
        const [products] = await pool.query('SELECT status, seller_id FROM products WHERE id = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        if (products[0].seller_id === userId) {
            return res.status(400).json({ message: 'You cannot add your own pet to cart.' });
        }

        if (products[0].status !== 'available') {
            return res.status(400).json({ message: 'Pet is no longer available.' });
        }

        // Try to insert, ignore if already exists (UNIQUE KEY handles it)
        await pool.query('INSERT IGNORE INTO cart_items (user_id, product_id) VALUES (?, ?)', [userId, productId]);

        res.status(201).json({ message: 'Added to cart successfully' });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);

        res.json({ message: 'Removed from cart' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.checkoutAll = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const buyerId = req.user.id;

        // Fetch cart items and lock products
        const [cartItems] = await connection.query(`
            SELECT c.product_id, p.price, p.status, p.seller_id, p.name 
            FROM cart_items c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ? 
            FOR UPDATE
        `, [buyerId]);

        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'ตะกร้าของคุณว่างเปล่า' });
        }

        let totalAmount = 0;
        let isFreeOnly = true;

        for (const item of cartItems) {
            if (item.status !== 'available') {
                await connection.rollback();
                return res.status(400).json({ message: `ขออภัย ${item.name} ไม่พร้อมขายแล้ว (ถูกสั่งซื้อไปแล้ว)` });
            }
            totalAmount += parseFloat(item.price);
            if (parseFloat(item.price) > 0) isFreeOnly = false;
        }

        // Create transaction
        const transactionStatus = isFreeOnly ? 'approved' : 'pending';
        const [transResult] = await connection.query(
            'INSERT INTO transactions (buyer_id, total_amount, status) VALUES (?, ?, ?)',
            [buyerId, totalAmount, transactionStatus]
        );
        const transactionId = transResult.insertId;

        // Create orders and update products
        for (const item of cartItems) {
            const isFree = parseFloat(item.price) === 0;
            const orderStatus = isFree ? 'completed' : 'pending';
            const productStatus = isFree ? 'sold' : 'reserved';

            // Insert order
            await connection.query(
                'INSERT INTO orders (buyer_id, product_id, transaction_id, total_price, status) VALUES (?, ?, ?, ?, ?)',
                [buyerId, item.product_id, transactionId, item.price, orderStatus]
            );

            // Update product
            await connection.query('UPDATE products SET status = ? WHERE id = ?', [productStatus, item.product_id]);

            // Notify seller
            const msg = isFree ? `มีผู้ขอรับสัตว์เลี้ยงฟรี (${item.name}) ของคุณแล้ว!` : `คุณได้รับคำสั่งซื้อใหม่สำหรับ ${item.name}`;
            await connection.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [item.seller_id, 'order', msg]
            );
            const io = req.app.get('io');
            if (io) io.to(`user_${item.seller_id}`).emit('new_notification');
        }

        // Clear cart
        await connection.query('DELETE FROM cart_items WHERE user_id = ?', [buyerId]);

        await connection.commit();
        res.status(201).json({ message: 'สั่งซื้อสำเร็จ', transactionId, isFreeOnly });
    } catch (error) {
        await connection.rollback();
        console.error('Checkout cart error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
};
