const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log('Running seller verification migration...');
        
        // Add columns
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN national_id_hash VARCHAR(255) NULL,
            ADD COLUMN is_seller_verified BOOLEAN NOT NULL DEFAULT FALSE;
        `);
        
        console.log('Migration successful!');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist. Skipping.');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        process.exit();
    }
}

migrate();
