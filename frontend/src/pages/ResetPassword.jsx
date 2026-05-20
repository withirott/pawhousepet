import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/axios';
import Swal from 'sweetalert2';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();
    const token = new URLSearchParams(location.search).get('token');

    useEffect(() => {
        if (!token) {
            Swal.fire('ข้อผิดพลาด', 'ไม่พบ Token สำหรับรีเซ็ตรหัสผ่าน', 'error').then(() => {
                navigate('/login');
            });
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password.length < 6) {
            setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            return;
        }
        
        if (password !== confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const res = await api.post('/auth/reset-password', { token, newPassword: password });
            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ',
                text: res.data.message,
                confirmButtonColor: '#ff6b6b'
            }).then(() => {
                navigate('/login');
            });
        } catch (err) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาด ลิงก์อาจหมดอายุแล้ว');
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl animate-fade-in border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <FiLock className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">ตั้งรหัสผ่านใหม่</h2>
                    <p className="text-sm text-gray-500">
                        กรุณากำหนดรหัสผ่านใหม่ที่คุณต้องการใช้งาน
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 mb-2">รหัสผ่านใหม่</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-4 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 focus:bg-white"
                                placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-11 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FiEyeOff size={20}/> : <FiEye size={20}/>}
                            </button>
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 mb-2">ยืนยันรหัสผ่านใหม่</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-4 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 focus:bg-white"
                                placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                            />
                        </div>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-lg">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'บันทึกรหัสผ่านใหม่'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
