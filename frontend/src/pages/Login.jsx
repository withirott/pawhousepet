import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../contexts/useAuthStore';
import api from '../services/axios';
import Swal from 'sweetalert2';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/auth/login', formData);
            const { token, user } = response.data;

            login(user, token);

            Swal.fire({
                icon: 'success',
                title: 'ยินดีต้อนรับกลับมา!',
                text: 'เข้าสู่ระบบสำเร็จแล้ว',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });

            navigate('/');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'เข้าสู่ระบบไม่สำเร็จ',
                text: error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#f97316',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-orange-100/60">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🐾</div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        เข้าสู่ระบบ PetPew
                    </h2>
                    <p className="mt-3 text-sm text-gray-500">
                        หรือ{' '}
                        <Link
                            to="/register"
                            className="font-semibold text-orange-500 hover:text-orange-600 transition-colors underline underline-offset-2"
                        >
                            สมัครสมาชิกใหม่
                        </Link>
                    </p>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Username / Email */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                            ชื่อผู้ใช้งาน หรือ อีเมล
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all sm:text-sm"
                            placeholder="ชื่อผู้ใช้งาน หรือ อีเมล"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                            รหัสผ่าน
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all sm:text-sm"
                            placeholder="รหัสผ่าน"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Forgot Password */}
                    <div className="flex items-center justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
                        >
                            ลืมรหัสผ่าน?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl text-white shadow-md transition-all duration-200 ${
                                loading
                                    ? 'bg-orange-300 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 hover:shadow-lg active:scale-[0.98]'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    กำลังเข้าสู่ระบบ...
                                </>
                            ) : (
                                'เข้าสู่ระบบ'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
