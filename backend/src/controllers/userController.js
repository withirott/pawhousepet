const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.query(
            'SELECT id, username, email, phone, bio, address, profile_image, payment_qr, role, verification_status, created_at FROM users WHERE id = ?',
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
        const { email, phone, bio, address } = req.body;
        
        let profileImagePath = null;
        let paymentQrPath = null;
        if (req.files && req.files['profileImage']) {
            profileImagePath = `/uploads/profiles/${req.files['profileImage'][0].filename}`;
        }
        if (req.files && req.files['paymentQr']) {
            paymentQrPath = `/uploads/profiles/${req.files['paymentQr'][0].filename}`;
        }

        // Get current values to not overwrite if absent
        const [currentUser] = await pool.query('SELECT email, phone, bio, address, profile_image, payment_qr FROM users WHERE id = ?', [userId]);
        if (currentUser.length === 0) {
             return res.status(404).json({ message: 'User not found' });
        }

        const newEmail = email !== undefined ? email : currentUser[0].email;
        const newPhone = phone !== undefined ? phone : currentUser[0].phone;
        const newBio = bio !== undefined ? bio : currentUser[0].bio;
        const newAddress = address !== undefined ? address : currentUser[0].address;
        const newImage = profileImagePath ? profileImagePath : currentUser[0].profile_image;
        const newPaymentQr = paymentQrPath ? paymentQrPath : currentUser[0].payment_qr;

        await pool.query(
            'UPDATE users SET email = ?, phone = ?, bio = ?, address = ?, profile_image = ?, payment_qr = ? WHERE id = ?',
            [newEmail, newPhone, newBio, newAddress, newImage, newPaymentQr, userId]
        );

        res.json({
            message: 'Profile updated successfully',
            updated: {
                email: newEmail,
                phone: newPhone,
                bio: newBio,
                address: newAddress,
                profile_image: newImage,
                payment_qr: newPaymentQr
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const bcrypt = require('bcrypt');

// Existing changePassword implementation remains unchanged
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

// ---------- New verification endpoint ----------
const { isValidThaiID } = require('../utils/idValidator');

exports.verifyId = async (req, res) => {
    try {
        const { nationalId } = req.body;
        if (!nationalId || !isValidThaiID(nationalId)) {
            return res.status(400).json({ message: 'เลขบัตรประชาชนไม่ถูกต้อง' });
        }
        
        let idCardImagePath = null;
        if (req.file) {
            idCardImagePath = `/uploads/profiles/${req.file.filename}`;
        } else {
            return res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพบัตรประชาชน' });
        }

        const hash = await bcrypt.hash(nationalId, 12);
        await pool.query('UPDATE users SET national_id_hash = ?, id_card_image = ?, verification_status = "pending" WHERE id = ?', [hash, idCardImagePath, req.user.id]);
        
        res.json({ message: 'ส่งข้อมูลยืนยันตัวตนสำเร็จ กรุณารอแอดมินอนุมัติ' });
    } catch (err) {
        console.error('Verify ID error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
