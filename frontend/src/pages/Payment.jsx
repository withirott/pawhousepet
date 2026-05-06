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
                    <h2 className="text-xl font-bold mb-4 text-center">สแกน QR Code เพื่อชำระเงิน</h2>
                    <div className="bg-gray-100 p-4 rounded-2xl mb-6 flex justify-center items-center w-64 h-64 border-4 border-primary/20">
                        {/* Mock QR Code. In real world, generate via PromptPay library */}
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="PromptPay QR" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    
                    <div className="w-full bg-primary/5 rounded-xl p-6 text-center border border-primary/10">
                        <p className="text-gray-500 font-medium mb-2">ยอดรวมที่ต้องชำระ</p>
                        <p className="text-4xl font-black text-primary mb-4">{formatPrice(transaction.total_amount)}</p>
                        <p className="text-sm text-gray-600 mb-1">โอนเข้าบัญชี: <span className="font-bold text-gray-800">Pet Marketplace (Escrow)</span></p>
                        <p className="text-sm text-gray-600">พร้อมเพย์: <span className="font-bold tracking-widest text-gray-800">099-XXX-XXXX</span></p>
                    </div>

                    <div className="mt-6 flex items-start text-sm text-gray-500 bg-gray-50 p-4 rounded-xl w-full">
                        <FiShield className="text-green-500 mt-1 mr-3 shrink-0" size={20} />
                        <p>เงินของคุณจะถูกเก็บไว้เป็นตัวกลางอย่างปลอดภัย และจะถูกโอนให้ผู้ขายเมื่อคุณได้รับสัตว์เลี้ยงเรียบร้อยแล้วเท่านั้น</p>
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
