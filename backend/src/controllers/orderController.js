const pool = require('../config/db');

exports.createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const buyerId = req.user.id;
        const { productId } = req.body;

        // Check product status
        const [products] = await connection.query('SELECT seller_id, price, status FROM products WHERE id = ? FOR UPDATE', [productId]);
        
        if (products.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = products[0];

        if (product.seller_id === buyerId) {
            await connection.rollback();
            return res.status(400).json({ message: 'You cannot buy your own pet.' });
        }

        if (product.status !== 'available') {
            await connection.rollback();
            return res.status(400).json({ message: 'Pet is no longer available.' });
        }

        // Create the order
        const isFree = parseFloat(product.price) === 0;
        const orderStatus = isFree ? 'completed' : 'pending';
        const [orderResult] = await connection.query(
            'INSERT INTO orders (buyer_id, product_id, total_price, status) VALUES (?, ?, ?, ?)',
            [buyerId, productId, product.price, orderStatus]
        );

        const orderId = orderResult.insertId;

        // Create initial payment record
        const paymentStatus = isFree ? 'approved' : 'pending';
        await connection.query(
            'INSERT INTO payments (order_id, slip_image, status) VALUES (?, "", ?)',
            [orderId, paymentStatus]
        );

        // Reserve or Sell the product
        const nextProductStatus = isFree ? 'sold' : 'reserved';
        await connection.query('UPDATE products SET status = ? WHERE id = ?', [nextProductStatus, productId]);

        // Send Notification to Seller
        if (isFree) {
            await connection.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [product.seller_id, 'order', `มีผู้ขอรับสัตว์เลี้ยงฟรี (${product.name}) ของคุณแล้ว!`]
            );
        } else {
            await connection.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [product.seller_id, 'order', `คุณได้รับคำสั่งซื้อใหม่สำหรับ ${product.name}`]
            );
        }
        const io = req.app.get('io');
        if (io) io.to(`user_${product.seller_id}`).emit('new_notification');

        await connection.commit();
        res.status(201).json({ message: isFree ? 'Adoption requested successfully' : 'Order created successfully', orderId, isFree });
    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

