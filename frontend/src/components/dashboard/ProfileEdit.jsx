import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/axios';
import useAuthStore from '../../contexts/useAuthStore';
import Swal from 'sweetalert2';
import { FiCamera, FiSave, FiUser } from 'react-icons/fi';

const ProfileEdit = () => {
    const { checkAuth } = useAuthStore();
    const [formData, setFormData] = useState({ email: '', phone: '', bio: '', address: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [qrFile, setQrFile] = useState(null);
    const [qrPreviewUrl, setQrPreviewUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            setFormData({
                email: res.data.email || '',
                phone: res.data.phone || '',
                bio: res.data.bio || '',
                address: res.data.address || ''
            });
            if (res.data.profile_image) {
                setPreviewUrl(`${import.meta.env.VITE_API_URL.replace('/api', '')}${res.data.profile_image}`);
            }
            if (res.data.payment_qr) {
                setQrPreviewUrl(`${import.meta.env.VITE_API_URL.replace('/api', '')}${res.data.payment_qr}`);
            }
        } catch (error) {
            console.error('Failed to load profile', error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                return Swal.fire('ไฟล์ใหญ่เกินไป', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB', 'warning');
            }
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleQrChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                return Swal.fire('ไฟล์ใหญ่เกินไป', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB', 'warning');
            }
            setQrFile(file);
            setQrPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const data = new FormData();
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('bio', formData.bio);
        data.append('address', formData.address);
        if (imageFile) {
            data.append('profileImage', imageFile);
        }
        if (qrFile) {
            data.append('paymentQr', qrFile);
        }

        try {
            await api.put('/users/me', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await checkAuth(); // Refresh global user state
            Swal.fire({
                title: 'สำเร็จ!',
                text: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Update profile error', error);
            Swal.fire('ข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถอัปเดตโปรไฟล์ได้', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return Swal.fire('เกิดข้อผิดพลาด', 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน', 'warning');
        }
        if (passwordData.newPassword.length < 6) {
            return Swal.fire('เกิดข้อผิดพลาด', 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'warning');
        }

        try {
            await api.put('/users/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            Swal.fire('สำเร็จ!', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Change password error', error);
            Swal.fire('ข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in fade-in max-w-2xl mx-auto">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-800">ตั้งค่าโปรไฟล์ส่วนตัว</h2>
                <p className="text-sm text-gray-500 mt-1">อัปเดตข้อมูลและรูปภาพที่คนอื่นจะมองเห็น</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
                {/* Image Upload Area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center text-gray-400">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <FiUser size={64} opacity={0.5} />
                            )}
                        </div>
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="absolute bottom-0 right-0 bg-primary text-white p-3 rounded-full shadow-md hover:bg-primary-dark transition-all transform hover:scale-105"
                        >
                            <FiCamera size={20} />
                        </button>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <p className="text-xs text-gray-400 mt-4">รองรับไฟล์ JPG, PNG, WEBP สูงสุด 5MB</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">อีเมล (Email)</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-gray-50"
                            placeholder="เช่น user@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">เบอร์โทรศัพท์ติดต่อ</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-gray-50"
                            placeholder="เช่น 0812345678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">ที่อยู่ปัจจุบันสำหรับการรับส่งสัตว์เลี้ยง</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            rows="2"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-gray-50 resize-none"
                            placeholder="ระบุที่อยู่เพื่อให้ผู้ใช้อื่นทราบพื้นที่ที่คุณอยู่..."
                        ></textarea>
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                        <label className="block text-sm font-bold text-gray-800 mb-2">ช่องทางการรับเงิน (สำหรับผู้ซื้อโอนตรง)</label>
                        <p className="text-xs text-gray-500 mb-4">ระบุรายละเอียดการรับเงิน เช่น พร้อมเพย์ หรือธนาคาร พร้อมแนบรูป QR Code เพื่อให้ผู้ซื้อสแกนจ่ายได้ง่ายขึ้น</p>
                        
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-grow">
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    rows="4"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-white resize-none"
                                    placeholder="เช่น พร้อมเพย์ 081-234-5678 นายสมชาย ใจดี"
                                ></textarea>
                            </div>
                            <div className="w-full md:w-48 flex-shrink-0">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-2 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors relative h-32">
                                    {qrPreviewUrl ? (
                                        <div className="w-full h-full relative group">
                                            <img src={qrPreviewUrl} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                                <span className="text-white text-xs font-bold">เปลี่ยนรูป</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 flex flex-col items-center">
                                            <FiCamera size={24} className="mb-2" />
                                            <span className="text-xs">อัปโหลด QR Code</span>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        onChange={handleQrChange} 
                                        accept="image/*" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <FiSave size={20} />
                        )}
                        <span>{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                    </button>
                </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-6">
                <h2 className="text-xl font-bold text-gray-800">เปลี่ยนรหัสผ่าน</h2>
                <p className="text-sm text-gray-500 mt-1">อัปเดตรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชีคุณ</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">รหัสผ่านปัจจุบัน</label>
                        <input
                            type="password"
                            required
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-gray-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">รหัสผ่านใหม่</label>
                        <input
                            type="password"
                            required
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-gray-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">ยืนยันรหัสผ่านใหม่</label>
                        <input
                            type="password"
                            required
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-gray-50"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="submit"
                        className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md hover:shadow-lg"
                    >
                        เปลี่ยนรหัสผ่าน
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileEdit;
