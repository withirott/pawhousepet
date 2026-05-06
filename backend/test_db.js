const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function test() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [users] = await pool.query('SELECT id FROM users LIMIT 1');
        if (users.length === 0) { console.log('No users'); process.exit(0); }
        const userId = users[0].id;

        const [products] = await pool.query('SELECT id FROM products LIMIT 2');
        if (products.length < 2) { console.log('Not enough products'); process.exit(0); }

        console.log(`Inserting for user ${userId}, products ${products.map(p => p.id)}`);
        
        await pool.query('INSERT IGNORE INTO cart_items (user_id, product_id) VALUES (?, ?)', [userId, products[0].id]);
        await pool.query('INSERT IGNORE INTO cart_items (user_id, product_id) VALUES (?, ?)', [userId, products[1].id]);

        const [items] = await pool.query(`
            SELECT c.id as cart_item_id, c.product_id, 
                   p.name, p.price, p.species, p.breed, p.status, p.seller_id,
                   pi.image_url as product_image
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `, [userId]);

        console.log('Cart count:', items.length);
        console.log('Items:', items);
        
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
