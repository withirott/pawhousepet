const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pet_marketplace',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function migrate() {
    try {
        console.log('Adding lat, lng columns to products table...');
        
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN lat DECIMAL(10, 8) NULL DEFAULT NULL AFTER location,
            ADD COLUMN lng DECIMAL(11, 8) NULL DEFAULT NULL AFTER lat;
        `);
        
        console.log('Migration completed successfully!');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist. Skipping.');
        } else {
            console.error('Migration failed:', error);
        }
    } process.exit(0);
}

migrate();
