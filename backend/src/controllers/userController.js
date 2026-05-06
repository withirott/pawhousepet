const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.query(
            'SELECT id, username, phone, bio, address, profile_image, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { phone, bio, address } = req.body;
        
        let profileImagePath = null;
        if (req.file) {
            // Re-map actual path considering 'uploads/profiles/'
            profileImagePath = `/uploads/profiles/${req.file.filename}`;
        }

        // Get current values to not overwrite if absent
        const [currentUser] = await pool.query('SELECT phone, bio, address, profile_image FROM users WHERE id = ?', [userId]);
        if (currentUser.length === 0) {
             return res.status(404).json({ message: 'User not found' });
        }

        const newPhone = phone !== undefined ? phone : currentUser[0].phone;
        const newBio = bio !== undefined ? bio : currentUser[0].bio;
        const newAddress = address !== undefined ? address : currentUser[0].address;
        const newImage = profileImagePath ? profileImagePath : currentUser[0].profile_image;

        await pool.query(
            'UPDATE users SET phone = ?, bio = ?, address = ?, profile_image = ? WHERE id = ?',
            [newPhone, newBio, newAddress, newImage, userId]
        );

        res.json({
            message: 'Profile updated successfully',
            updated: {
                phone: newPhone,
                bio: newBio,
                address: newAddress,
                profile_image: newImage
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const bcrypt = require('bcrypt');
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Missing passwords' });
        }

        const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'เปลี่ยนรหัสผ่านเสร็จสิ้น' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
