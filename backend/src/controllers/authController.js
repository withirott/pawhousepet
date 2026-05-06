const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.register = async (req, res) => {
    try {
        const { username, password, phone, role } = req.body;
        
        // Basic validation
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Check if user exists
        const [existingUsers] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const finalRole = role === 'admin' ? 'admin' : 'user';
        const [result] = await pool.query(
            'INSERT INTO users (username, password_hash, phone, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, phone || null, finalRole]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                profile_image: user.profile_image
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.query('SELECT id, username, phone, bio, profile_image, role, created_at FROM users WHERE id = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
