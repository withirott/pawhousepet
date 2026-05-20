import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/axios';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl animate-fade-in border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <FiMail className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">ลืมรหัสผ่าน?</h2>
                    <p className="text-sm text-gray-500">
                        กรอกอีเมลที่คุณใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้
                    </p>
                </div>

                {success ? (
                    <div className="rounded-2xl bg-green-50 p-6 border border-green-100 text-center animate-fade-in">
                        <FiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-green-800 mb-2">ส่งลิงก์สำเร็จแล้ว!</h3>
                        <p className="text-sm text-green-700 mb-6">
                            กรุณาตรวจสอบกล่องจดหมายของคุณ (รวมถึงโฟลเดอร์จดหมายขยะ) เพื่อทำการตั้งรหัสผ่านใหม่
                        </p>
                        <Link to="/login" className="text-primary font-bold hover:text-primary-dark">
                            กลับไปหน้าเข้าสู่ระบบ
                        </Link>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                                อีเมล
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm bg-gray-50 focus:bg-white"
                                placeholder="name@example.com"
                            />
                            {error && <p className="text-red-500 text-sm mt-2 text-center font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    'ส่งลิงก์รีเซ็ตรหัสผ่าน'
                                )}
                            </button>
                        </div>
                        
                        <div className="text-center mt-6">
                            <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                <FiArrowLeft className="mr-2" /> กลับไปหน้าเข้าสู่ระบบ
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
