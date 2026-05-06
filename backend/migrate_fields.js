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

        console.log('Adding location and gender columns...');
        await pool.query(`ALTER TABLE products ADD COLUMN gender ENUM('Male', 'Female', 'Unknown') DEFAULT 'Unknown'`);
        await pool.query(`ALTER TABLE products ADD COLUMN location VARCHAR(255) DEFAULT NULL`);
        console.log('Successfully added location and gender columns!');

        // Also update schema.sql for future reference? Yes.
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist.');
            process.exit(0);
        } else {
            console.error('Migration failed:', err);
            process.exit(1);
        }
    }
};

addFields();
