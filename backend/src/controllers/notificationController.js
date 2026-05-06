const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const [notifications] = await pool.query(`
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `, [userId]);

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
