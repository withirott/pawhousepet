const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const [products] = await pool.query('SELECT id, name, seller_id, status FROM products');
    console.log("Products:", products);
    process.exit(0);
}
check();
