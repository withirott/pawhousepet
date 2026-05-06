const pool = require('../config/db');

exports.getTransaction = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const buyerId = req.user.id;

        const [transactions] = await pool.query('SELECT * FROM transactions WHERE id = ? AND buyer_id = ?', [transactionId, buyerId]);
        if (transactions.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const transaction = transactions[0];

        // Fetch associated orders
        const [orders] = await pool.query(`
            SELECT o.id, o.total_price, p.name, p.species, pi.image_url as product_image
            FROM orders o
            JOIN products p ON o.product_id = p.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            WHERE o.transaction_id = ?
        `, [transactionId]);

        transaction.orders = orders;
        res.json(transaction);
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.uploadSlip = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const buyerId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a payment slip image' });
        }

        const slipUrl = `/uploads/slips/${req.file.filename}`;

        // Verify transaction belongs to user
        const [transactions] = await pool.query('SELECT buyer_id FROM transactions WHERE id = ?', [transactionId]);
        if (transactions.length === 0 || transactions[0].buyer_id !== buyerId) {
            return res.status(403).json({ message: 'Unauthorized or Transaction not found' });
        }

        // Update Transaction record
        await pool.query('UPDATE transactions SET slip_image = ?, status = "pending" WHERE id = ?', [slipUrl, transactionId]);

        res.json({ message: 'Slip uploaded successfully. Waiting for admin confirmation.', slipUrl });
    } catch (error) {
        console.error('Upload slip error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
