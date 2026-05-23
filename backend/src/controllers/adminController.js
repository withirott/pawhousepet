const pool = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "user"');
        const [products] = await pool.query('SELECT COUNT(*) as total FROM products');
        const [orders] = await pool.query('SELECT COUNT(*) as total FROM orders');
        const [revenue] = await pool.query('SELECT SUM(total_price) as total FROM orders WHERE status = "completed"');

        res.json({
            totalUsers: users[0].total,
            totalProducts: products[0].total,
            totalOrders: orders[0].total,
            totalRevenue: revenue[0].total || 0
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getAllTransactions = async (req, res) => {
    try {
        const [transactions] = await pool.query(`
            SELECT t.id, t.total_amount as total_price, t.status as payment_status, t.created_at, t.slip_image,
                   u.username as buyer_name,
                   (SELECT COUNT(*) FROM orders o WHERE o.transaction_id = t.id) as item_count,
                   (SELECT GROUP_CONCAT(p.name SEPARATOR ', ') 
                    FROM orders o JOIN products p ON o.product_id = p.id 
                    WHERE o.transaction_id = t.id) as product_names,
                   (SELECT GROUP_CONCAT(o.delivery_proof SEPARATOR ',') 
                    FROM orders o 
                    WHERE o.transaction_id = t.id AND o.delivery_proof IS NOT NULL AND o.delivery_proof != '') as delivery_proofs
            FROM transactions t
            JOIN users u ON t.buyer_id = u.id
            ORDER BY t.created_at DESC
        `);

        res.json(transactions);
    } catch (error) {
        console.error('Admin get transactions error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.verifyTransaction = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { transactionId } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const [transactions] = await connection.query('SELECT status, buyer_id FROM transactions WHERE id = ? FOR UPDATE', [transactionId]);
        
        if (transactions.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const transaction = transactions[0];
        const io = req.app.get('io');

        if (action === 'approve') {
            await connection.query('UPDATE transactions SET status = "approved" WHERE id = ?', [transactionId]);
            await connection.query('UPDATE orders SET status = "shipping" WHERE transaction_id = ?', [transactionId]);
            
            // Notify buyer
            await connection.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [transaction.buyer_id, 'order', 'หลักฐานการชำระเงินของคุณถูกยืนยันแล้ว รอผู้ขายทำการจัดส่ง/ส่งมอบสัตว์เลี้ยงได้เลย!']
            );
            if (io) io.to(`user_${transaction.buyer_id}`).emit('new_notification');

            // Notify sellers
            const [orders] = await connection.query('SELECT p.seller_id, p.name FROM orders o JOIN products p ON o.product_id = p.id WHERE o.transaction_id = ?', [transactionId]);
            for (const order of orders) {
                await connection.query(
                    'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                    [order.seller_id, 'order', `เว็บยืนยันยอดเงินของ ${order.name} แล้ว! กรุณาทำรายการนัดรับ/จัดส่งได้เลย`]
                );
                if (io) io.to(`user_${order.seller_id}`).emit('new_notification');
            }

            await connection.commit();
            res.json({ message: 'Transaction approved' });
            
        } else if (action === 'reject') {
            await connection.query('UPDATE transactions SET status = "rejected" WHERE id = ?', [transactionId]);
            await connection.query('UPDATE orders SET status = "cancelled" WHERE transaction_id = ?', [transactionId]);
            
            // Revert product status
            const [orders] = await connection.query('SELECT product_id FROM orders WHERE transaction_id = ?', [transactionId]);
            for (const order of orders) {
                await connection.query('UPDATE products SET status = "available" WHERE id = ?', [order.product_id]);
            }
            
            // Notify buyer
            await connection.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [transaction.buyer_id, 'order', 'สลิปการชำระเงินรวมของคุณถูกปฏิเสธ ออเดอร์และคำสั่งซื้อถูกยกเลิกแล้ว']
            );
            if (io) io.to(`user_${transaction.buyer_id}`).emit('new_notification');

            await connection.commit();
            res.json({ message: 'Transaction rejected and cancelled' });
        } else {
            await connection.rollback();
            res.status(400).json({ message: 'Invalid action' });
        }

    } catch (error) {
        await connection.rollback();
        console.error('Admin verify error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, phone, role, created_at, bio, profile_image, verification_status, status, id_card_image FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Prevent admin from demoting themselves to avoid locking the system
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // MySQL ON DELETE CASCADE will handle associated products, orders, chats
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getPendingKYC = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, id_card_image, created_at FROM users WHERE verification_status = "pending" ORDER BY created_at ASC');
        res.json(users);
    } catch (error) {
        console.error('Get pending KYC error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.approveKYC = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE users SET verification_status = "verified" WHERE id = ?', [id]);
        
        const io = req.app.get('io');
        if (io) io.to(`user_${id}`).emit('new_notification');
        await pool.query('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)', [id, 'new_product', 'การยืนยันตัวตนของคุณได้รับการอนุมัติแล้ว! ตอนนี้คุณสามารถลงขายสินค้าได้ทันที']);
        
        res.json({ message: 'KYC approved successfully' });
    } catch (error) {
        console.error('Approve KYC error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.rejectKYC = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE users SET verification_status = "rejected", id_card_image = NULL WHERE id = ?', [id]);
        
        const io = req.app.get('io');
        if (io) io.to(`user_${id}`).emit('new_notification');
        await pool.query('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)', [id, 'new_product', 'การยืนยันตัวตนถูกปฏิเสธ กรุณาอัปโหลดรูปถ่ายบัตรประชาชนใหม่อีกครั้ง']);
        
        res.json({ message: 'KYC rejected successfully' });
    } catch (error) {
        console.error('Reject KYC error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.banUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) return res.status(400).json({ message: 'Cannot ban yourself' });
        
        await pool.query('UPDATE users SET status = "banned" WHERE id = ?', [id]);
        // Also hide their products
        await pool.query('UPDATE products SET status = "reserved" WHERE seller_id = ?', [id]); // Just hide them
        
        res.json({ message: 'User banned successfully' });
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.unbanUser = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE users SET status = "active" WHERE id = ?', [id]);
        res.json({ message: 'User unbanned successfully' });
    } catch (error) {
        console.error('Unban user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
