const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const addFields = async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pet_marketplace',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log('Altering orders enum...');
        await pool.query(`ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'shipping', 'completed', 'cancelled') DEFAULT 'pending'`);
        console.log('Successfully altered orders.status to include shipping!');

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

addFields();
