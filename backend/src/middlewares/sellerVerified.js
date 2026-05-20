const pool = require('../config/db');

module.exports = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const [users] = await pool.query('SELECT verification_status FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0 || users[0].verification_status !== 'verified') {
      return res.status(403).json({ message: 'กรุณายืนยันตัวตนผู้ขายก่อนเพิ่มสินค้า' });
    }
    next();
  } catch (error) {
    console.error('sellerVerified middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
