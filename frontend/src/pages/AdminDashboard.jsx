import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/axios';
import useAuthStore from '../contexts/useAuthStore';
import Swal from 'sweetalert2';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FiUsers, FiBox, FiShoppingBag, FiDollarSign, FiPieChart, FiBarChart2, FiImage, FiCheck, FiX, FiTruck } from 'react-icons/fi';
import UserManagement from '../components/admin/UserManagement';

const AdminDashboard = () => {
    const { user, loading: authLoading } = useAuthStore();
    const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, users

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, ordersRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/orders')
            ]);
            setStats(statsRes.data);
            setOrders(ordersRes.data);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            Swal.fire('Error', 'Failed to load Dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (orderId, action) => {
        const actionText = action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ';
        const confirmResult = await Swal.fire({
            title: `ยืนยันการ${actionText}?`,
            text: `คุณกำลังจะ${actionText}การชำระเงินนี้`,
            icon: action === 'approve' ? 'question' : 'warning',
            showCancelButton: true,
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: action === 'approve' ? '#10b981' : '#ef4444',
            confirmButtonText: `ใช่, ${actionText}เลย!`
        });

        if (confirmResult.isConfirmed) {
            try {
                await api.put(`/admin/transactions/${orderId}/verify`, { action });
                Swal.fire('สำเร็จ', `${actionText}เรียบร้อยแล้ว`, 'success');
                fetchDashboardData(); 
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถดำเนินการได้', 'error');
            }
        }
    };

    const viewSlip = (imageUrl) => {
        Swal.fire({
            title: 'หลักฐานการชำระเงิน',
            imageUrl: `${import.meta.env.VITE_API_URL.replace('/api', '')}${imageUrl}`,
            imageAlt: 'สลิปโอนเงิน',
            customClass: { image: 'max-h-96 object-contain' },
            confirmButtonText: 'ปิด'
        });
    };

    const viewDeliveryProofs = (proofsStr) => {
        if (!proofsStr) return;
        const proofs = proofsStr.split(',');
        
        if (proofs.length === 1) {
            Swal.fire({
                title: 'หลักฐานการจัดส่ง',
                imageUrl: `${import.meta.env.VITE_API_URL.replace('/api', '')}${proofs[0]}`,
                imageAlt: 'หลักฐานการจัดส่ง',
                customClass: { image: 'max-h-96 object-contain' },
                confirmButtonText: 'ปิด'
            });
        } else {
            let html = '<div class="flex flex-col space-y-4">';
            proofs.forEach((proof, idx) => {
                html += `<div class="font-bold text-left text-gray-700">รายการที่ ${idx+1}</div>
                         <img src="${import.meta.env.VITE_API_URL.replace('/api', '')}${proof}" class="max-h-64 object-contain rounded-lg border border-gray-200 mx-auto" />`;
            });
            html += '</div>';

            Swal.fire({
                title: 'หลักฐานการจัดส่งทั้งหมด',
                html: html,
                customClass: { popup: 'w-auto max-w-2xl' },
                confirmButtonText: 'ปิด'
            });
        }
    };

    // Protect route
    if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

    const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price);
    const formatDate = (dateString) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in fade-in">
            <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end">
                <div>
                    <h1 className="text-4xl font-black text-secondary tracking-tight">ระบบของแอดมิน</h1>
                    <p className="text-gray-500 mt-2 text-lg">ภาพรวมระบบทั้งหมด และตรวจสอบสัดส่วนการเงิน</p>
                </div>
                
                {/* Admin Tabs */}
                <div className="flex space-x-2 mt-4 md:mt-0 p-1 bg-gray-100 rounded-full w-max">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        ตรวจสอบข้อมูล & ออเดอร์
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        จัดการผู้ใช้งานระบบ
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'users' ? (
                        <UserManagement />
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><FiUsers size={24} /></div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium tracking-wide">ผู้ใช้งานทั้งหมด</p>
                                        <p className="text-2xl font-black text-gray-900">{stats.totalUsers}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><FiBox size={24} /></div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium tracking-wide">สินค้ารอขาย</p>
                                        <p className="text-2xl font-black text-gray-900">{stats.totalProducts}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><FiShoppingBag size={24} /></div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium tracking-wide">ออเดอร์ทั้งหมด</p>
                                        <p className="text-2xl font-black text-gray-900">{stats.totalOrders}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                                    <div className="p-3 bg-green-100 text-green-600 rounded-xl"><FiDollarSign size={24} /></div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium tracking-wide">เม็ดเงินหมุนเวียน</p>
                                        <p className="text-2xl font-black text-gray-900">{formatPrice(stats.totalRevenue)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            {orders.length > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                                    {/* Pie Chart: Payment Statuses */}
                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center w-full">
                                            <FiPieChart className="mr-2 text-primary" /> สัดส่วนสถานะการตรวจสอบสลิป
                                        </h3>
                                        <div className="w-full h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'รอตรวจสอบบัญชี', value: orders.filter(o => o.payment_status === 'pending').length },
                                                            { name: 'อนุมัติผ่านแล้ว', value: orders.filter(o => o.payment_status === 'approved').length },
                                                            { name: 'การโอนเงินถูกปฏิเสธ', value: orders.filter(o => o.payment_status === 'rejected').length }
                                                        ]}
                                                        cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value"
                                                    >
                                                        <Cell fill="#f59e0b" /> {/* Amber */}
                                                        <Cell fill="#10b981" /> {/* Emerald */}
                                                        <Cell fill="#ef4444" /> {/* Red */}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => [value, 'ออเดอร์']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Bar Chart: Recent Transactions (Mock grouped by date if possible, but we'll show general order volume) */}
                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
                                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center w-full">
                                            <FiBarChart2 className="mr-2 text-primary" /> ภาพรวมข้อมูลของแอป
                                        </h3>
                                        <div className="w-full h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart 
                                                    data={[
                                                        { name: 'ผู้ใช้งาน', สถิติ: stats.totalUsers },
                                                        { name: 'สินค้ารอขาย', สถิติ: stats.totalProducts },
                                                        { name: 'ยอดออเดอร์', สถิติ: stats.totalOrders }
                                                    ]}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    <Bar dataKey="สถิติ" fill="#ff6b6b" radius={[6, 6, 0, 0]} barSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Orders Table */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-800">ยืนยันสลิปและใบสั่งซื้อ</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm tracking-wider">
                                                <th className="p-4 font-medium">รหัสบิลรวม</th>
                                                <th className="p-4 font-medium">วันเวลา</th>
                                                <th className="p-4 font-medium">รายการสัตว์เลี้ยง</th>
                                                <th className="p-4 font-medium">ยอดโอน (บาท)</th>
                                                <th className="p-4 font-medium">สถานะการชำระเงิน</th>
                                                <th className="p-4 font-medium text-center">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.length === 0 ? (
                                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">ไม่พบประวัติการสั่งซื้อ</td></tr>
                                            ) : (
                                                orders.map(order => (
                                                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                        <td className="p-4 text-sm font-medium text-gray-900">#TRX-{order.id.toString().padStart(4, '0')}</td>
                                                        <td className="p-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                                                        <td className="p-4">
                                                            <p className="text-sm font-bold text-gray-800 line-clamp-2 max-w-xs" title={order.product_names}>{order.product_names}</p>
                                                            <p className="text-xs text-gray-500 mt-1">ผู้ซื้อ: <span className="text-secondary font-medium">{order.buyer_name}</span></p>
                                                            <p className="text-xs text-gray-400">จำนวน: {order.item_count} รายการ</p>
                                                        </td>
                                                        <td className="p-4 text-sm font-extrabold text-primary">{formatPrice(order.total_price)}</td>
                                                        <td className="p-4 text-sm">
                                                            {order.payment_status === 'pending' && <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-bold">รอตรวจสลิป</span>}
                                                            {order.payment_status === 'approved' && <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold">ตรวจสอบสำเร็จ</span>}
                                                            {order.payment_status === 'rejected' && <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-bold">ถูกปฏิเสธ</span>}
                                                        </td>
                                                        <td className="p-4 flex items-center justify-center space-x-2">
                                                            {order.slip_image ? (
                                                                <button 
                                                                    onClick={() => window.open(getFullImageUrl(order.slip_image), '_blank')}
                                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                                    title="ดูสลิปโอนเงิน"
                                                                >
                                                                    <FiImage size={18} />
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">ยังไม่อัปสลิป</span>
                                                            )}
                                                            
                                                            {order.delivery_proofs && (
                                                                <button 
                                                                    onClick={() => viewDeliveryProofs(order.delivery_proofs)}
                                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors ml-1"
                                                                    title="ดูหลักฐานการจัดส่ง"
                                                                >
                                                                    <FiTruck size={18} />
                                                                </button>
                                                            )}
                                                            
                                                            {order.payment_status === 'pending' && order.slip_image && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleVerify(order.id, 'approve')}
                                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                        title="อนุมัติ"
                                                                    >
                                                                        <FiCheck size={18} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleVerify(order.id, 'reject')}
                                                                        title="ปฏิเสธสลิปและยกเลิกออเดอร์"
                                                                    >
                                                                        <FiX size={18} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
