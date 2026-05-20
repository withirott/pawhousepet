const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log('Running email migration...');
        
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN email VARCHAR(255) UNIQUE NULL AFTER username;
        `);
        
        console.log('Migration successful!');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column email already exists. Skipping.');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        process.exit();
    }
}

migrate();
