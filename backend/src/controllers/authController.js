const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        const { username, email, password, phone, role } = req.body;
        
        // Basic validation
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Check if user exists
        const [existingUsers] = await pool.query('SELECT id FROM users WHERE username = ? OR (email = ? AND email IS NOT NULL)', [username, email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const finalRole = role === 'admin' ? 'admin' : 'user';
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
            [username, email || null, hashedPassword, phone || null, finalRole]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body; // 'username' here can be either username or email from frontend

        if (!username || !password) {
            return res.status(400).json({ message: 'Username/Email and password are required' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
        
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
                profile_image: user.profile_image,
                is_seller_verified: !!user.is_seller_verified
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
        const [users] = await pool.query('SELECT id, username, email, phone, bio, profile_image, role, is_seller_verified, created_at FROM users WHERE id = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'กรุณากรอกอีเมล' });

        const [users] = await pool.query('SELECT id, username FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'ไม่พบผู้ใช้งานด้วยอีเมลนี้' });

        const user = users[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?', [resetToken, tokenExpiry, user.id]);

        // Create Ethereal test account (for dev only)
        // In production, use real SMTP details
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const info = await transporter.sendMail({
            from: '"PetPew Admin" <admin@petpew.com>',
            to: email,
            subject: "คำขอรีเซ็ตรหัสผ่าน PetPew",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>สวัสดีคุณ ${user.username}</h2>
                    <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณบน PetPew</p>
                    <p>กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง):</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">ตั้งรหัสผ่านใหม่</a>
                    </div>
                    <p>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
                </div>
            `,
        });

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        res.json({ message: 'ลิงก์สำหรับรีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณแล้ว (หมายเหตุ: ใช้ Ethereal Email เช็ค Console log เพื่อดูลิงก์)', previewUrl: nodemailer.getTestMessageUrl(info) });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });

        const [users] = await pool.query('SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()', [token]);
        
        if (users.length === 0) return res.status(400).json({ message: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือหมดอายุแล้ว' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hashedPassword, users[0].id]);

        res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
