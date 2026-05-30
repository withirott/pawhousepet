import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/axios';
import Swal from 'sweetalert2';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password.length < 6) {
            Swal.fire({
                icon: 'warning',
                title: 'รหัสผ่านสั้นเกินไป',
                text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
                confirmButtonColor: '#34d399',
                confirmButtonText: 'ตกลง',
            });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'รหัสผ่านไม่ตรงกัน',
                text: 'กรุณากรอกรหัสผ่านให้ตรงกันทั้งสองช่อง',
                confirmButtonColor: '#34d399',
                confirmButtonText: 'ตกลง',
            });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                role: 'user',
            });

            Swal.fire({
                icon: 'success',
                title: 'สมัครสมาชิกสำเร็จ!',
                text: 'คุณสามารถเข้าสู่ระบบด้วยบัญชีของคุณได้แล้ว',
                confirmButtonColor: '#34d399',
                confirmButtonText: 'เข้าสู่ระบบ',
            });

            navigate('/login');
        } catch (error) {
            const msg = error.response?.data?.message;
            let errorText = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
            if (msg?.toLowerCase().includes('duplicate') || msg?.toLowerCase().includes('already')) {
                errorText = 'ชื่อผู้ใช้งานหรืออีเมลนี้ถูกใช้งานแล้ว';
            } else if (msg) {
                errorText = msg;
            }

            Swal.fire({
                icon: 'error',
                title: 'สมัครสมาชิกไม่สำเร็จ',
                text: errorText,
                confirmButtonColor: '#34d399',
                confirmButtonText: 'ตกลง',
            });
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 sm:text-sm bg-gray-50/50';

    return (
        <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50/30 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100/80">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🐾</div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        สร้างบัญชีผู้ใช้ใหม่
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        มีบัญชีแล้ว?{' '}
                        <Link
                            to="/login"
                            className="font-semibold text-primary hover:text-primary-dark transition-colors underline underline-offset-2"
                        >
                            เข้าสู่ระบบที่นี่
                        </Link>
                    </p>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Username */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                            ชื่อผู้ใช้งาน <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            className={inputClass}
                            placeholder="ชื่อผู้ใช้งาน"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                            อีเมล <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className={inputClass}
                            placeholder="อีเมล"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                            เบอร์โทรศัพท์ <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            className={inputClass}
                            placeholder="เบอร์โทรศัพท์ (ไม่บังคับ)"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                            รหัสผ่าน <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className={inputClass}
                            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                            ยืนยันรหัสผ่าน <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            className={inputClass}
                            placeholder="ยืนยันรหัสผ่าน"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`relative w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white shadow-md ${
                                loading
                                    ? 'bg-primary-light cursor-not-allowed opacity-80'
                                    : 'bg-primary hover:bg-primary-dark hover:shadow-lg active:scale-[0.98]'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200`}
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    กำลังดำเนินการ...
                                </>
                            ) : (
                                'สมัครสมาชิก'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
