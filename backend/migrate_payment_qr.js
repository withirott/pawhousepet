const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log('Running migration: Add payment_qr column to users table...');
        
        // Add payment_qr column if it doesn't exist
        const [columns] = await pool.query(`SHOW COLUMNS FROM users LIKE 'payment_qr'`);
        if (columns.length === 0) {
            await pool.query(`ALTER TABLE users ADD COLUMN payment_qr VARCHAR(255) DEFAULT NULL AFTER bio`);
            console.log('Success: payment_qr column added to users table.');
        } else {
            console.log('Skipped: payment_qr column already exists.');
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
