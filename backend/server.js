const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const initializeSocket = require('./src/sockets');
const io = initializeSocket(server);
app.set('io', io);

// Middleware
app.use(cors({ origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const favoriteRoutes = require('./src/routes/favoriteRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/transactions', require('./src/routes/transactionRoutes'));

app.get('/', (req, res) => {
    res.send('Pet Marketplace API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Cron Job for Auto-Completion (Runs every hour)
const cron = require('node-cron');
const pool = require('./src/config/db');

cron.schedule('0 * * * *', async () => {
    try {
        const [orders] = await pool.query(`
            SELECT o.id, o.product_id, p.seller_id 
            FROM orders o 
            JOIN products p ON o.product_id = p.id
            WHERE o.status = "shipping" AND o.shipped_at < NOW() - INTERVAL 3 DAY
        `);
        
        for (const order of orders) {
            await pool.query('UPDATE orders SET status = "completed" WHERE id = ?', [order.id]);
            await pool.query('UPDATE products SET status = "sold" WHERE id = ?', [order.product_id]);
            
            // Notify seller
            await pool.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [order.seller_id, 'order', 'ระบบได้ยืนยันการรับสัตว์เลี้ยงอัตโนมัติ (ครบ 3 วัน) ออเดอร์เสร็จสมบูรณ์']
            );
            if (io) io.to(`user_${order.seller_id}`).emit('new_notification');
        }
        if (orders.length > 0) {
            console.log(`[Cron] Auto-completed ${orders.length} orders.`);
        }
    } catch (error) {
        console.error('[Cron] Error auto-completing orders:', error);
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
