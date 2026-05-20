import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axios';
import Swal from 'sweetalert2';
import { FiUploadCloud, FiCheckCircle, FiShield } from 'react-icons/fi';

const Payment = () => {
    const { transactionId } = useParams();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [slipImage, setSlipImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const res = await api.get(`/transactions/${transactionId}`);
                setTransaction(res.data);
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อมูลคำสั่งซื้อ', 'error');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [transactionId, navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                return Swal.fire('คำเตือน', 'ไฟล์ภาพต้องมีขนาดไม่เกิน 5MB', 'warning');
            }
            if (!file.type.startsWith('image/')) {
                return Swal.fire('คำเตือน', 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', 'warning');
            }
            setSlipImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!slipImage) return Swal.fire('คำเตือน', 'กรุณาอัปโหลดสลิป', 'warning');

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('slip_image', slipImage);

            await api.post(`/transactions/${transactionId}/slip`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ!',
                text: 'อัปโหลดสลิปเรียบร้อยแล้ว กรุณารอแอดมินตรวจสอบ'
            }).then(() => {
                navigate('/dashboard', { state: { tab: 'orders' } });
            });
        } catch (error) {
            Swal.fire('ข้อผิดพลาด', error.response?.data?.message || 'อัปโหลดไม่สำเร็จ', 'error');
        } finally {
            setUploading(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(price) || 0);

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div></div>;

    if (!transaction) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-black text-gray-800 mb-8 text-center">ชำระเงินค่าสัตว์เลี้ยง</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Code Section */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center">
                    <h2 className="text-xl font-bold mb-4 text-center">ช่องทางการชำระเงิน</h2>
                    <div className="w-full space-y-4">
                        {Array.from(new Set(transaction.orders?.map(o => o.seller_id))).map(sellerId => {
                            const sellerOrders = transaction.orders.filter(o => o.seller_id === sellerId);
                            const sellerName = sellerOrders[0].seller_name;
                            const paymentInfo = sellerOrders[0].seller_payment_info || 'ไม่ระบุข้อมูลการรับเงิน กรุณาแชทถามผู้ขาย';
                            const sellerQr = sellerOrders[0].seller_payment_qr;
                            const sellerTotal = sellerOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
                            
                            return (
                                <div key={sellerId} className="bg-gray-50 border border-gray-200 p-5 rounded-2xl flex flex-col sm:flex-row gap-4">
                                    <div className="flex-grow">
                                        <p className="font-bold text-gray-800 text-lg mb-2">ผู้ขาย: {sellerName}</p>
                                        <p className="text-primary font-black text-2xl mb-3">ยอดโอน: {formatPrice(sellerTotal)}</p>
                                        <div className="bg-white p-3 rounded-xl border border-gray-100 text-sm whitespace-pre-wrap text-gray-700 mb-2">
                                            {paymentInfo}
                                        </div>
                                        <p className="text-xs text-gray-500 flex items-center">
                                            <FiShield className="text-green-500 mr-1" />
                                            หากมีหลายผู้ขาย กรุณาโอนแยกและรวมสลิปในรูปเดียว
                                        </p>
                                    </div>
                                    {sellerQr ? (
                                        <div className="flex-shrink-0 flex items-center justify-center bg-white p-2 rounded-xl border border-gray-200 shadow-sm h-36 w-36 self-center">
                                            <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${sellerQr}`} alt="Seller QR Code" className="w-full h-full object-contain rounded-lg" />
                                        </div>
                                    ) : (
                                        <div className="flex-shrink-0 flex items-center justify-center bg-gray-100 text-gray-400 p-2 rounded-xl border border-gray-200 border-dashed h-36 w-36 self-center text-xs text-center font-medium px-4">
                                            ไม่มี QR Code
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Upload Slip Section */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col">
                    <h2 className="text-xl font-bold mb-6">อัปโหลดสลิปการโอนเงิน</h2>
                    
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 relative hover:bg-gray-50 transition-colors">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Slip preview" className="max-h-64 object-contain rounded-lg" />
                        ) : (
                            <div className="text-center">
                                <FiUploadCloud className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                                <p className="text-gray-600 font-medium">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวางที่นี่</p>
                                <p className="text-xs text-gray-400 mt-2">รองรับ JPG, PNG ขนาดไม่เกิน 5MB</p>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>

                    <div className="mt-8">
                        <button 
                            onClick={handleUpload}
                            disabled={!slipImage || uploading}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <><FiCheckCircle size={20} /> ยืนยันการชำระเงิน</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Order Items Preview */}
            <div className="mt-10 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">รายการสัตว์เลี้ยงในบิลนี้ ({transaction.orders?.length} รายการ)</h3>
                <ul className="space-y-3">
                    {transaction.orders?.map(order => (
                        <li key={order.id} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl">
                            <span className="font-medium text-gray-700">{order.name} ({order.species})</span>
                            <span className="font-bold text-gray-900">{formatPrice(order.total_price)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Payment;
