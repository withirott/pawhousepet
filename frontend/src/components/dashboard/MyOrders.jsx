import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiClock, FiCheckCircle, FiXCircle, FiUpload } from 'react-icons/fi';
import Swal from 'sweetalert2';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/me');
            setOrders(res.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleUploadSlip = async (e, orderId) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            return Swal.fire('ไฟล์ใหญ่เกินไป', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB', 'warning');
        }

        const formData = new FormData();
        formData.append('slipImage', file);

        try {
            Swal.fire({
                title: 'กำลังอัปโหลด...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });
            await api.post(`/orders/${orderId}/upload-slip`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Swal.fire('สำเร็จ', 'อัปโหลดสลิปเรียบร้อยแล้ว รอการตรวจสอบจากผู้ขาย', 'success');
            fetchOrders(); // Refresh
        } catch (error) {
            console.error('Upload slip error', error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถอัปโหลดสลิปได้', 'error');
        }
    };

    const handleCancelOrder = async (orderId) => {
        Swal.fire({
            title: 'ต้องการยกเลิกคำสั่งซื้อ?',
            text: "แน่ใจหรือไม่ว่าจะยกเลิกคำสั่งซื้อ? สัตว์เลี้ยงตัวนี้จะถูกส่งกลับสู่ตลาดเปิดท้ายให้คนอื่นซื้อต่อได้",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4f',
            cancelButtonColor: '#d1d5db',
            confirmButtonText: 'ยืนยันการยกเลิก',
            cancelButtonText: 'ปิดหน้าต่าง'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'กำลังยกเลิก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    await api.put(`/orders/${orderId}/cancel`);
                    Swal.fire('ยกเลิกสำเร็จ!', 'สัตว์เลี้ยงตัวนี้ถูกส่งกลับคืนสู่ระบบเรียบร้อยแล้ว', 'success');
                    fetchOrders();
                } catch (error) {
                    Swal.fire('ข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถยกเลิกคำสั่งซื้อนี้ได้', 'error');
                }
            }
        });
    };

    const handleConfirmReceipt = async (orderId) => {
        Swal.fire({
            title: 'ได้รับสัตว์เลี้ยงแล้วใช่ไหม?',
            text: "หากคุณกดยืนยัน ระบบจะถือว่าการซื้อขายเสร็จสมบูรณ์ และพร้อมจะโอนเงินให้ผู้ขาย",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#d1d5db',
            confirmButtonText: 'ยืนยันได้รับแล้ว',
            cancelButtonText: 'ยังไม่ได้รับ'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'กำลังดำเนินการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    await api.put(`/orders/${orderId}/receipt`);
                    Swal.fire('สำเร็จ!', 'ดีใจด้วยครับ! การทำรายการเสร็จสมบูรณ์แล้ว', 'success');
                    fetchOrders();
                } catch (error) {
                    Swal.fire('ข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถทำรายการได้', 'error');
                }
            }
        });
    };

    const getFullImageUrl = (path) => `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
    const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price);
    const formatDate = (dateString) => new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 flex items-center justify-center rounded-full font-bold w-full max-w-[120px]"><FiClock className="mr-1" /> รอตรวจสอบ</span>;
            case 'shipping':
                return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 flex items-center justify-center rounded-full font-bold w-full max-w-[120px]"><FiCheckCircle className="mr-1" /> รอนัดรับ/จัดส่ง</span>;
            case 'completed':
                return <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 flex items-center justify-center rounded-full font-bold w-full max-w-[120px]"><FiCheckCircle className="mr-1" /> สำเร็จแล้ว</span>;
            case 'cancelled':
            case 'failed':
                return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 flex items-center justify-center rounded-full font-bold w-full max-w-[120px]"><FiXCircle className="mr-1" /> ยกเลิก/ปฏิเสธ</span>;
            default:
                return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 flex items-center justify-center rounded-full font-bold w-full max-w-[120px]">{status}</span>;
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in fade-in">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center"><FiShoppingBag className="mr-2 text-primary" /> ประวัติการสั่งซื้อของฉัน</h2>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm tracking-wider">
                                <th className="p-4 font-bold">ข้อมูลสัตว์เลี้ยง</th>
                                <th className="p-4 font-bold">ราคา</th>
                                <th className="p-4 font-bold">วันที่สั่งซื้อ</th>
                                <th className="p-4 font-bold">สถานะ</th>
                                <th className="p-4 font-bold text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center text-gray-400 font-medium">คุณยังไม่มีประวัติการสั่งซื้อ เริ่มต้นค้นหาสัตว์เลี้ยงที่คุณถูกใจเลย!</td></tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-16 w-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-white">
                                                    <img src={order.product_image ? getFullImageUrl(order.product_image) : 'https://via.placeholder.com/100'} alt={order.product_name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-base">{order.product_name}</p>
                                                    <p className="text-xs text-primary font-medium mt-0.5">รหัสสั่งซื้อ: #{String(order.id).slice(0,8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-black text-secondary text-lg">{formatPrice(order.total_price)}</td>
                                        <td className="p-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                                        <td className="p-4">
                                            {renderStatusBadge(order.payment_status === 'failed' ? 'failed' : order.order_status)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {(order.order_status === 'pending') && (!order.payment_status || order.payment_status === 'pending') ? (
                                                <div className="flex flex-col space-y-2 items-center">
                                                    <Link 
                                                        to={`/payment/${order.transaction_id}`}
                                                        className="inline-flex items-center justify-center px-4 py-2 bg-primary/10 text-primary font-bold text-xs rounded-full cursor-pointer hover:bg-primary hover:text-white transition-all transform hover:scale-105 shadow-sm w-32"
                                                    >
                                                        <FiUpload className="mr-1.5" /> ชำระเงิน/อัปสลิป
                                                    </Link>
                                                    {(!order.slip_image || order.slip_image === '') && (
                                                        <button 
                                                            onClick={() => handleCancelOrder(order.id)}
                                                            className="inline-flex items-center justify-center px-4 py-2 bg-red-50 text-red-500 font-bold text-xs rounded-full cursor-pointer hover:bg-red-500 hover:text-white transition-all transform hover:scale-105 shadow-sm w-32"
                                                        >
                                                            <FiXCircle className="mr-1.5" /> ยกเลิกรายการ
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (order.order_status === 'shipping') ? (
                                                <button 
                                                    onClick={() => handleConfirmReceipt(order.id)}
                                                    className="inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white font-bold text-xs rounded-full cursor-pointer hover:bg-green-600 transition-all transform hover:scale-105 shadow-sm w-full font-sans tracking-wide"
                                                >
                                                    <FiCheckCircle className="mr-1.5" /> ได้รับสัตว์เลี้ยงแล้ว
                                                </button>
                                            ) : (order.order_status === 'cancelled') ? (
                                                <span className="text-red-400 text-xs font-bold bg-red-50 px-3 py-1.5 rounded-full border border-red-100">ถูกยกเลิกแล้ว</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs font-bold bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">ผูกมัด / ดำเนินการไปแล้ว</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MyOrders;