exports.uploadSlip = async (req, res) => {
    try {
        const orderId = req.params.id;
        const buyerId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a payment slip image' });
        }

        const slipUrl = `/uploads/slips/${req.file.filename}`;

        // Verify order belongs to user
        const [orders] = await pool.query('SELECT buyer_id FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0 || orders[0].buyer_id !== buyerId) {
            return res.status(403).json({ message: 'Unauthorized or Order not found' });
        }

        // Update Payment record
        await pool.query('UPDATE payments SET slip_image = ?, status = "pending" WHERE order_id = ?', [slipUrl, orderId]);

        // Fetch seller details to notify them
        const [orderData] = await pool.query(`
            SELECT p.seller_id, p.name FROM orders o 
            JOIN products p ON o.product_id = p.id 
            WHERE o.id = ?
        `, [orderId]);

        if (orderData.length > 0) {
            const sellerId = orderData[0].seller_id;
            await pool.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [sellerId, 'order', `ผู้ซื้อได้อัปโหลดสลิปการชำระเงินสำหรับ ${orderData[0].name} แล้ว`]
            );
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${sellerId}`).emit('new_notification');
            }
        }

        res.json({ message: 'Slip uploaded successfully. Waiting for seller/admin confirmation.', slipUrl });
    } catch (error) {
        console.error('Upload slip error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const [orders] = await pool.query(`
            SELECT o.id, o.transaction_id, o.total_price, o.status as order_status, o.created_at,
                   p.name as product_name, p.species,
                   pi.image_url as product_image,
                   t.status as payment_status, t.slip_image
            FROM orders o
            JOIN products p ON o.product_id = p.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            LEFT JOIN transactions t ON o.transaction_id = t.id
            WHERE o.buyer_id = ?
            ORDER BY o.created_at DESC
        `, [buyerId]);

        res.json(orders);
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMySales = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const [sales] = await pool.query(`
            SELECT o.id, o.transaction_id, o.total_price, o.status as order_status, o.created_at, o.delivery_proof,
                   p.name as product_name,
                   pi.image_url as product_image,
                   u.username as buyer_name, u.phone as buyer_phone,
                   t.status as payment_status
            FROM orders o
            JOIN products p ON o.product_id = p.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            JOIN users u ON o.buyer_id = u.id
            LEFT JOIN transactions t ON o.transaction_id = t.id
            WHERE p.seller_id = ?
            ORDER BY o.created_at DESC
        `, [sellerId]);

        res.json(sales);
    } catch (error) {
        console.error('Get my sales error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        const [orders] = await pool.query(`
            SELECT o.*, 
                   p.name as product_name, p.seller_id,
                   u.username as seller_name, u.phone as seller_phone,
                   pay.slip_image, pay.status as payment_status
            FROM orders o
            JOIN products p ON o.product_id = p.id
            JOIN users u ON p.seller_id = u.id
            LEFT JOIN payments pay ON o.id = pay.order_id
            WHERE o.id = ?
        `, [orderId]);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[0];

        // Ensure only buyer, seller, or admin can view
        if (order.buyer_id !== userId && order.seller_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        res.json(order);
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.cancelOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const orderId = req.params.id;
        const buyerId = req.user.id;

        // Fetch order with payment slip details
        const [orders] = await connection.query(`
            SELECT o.*, p.status as payment_status, p.slip_image 
            FROM orders o 
            LEFT JOIN payments p ON o.id = p.order_id 
            WHERE o.id = ? FOR UPDATE
        `, [orderId]);
        
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[0];

        // Ensure buyer owns order
        if (order.buyer_id !== buyerId) {
            await connection.rollback();
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Must be in pending state AND must not have uploaded a slip
        if (order.status !== 'pending' || (order.slip_image && order.slip_image !== '')) {
            await connection.rollback();
            return res.status(400).json({ message: 'ไม่สามารถยกเลิกคำสั่งซื้อได้ เนื่องจากมีการโอนเงินหรืออัปสลิปไปแล้ว กรุณาติดต่อแอดมิน' });
        }

        // Update order status
        await connection.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [orderId]);

        // Update product status back to available
        await connection.query('UPDATE products SET status = "available" WHERE id = ?', [order.product_id]);

        await connection.commit();
        res.json({ message: 'ยกเลิกคำสั่งซื้อสำเร็จ สัตว์เลี้ยงถูกคืนสู่ระบบเปิดขาย' });
    } catch (error) {
        await connection.rollback();
        console.error('Cancel order error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

exports.confirmReceipt = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const orderId = req.params.id;
        const buyerId = req.user.id;

        // Fetch order
        const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[0];

        // Ensure buyer owns order
        if (order.buyer_id !== buyerId) {
            await connection.rollback();
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Must be in shipping state
        if (order.status !== 'shipping') {
            await connection.rollback();
            return res.status(400).json({ message: 'ไม่สามารถดำเนินการได้ เนื่องจากสถานะคำสั่งซื้อไม่ถูกต้อง' });
        }

        // Update order status
        await connection.query('UPDATE orders SET status = "completed" WHERE id = ?', [orderId]);

        // Update product status to sold
        await connection.query('UPDATE products SET status = "sold" WHERE id = ?', [order.product_id]);

        // Notify seller
        const [products] = await connection.query('SELECT seller_id, name FROM products WHERE id = ?', [order.product_id]);
        await connection.query(
            'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
            [products[0].seller_id, 'order', `ผู้ซื้อยืนยันได้รับ ${products[0].name} เรียบร้อยแล้ว! ออเดอร์เสร็จสมบูรณ์ แอดมินจะรอบริหารจัดการโอนเงินให้ต่อไป`]
        );
        const io = req.app.get('io');
        if (io) io.to(`user_${products[0].seller_id}`).emit('new_notification');

        await connection.commit();
        res.json({ message: 'ยืนยันการรับสำเร็จ! ขอบคุณที่ใช้บริการส่วนกลางของเรา' });
    } catch (error) {
        await connection.rollback();
        console.error('Confirm receipt error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

exports.uploadDeliveryProof = async (req, res) => {
    const pool = require('../config/db');
    try {
        const orderId = req.params.id;
        const sellerId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a delivery proof image' });
        }

        const proofUrl = `/uploads/proofs/${req.file.filename}`;

        // Verify order belongs to seller's product and is in shipping state
        const [orders] = await pool.query(`
            SELECT o.id, o.status, p.seller_id, o.buyer_id, p.name 
            FROM orders o 
            JOIN products p ON o.product_id = p.id 
            WHERE o.id = ?
        `, [orderId]);

        if (orders.length === 0 || orders[0].seller_id !== sellerId) {
            return res.status(403).json({ message: 'Unauthorized or Order not found' });
        }

        if (orders[0].status !== 'shipping') {
            return res.status(400).json({ message: 'Order is not in shipping status' });
        }

        // Update order with proof and shipped_at
        await pool.query('UPDATE orders SET delivery_proof = ?, shipped_at = NOW() WHERE id = ?', [proofUrl, orderId]);

        // Notify buyer
        await pool.query(
            'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
            [orders[0].buyer_id, 'order', `ผู้ขายได้จัดส่ง ${orders[0].name} แล้ว กรุณากดยืนยันเมื่อได้รับสัตว์เลี้ยง`]
        );
        const io = req.app.get('io');
        if (io) io.to(`user_${orders[0].buyer_id}`).emit('new_notification');

        res.json({ message: 'Delivery proof uploaded successfully', proofUrl });
    } catch (error) {
        console.error('Upload delivery proof error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
