const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const runMigration = async () => {
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

        console.log('Starting migration for Phase 1 & 3...');

        // 1. Add id_card_image and verification_status
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN id_card_image VARCHAR(255) DEFAULT NULL AFTER national_id_hash`);
            console.log('Added id_card_image column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('id_card_image already exists.');
            else throw e;
        }

        try {
            await pool.query(`ALTER TABLE users ADD COLUMN verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' AFTER id_card_image`);
            console.log('Added verification_status column.');
            
            // Migrate old data: if is_seller_verified is 1, set to verified.
            try {
                await pool.query(`UPDATE users SET verification_status = 'verified' WHERE is_seller_verified = 1`);
                console.log('Migrated old is_seller_verified to verification_status.');
            } catch(e) {
                console.log('Could not migrate is_seller_verified:', e.message);
            }
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('verification_status already exists.');
            else throw e;
        }

        // 2. Add password reset fields
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL`);
            console.log('Added reset_token column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('reset_token already exists.');
            else throw e;
        }

        try {
            await pool.query(`ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL`);
            console.log('Added reset_token_expiry column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('reset_token_expiry already exists.');
            else throw e;
        }

        // 3. Add status column for User Ban feature
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN status ENUM('active', 'banned') DEFAULT 'active'`);
            console.log('Added status column for users.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('status column already exists.');
            else throw e;
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
