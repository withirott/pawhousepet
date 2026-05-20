import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import Swal from 'sweetalert2';
import { FiUsers, FiBox, FiShoppingBag, FiDollarSign, FiCheckCircle, FiXCircle, FiSlash, FiShield } from 'react-icons/fi';

const AdminPanel = () => {
    const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
    const [kycRequests, setKycRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, kyc, users

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, kycRes, usersRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/kyc/pending'),
                api.get('/admin/users')
            ]);
            setStats(statsRes.data);
            setKycRequests(kycRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Failed to fetch admin data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleKYC = async (id, action) => {
        try {
            const res = await api.patch(`/admin/kyc/${id}/${action}`);
            Swal.fire('สำเร็จ', res.data.message, 'success');
            fetchData();
        } catch (error) {
            Swal.fire('ล้มเหลว', error.response?.data?.message || 'ไม่สามารถดำเนินการได้', 'error');
        }
    };

    const handleBan = async (id, action) => { // action = 'ban' or 'unban'
        try {
            const confirm = await Swal.fire({
                title: action === 'ban' ? 'ยืนยันการแบนผู้ใช้งาน?' : 'ยืนยันการปลดแบน?',
                text: action === 'ban' ? 'ผู้ใช้จะไม่สามารถลงขายสินค้าได้ และสินค้าเดิมจะถูกซ่อน' : 'ผู้ใช้จะสามารถกลับมาใช้งานได้ตามปกติ',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: action === 'ban' ? '#ef4444' : '#10b981',
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก'
            });

            if (confirm.isConfirmed) {
                const res = await api.patch(`/admin/users/${id}/${action}`);
                Swal.fire('สำเร็จ', res.data.message, 'success');
                fetchData();
            }
        } catch (error) {
            Swal.fire('ล้มเหลว', error.response?.data?.message || 'ไม่สามารถดำเนินการได้', 'error');
        }
    };

    const getFullImageUrl = (path) => `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
    const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(price) || 0);

    if (loading) return <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary"></div></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FiShield className="mr-2 text-primary" /> จัดการระบบหลังบ้าน (Admin)
            </h2>

            {/* Tabs */}
            <div className="flex space-x-2 mb-8 border-b border-gray-100 pb-2 overflow-x-auto">
                <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>สถิติรวม</button>
                <button onClick={() => setActiveTab('kyc')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center ${activeTab === 'kyc' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                    คำขอยืนยันตัวตน 
                    {kycRequests.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{kycRequests.length}</span>}
                </button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>จัดการผู้ใช้งาน</button>
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-md">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold opacity-90">ผู้ใช้งานทั้งหมด</h3><FiUsers size={24} className="opacity-70" /></div>
                        <p className="text-4xl font-black">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-md">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold opacity-90">ประกาศทั้งหมด</h3><FiBox size={24} className="opacity-70" /></div>
                        <p className="text-4xl font-black">{stats.totalProducts}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-md">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold opacity-90">คำสั่งซื้อทั้งหมด</h3><FiShoppingBag size={24} className="opacity-70" /></div>
                        <p className="text-4xl font-black">{stats.totalOrders}</p>
                    </div>
                    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-md">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold opacity-90">ยอดซื้อขายรวม</h3><FiDollarSign size={24} className="opacity-70" /></div>
                        <p className="text-3xl font-black truncate" title={formatPrice(stats.totalRevenue)}>{formatPrice(stats.totalRevenue)}</p>
                    </div>
                </div>
            )}

            {activeTab === 'kyc' && (
                <div>
                    {kycRequests.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <FiCheckCircle size={48} className="mx-auto mb-4 text-green-300" />
                            <p className="text-lg">ไม่มีคำขอยืนยันตัวตนค้างอยู่</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {kycRequests.map(req => (
                                <div key={req.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                                    <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-800">{req.username}</p>
                                            <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col items-center">
                                        <div className="h-48 w-full bg-gray-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center relative cursor-pointer" onClick={() => Swal.fire({imageUrl: getFullImageUrl(req.id_card_image), title: 'รูปบัตรประชาชน', width: 800})}>
                                            {req.id_card_image ? (
                                                <img src={getFullImageUrl(req.id_card_image)} alt="ID Card" className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-gray-400">ไม่มีรูปภาพ</span>
                                            )}
                                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                                                <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs opacity-0 hover:opacity-100">คลิกขยายรูป</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-3 w-full">
                                            <button onClick={() => handleKYC(req.id, 'approve')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center transition-colors shadow-sm">
                                                <FiCheckCircle className="mr-2" /> อนุมัติ
                                            </button>
                                            <button onClick={() => handleKYC(req.id, 'reject')} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold flex items-center justify-center transition-colors shadow-sm">
                                                <FiXCircle className="mr-2" /> ปฏิเสธ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">ผู้ใช้</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">บทบาท</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">KYC สถานะ</th>
                                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">สถานะแบน</th>
                                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-white font-bold overflow-hidden shadow-sm">
                                                {u.profile_image ? <img src={getFullImageUrl(u.profile_image)} alt="" className="h-full w-full object-cover"/> : u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-gray-900">{u.username}</div>
                                                <div className="text-xs text-gray-500">{u.phone || 'ไม่มีเบอร์โทร'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.verification_status === 'verified' ? 'bg-green-100 text-green-800' : u.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : u.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {u.verification_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {u.status === 'banned' ? (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Banned</span>
                                        ) : (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {u.role !== 'admin' && (
                                            u.status === 'banned' ? (
                                                <button onClick={() => handleBan(u.id, 'unban')} className="text-green-600 hover:text-green-900 font-bold bg-green-50 px-3 py-1 rounded-lg">ปลดแบน</button>
                                            ) : (
                                                <button onClick={() => handleBan(u.id, 'ban')} className="text-red-600 hover:text-red-900 font-bold bg-red-50 px-3 py-1 rounded-lg flex items-center mx-auto"><FiSlash className="mr-1"/> แบนผู้ใช้</button>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
