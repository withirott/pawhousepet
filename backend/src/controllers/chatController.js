const pool = require('../config/db');

exports.getChats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch chats where user is either buyer or seller
        const [chats] = await pool.query(`
            SELECT c.*, 
                   p.name as product_name,
                   pi.image_url as product_image,
                   ub.username as buyer_name,
                   ub.profile_image as buyer_image,
                   us.username as seller_name,
                   us.profile_image as seller_image,
                   (SELECT content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time
            FROM chats c
            JOIN products p ON c.product_id = p.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            JOIN users ub ON c.buyer_id = ub.id
            JOIN users us ON c.seller_id = us.id
            WHERE c.buyer_id = ? OR c.seller_id = ?
            ORDER BY last_message_time DESC
        `, [userId, userId]);

        res.json(chats);
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const chatId = req.params.id;
        const userId = req.user.id;

        // Verify user is part of the chat
        const [chats] = await pool.query('SELECT buyer_id, seller_id FROM chats WHERE id = ?', [chatId]);
        if (chats.length === 0 || (chats[0].buyer_id !== userId && chats[0].seller_id !== userId)) {
            return res.status(403).json({ message: 'Unauthorized access to chat' });
        }

        const [messages] = await pool.query(`
            SELECT m.*, u.username as sender_name 
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE chat_id = ?
            ORDER BY m.created_at ASC
        `, [chatId]);

        // Mark unread messages from the OTHER person as read
        await pool.query(`
            UPDATE messages 
            SET is_read = TRUE 
            WHERE chat_id = ? AND sender_id != ? AND is_read = FALSE
        `, [chatId, userId]);

        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createOrGetChat = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const { productId } = req.body;

        // Get product seller
        const [products] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const sellerId = products[0].seller_id;

        if (buyerId === sellerId) {
            return res.status(400).json({ message: 'Cannot chat with yourself' });
        }

        // Check if chat exists
        const [existing] = await pool.query(
            'SELECT id FROM chats WHERE product_id = ? AND buyer_id = ? AND seller_id = ?',
            [productId, buyerId, sellerId]
        );

        if (existing.length > 0) {
            return res.json({ chatId: existing[0].id });
        }

        // Create new chat
        const [result] = await pool.query(
            'INSERT INTO chats (product_id, buyer_id, seller_id) VALUES (?, ?, ?)',
            [productId, buyerId, sellerId]
        );

        res.status(201).json({ chatId: result.insertId });
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
