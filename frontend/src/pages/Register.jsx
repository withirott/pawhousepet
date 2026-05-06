import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/axios';
import Swal from 'sweetalert2';

const Register = () => {
    const [formData, setFormData] = useState({ 
        username: '', 
        password: '', 
        confirmPassword: '',
        phone: '',
        role: 'user' 
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Passwords do not match!',
                confirmButtonColor: '#34d399'
            });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', {
                username: formData.username,
                password: formData.password,
                phone: formData.phone,
                role: formData.role
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Registration Successful!',
                text: 'You can now sign in with your account.',
                confirmButtonColor: '#34d399'
            });
            
            navigate('/login');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: error.response?.data?.message || 'Something went wrong',
                confirmButtonColor: '#34d399'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        Create an Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition">
                            Sign in here
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-2">
                        <div>
                            <label htmlFor="username" className="sr-only">ชื่อผู้ใช้งาน</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="sr-only">เบอร์โทร (Optional)</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">รหัสผ่าน</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">ยืนยันรหัสผ่าน</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-primary-light cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors`}
                        >
                            {loading ? 'Registering...' : 'Sign up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
