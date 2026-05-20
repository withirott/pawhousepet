const pool = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const { search, species, min_price, max_price, age, gender, location } = req.query;
        let query = `
            SELECT p.*, u.username as seller_name, pi.image_url 
            FROM products p
            JOIN users u ON p.seller_id = u.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            WHERE p.status = 'available'
        `;
        const queryParams = [];

        if (search) {
            query += ` AND p.name LIKE ?`;
            queryParams.push(`%${search}%`);
        }
        if (species) {
            query += ` AND p.species = ?`;
            queryParams.push(species);
        }
        if (min_price) {
            query += ` AND p.price >= ?`;
            queryParams.push(min_price);
        }
        if (max_price) {
            query += ` AND p.price <= ?`;
            queryParams.push(max_price);
        }
        if (age) {
            query += ` AND p.age_months <= ?`;
            queryParams.push(age);
        }
        if (gender && gender !== '') {
            query += ` AND p.gender = ?`;
            queryParams.push(gender);
        }
        if (location && location !== '') {
            query += ` AND p.location LIKE ?`;
            queryParams.push(`%${location}%`);
        }

        query += ` ORDER BY p.created_at DESC`;

        const [products] = await pool.query(query, queryParams);
        res.json(products);
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMyProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        const [products] = await pool.query(`
            SELECT p.*, pi.image_url 
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            WHERE p.seller_id = ?
            ORDER BY p.created_at DESC
        `, [userId]);
        
        res.json(products);
    } catch (error) {
        console.error('Get my products error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        
        const [products] = await pool.query(`
            SELECT p.*, u.username as seller_name, u.phone as seller_phone, u.profile_image as seller_image, u.bio as seller_payment_info, u.payment_qr as seller_payment_qr
            FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE p.id = ?
        `, [productId]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const [images] = await pool.query('SELECT image_url, is_primary FROM product_images WHERE product_id = ?', [productId]);

        const productDetail = {
            ...products[0],
            images: images
        };

        res.json(productDetail);
    } catch (error) {
        console.error('Get product details error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.createProduct = async (req, res) => {
    // Requires database transaction
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const sellerId = req.user.id;
        const { name, age_months, species, breed, vaccine_status, description, price, gender, location, lat, lng } = req.body;

        let vaccineCertPath = null;
        if (req.files['vaccineCert'] && req.files['vaccineCert'].length > 0) {
            vaccineCertPath = `/uploads/vaccines/${req.files['vaccineCert'][0].filename}`;
        }

        const [result] = await connection.query(`
            INSERT INTO products 
            (seller_id, name, age_months, species, breed, vaccine_status, vaccine_cert, description, price, gender, location, lat, lng) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [sellerId, name, age_months || null, species || null, breed || null, vaccine_status === 'true' || vaccine_status === true, vaccineCertPath, description || null, price || 0, gender || 'Unknown', location || null, lat || null, lng || null]);

        const productId = result.insertId;

        // Handle Image Uploads
        if (req.files['productImage'] && req.files['productImage'].length > 0) {
            const imageValues = req.files['productImage'].map((file, index) => {
                const isPrimary = index === 0; // First image is primary
                return [productId, `/uploads/products/${file.filename}`, isPrimary];
            });

            await connection.query(
                'INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?',
                [imageValues]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Product created successfully', productId });
    } catch (error) {
        await connection.rollback();
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
        const { status, price, description, name, age_months, species, breed, vaccine_status, gender, location, lat, lng } = req.body;

        // Verify ownership or admin
        const [products] = await pool.query('SELECT seller_id, vaccine_cert FROM products WHERE id = ?', [productId]);
        
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (products[0].seller_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized action' });
        }

        let vaccineCertPath = products[0].vaccine_cert;
        if (req.files && req.files['vaccineCert'] && req.files['vaccineCert'].length > 0) {
            vaccineCertPath = `/uploads/vaccines/${req.files['vaccineCert'][0].filename}`;
        }

        const isVaccinated = vaccine_status === 'true' || vaccine_status === true || vaccine_status === 1;

        await pool.query(
            `UPDATE products SET 
             status = COALESCE(?, status), 
             price = COALESCE(?, price), 
             description = COALESCE(?, description),
             name = COALESCE(?, name),
             age_months = COALESCE(?, age_months),
             species = COALESCE(?, species),
             breed = COALESCE(?, breed),
             vaccine_status = ?,
             vaccine_cert = ?,
             gender = COALESCE(?, gender),
             location = COALESCE(?, location),
             lat = COALESCE(?, lat),
             lng = COALESCE(?, lng)
             WHERE id = ?`,
            [status, price, description, name, age_months, species, breed, isVaccinated, vaccineCertPath, gender, location, lat, lng, productId]
        );

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Verify ownership or admin
        const [products] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [productId]);
        
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (products[0].seller_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized action' });
        }

        await pool.query('DELETE FROM products WHERE id = ?', [productId]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
