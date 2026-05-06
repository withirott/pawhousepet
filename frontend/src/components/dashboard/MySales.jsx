import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import { FiDollarSign, FiClock, FiCheckCircle, FiXCircle, FiUser, FiPhone } from 'react-icons/fi';
import Swal from 'sweetalert2';
const MySales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = async () => {
        try {
            const res = await api.get('/orders/me/sales');
            setSales(res.data);
        } catch (error) {
            console.error('Failed to fetch sales:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const handleUploadProof = async (orderId) => {
        const { value: file } = await Swal.fire({
            title: 'อัปโหลดหลักฐานการจัดส่ง',
            text: 'กรุณาอัปโหลดรูปภาพใบเสร็จ/Tracking',
            input: 'file',
            inputAttributes: {
                'accept': 'image/*',
                'aria-label': 'อัปโหลดหลักฐานการจัดส่ง'
            },
            showCancelButton: true,
            confirmButtonText: 'อัปโหลด',
            cancelButtonText: 'ยกเลิก'
        });

        if (file) {
            const formData = new FormData();
            formData.append('delivery_proof', file);
            try {
                await api.post(`/orders/${orderId}/delivery-proof`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire('สำเร็จ', 'อัปโหลดหลักฐานเรียบร้อยแล้ว ระบบจะยืนยันอัตโนมัติใน 3 วันหากผู้ซื้อไม่กดยอมรับ', 'success');
                fetchSales();
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถอัปโหลดได้', 'error');
            }
        }
    };

    const getFullImageUrl = (path) => `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
    const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price);
    const formatDate = (dateString) => new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 flex items-center justify-center rounded-full font-bold w-full max-w-[140px]"><FiClock className="mr-1" /> ลูกค้ายังไม่อัปสลิป</span>;
            case 'shipping':
                return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 flex items-center justify-center rounded-full font-bold w-full max-w-[140px]"><FiCheckCircle className="mr-1" /> รอคุณจัดส่ง/นัดรับ</span>;
            case 'approved':
            case 'completed':
                return <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 flex items-center justify-center rounded-full font-bold w-full max-w-[140px]"><FiCheckCircle className="mr-1" /> เสร็จสมบูรณ์แล้ว</span>;
            case 'rejected':
            case 'failed':
            case 'cancelled':
                return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 flex items-center justify-center rounded-full font-bold w-full max-w-[140px]"><FiXCircle className="mr-1" /> สลิปไม่ผ่าน/ยกเลิก</span>;
            default:
                return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 flex items-center justify-center rounded-full font-bold w-full max-w-[140px]">{status}</span>;
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in fade-in">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center"><FiDollarSign className="mr-2 text-primary" /> รายการขายของฉัน</h2>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm tracking-wider">
                                <th className="p-4 font-bold">ข้อมูลสัตว์เลี้ยง</th>
                                <th className="p-4 font-bold">ข้อมูลคนซื้อ</th>
                                <th className="p-4 font-bold">ราคา</th>
                                <th className="p-4 font-bold">วันที่ทำรายการ</th>
                                <th className="p-4 font-bold text-center">สถานะการชำระเงิน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center text-gray-400 font-medium">คุณยังไม่มีรายการขายในขณะนี้</td></tr>
                            ) : (
                                sales.map(sale => (
                                    <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-16 w-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-white">
                                                    <img src={sale.product_image ? getFullImageUrl(sale.product_image) : 'https://via.placeholder.com/100'} alt={sale.product_name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-base">{sale.product_name}</p>
                                                    <p className="text-xs text-primary font-medium mt-0.5">Sale ID: #{String(sale.id).slice(0,8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-bold text-gray-800 flex items-center"><FiUser className="mr-1.5 text-secondary" /> {sale.buyer_name}</p>
                                                <p className="text-xs text-gray-500 flex items-center"><FiPhone className="mr-1.5 text-gray-400" /> {sale.buyer_phone || 'ไม่ได้ระบุเบอร์'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 font-black text-secondary text-lg">{formatPrice(sale.total_price)}</td>
                                        <td className="p-4 text-sm text-gray-500">{formatDate(sale.created_at)}</td>
                                        <td className="p-4 text-center">
                                            {renderStatusBadge(sale.payment_status === 'rejected' ? 'rejected' : sale.order_status)}
                                            {sale.order_status === 'shipping' && !sale.delivery_proof && (
                                                <button 
                                                    onClick={() => handleUploadProof(sale.id)}
                                                    className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-full transition-colors"
                                                >
                                                    อัปโหลดหลักฐานการส่ง
                                                </button>
                                            )}
                                            {sale.delivery_proof && (
                                                <div className="mt-2 text-xs text-green-600 font-bold flex items-center justify-center">
                                                    <FiCheckCircle className="mr-1" /> ส่งหลักฐานแล้ว
                                                </div>
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

export default MySales;
