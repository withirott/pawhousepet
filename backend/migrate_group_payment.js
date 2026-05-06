const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const migrate = async () => {
    let pool;
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pet_marketplace',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log('Creating transactions table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                buyer_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                slip_image VARCHAR(255) DEFAULT '',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Adding columns to orders table...');
        
        // Use try-catch for altering columns in case they already exist
        const addColumn = async (sql) => {
            try {
                await pool.query(sql);
            } catch (err) {
                if (err.code !== 'ER_DUP_FIELDNAME') {
                    throw err;
                }
            }
        };

        await addColumn(`ALTER TABLE orders ADD COLUMN transaction_id INT DEFAULT NULL`);
        try {
            await pool.query(`ALTER TABLE orders ADD FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL`);
        } catch (e) {
             // Ignore if FK already exists (ER_CANNOT_ADD_FOREIGN_KEY_CONSTRAINT or similar logic applies, but we just ignore error for simplicity in migration script)
        }
        await addColumn(`ALTER TABLE orders ADD COLUMN delivery_proof VARCHAR(255) DEFAULT NULL`);
        await addColumn(`ALTER TABLE orders ADD COLUMN shipped_at DATETIME DEFAULT NULL`);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
