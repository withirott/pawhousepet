import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axios';
import Swal from 'sweetalert2';
import { FiUpload, FiCheckCircle } from 'react-icons/fi';
import useCartStore from '../contexts/useCartStore';

const Checkout = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [slipImage, setSlipImage] = useState(null);
    const [slipPreview, setSlipPreview] = useState('');

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const res = await api.get(`/products/${id}`);
                setProduct(res.data);
                if (res.data.status !== 'available') {
                    Swal.fire('สัตว์เลี้ยงไม่พร้อมขาย', 'สัตว์เลี้ยงนี้ถูกขายหรือยกเลิกไปแล้ว', 'warning');
                    navigate(`/products/${id}`);
                }
            } catch (error) {
                console.error("Failed to load product", error);
                navigate('/marketplace');
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
    }, [id, navigate]);

    const handleSlipChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire('ไฟล์ใหญ่เกินไป', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB', 'warning');
                return;
            }
            setSlipImage(file);
            setSlipPreview(URL.createObjectURL(file));
        }
    };

    const handleCheckout = async () => {
        const isFree = parseFloat(product.price) === 0;
        if (!isFree && !slipImage) {
            Swal.fire('กรุณาอัปโหลดสลิป', 'กรุณาอัปโหลดสลิปโอนเงินของคุณเพื่อยืนยันการสั่งซื้อ', 'warning');
            return;
        }

        setProcessing(true);
        try {
            // 1. Create the Order
            const orderRes = await api.post('/orders', { productId: id });
            
            // If completely free, the backend automatically flags the order and product as completed/sold.
            if (!isFree) {
                // 2. Upload the Slip for paid items
                const orderId = orderRes.data.orderId;
                const formData = new FormData();
                formData.append('slipImage', slipImage);

                await api.post(`/orders/${orderId}/payment`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            Swal.fire({
                icon: 'success',
                title: isFree ? 'ขอรับสัตว์เลี้ยงสำเร็จ!' : 'สั่งซื้อสำเร็จ!',
                text: isFree ? 'ติดต่อผู้ขายเพื่อนัดรับได้เลย' : 'อัปโหลดสลิปเงินของคุณเรียบร้อยแล้ว กรุณารอการตรวจสอบจากผู้ขาย',
                confirmButtonColor: '#34d399'
            }).then(() => {
                useCartStore.getState().removeFromCart(parseInt(id)); // Remove from cart
                navigate('/dashboard'); 
            });

        } catch (error) {
            console.error('Checkout error:', error);
            Swal.fire('การสั่งซื้อผิดพลาด', error.response?.data?.message || 'เกิดปัญหาบางอย่างในการจัดการคำสั่งซื้อของคุณ', 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    if (!product) return null;

    const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(price) || 0);
    const getFullImageUrl = (path) => `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
    const primaryImage = product.images && product.images.length > 0 ? getFullImageUrl((product.images.find(i => i.is_primary) || product.images[0]).image_url) : 'https://via.placeholder.com/150';

    const sellerQrImage = product.seller_payment_qr ? getFullImageUrl(product.seller_payment_qr) : null;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in fade-in">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
                {parseFloat(product.price) === 0 ? 'ยืนยันการขอรับ' : 'ชำระเงิน'}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Order Summary */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-bold mb-4 border-b pb-4 text-gray-800">สรุปคำสั่งซื้อ</h2>
                    <div className="flex items-center space-x-4 mb-6 mt-4">
                        <img src={primaryImage} alt={product.name} className="w-24 h-24 object-cover rounded-xl" />
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
                            <p className="text-sm text-gray-500">{product.species} • {product.breed}</p>
                            <p className="text-xs text-secondary font-medium mt-1 tracking-wide">ผู้ขาย: {product.seller_name}</p>
                        </div>
                    </div>

                    <div className="mt-auto border-t pt-6">
                        <div className="flex justify-between items-center text-lg mb-4">
                            <span className="text-gray-600 font-bold">ยอดเงินสุทธิ</span>
                            <span className={`font-black text-3xl ${parseFloat(product.price) === 0 ? 'text-green-500' : 'text-primary'}`}>
                                {parseFloat(product.price) === 0 ? 'ฟรี!' : formatPrice(product.price)}
                            </span>
                        </div>
                        <div className={`p-4 rounded-2xl text-sm flex items-start border shadow-inner ${parseFloat(product.price) === 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            <FiCheckCircle className="mt-0.5 mr-3 shrink-0" size={18} />
                            <p className="leading-relaxed font-medium">
                                {parseFloat(product.price) === 0 ? 'ไม่มีค่าใช้จ่าย สินค้านี้แจกฟรี เมื่อกดยืนยันแล้วระบบจะโอนสิทธิ์ให้ทันที' : 'เมื่อคุณโอนเงินและอัปโหลดสลิปแล้ว ผู้ขายจะตรวจสอบการชำระเงินของคุณ'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment & Upload (Hidden if free) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow flex flex-col items-center justify-center">
                    {parseFloat(product.price) > 0 ? (
                        <>
                            <h2 className="text-xl font-bold mb-4 text-gray-800">โอนเงินไปยังผู้ขาย</h2>
                            
                            {sellerQrImage ? (
                                <div className="bg-white p-4 inline-block rounded-3xl border-4 border-primary/20 shadow-sm mb-4 bg-gradient-to-br from-white to-gray-50">
                                    <img 
                                        src={sellerQrImage} 
                                        alt="QR Code" 
                                        className="w-48 h-48 object-contain rounded-lg" 
                                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="w-48 h-48 flex items-center justify-center text-gray-400 text-sm font-bold">ไม่สามารถโหลด QR ได้<br/>กรุณาแชทถามผู้ขาย</div>'; }}
                                    />
                                </div>
                            ) : (
                                <div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl mb-4 text-sm font-bold border border-yellow-100 flex items-center justify-center">
                                    ผู้ขายยังไม่ได้อัปโหลด QR Code กรุณาโอนตามรายละเอียดด้านล่าง
                                </div>
                            )}

                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-1">ช่องทางการชำระเงินผู้ขาย</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 w-full text-left">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{product.seller_payment_info || 'ไม่ระบุ กรุณาแชทถามผู้ขาย'}</p>
                            </div>

                            {/* Upload Box */}
                            <div className={`w-full border-2 border-dashed rounded-2xl p-6 transition-all mt-2 ${slipPreview ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-gray-50'}`}>
                                {slipPreview ? (
                                    <div className="flex flex-col items-center">
                                        <img src={slipPreview} alt="Slip preview" className="h-40 object-contain mb-4 rounded-lg shadow-sm" />
                                        <button onClick={() => { setSlipPreview(''); setSlipImage(null) }} className="text-sm text-red-500 font-bold hover:text-red-700 underline">เปลี่ยนรูปภาพสลิปใหม่</button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center cursor-pointer h-32 group">
                                        <span className="p-3 bg-primary/10 rounded-full mb-3 group-hover:scale-110 transition-transform"><FiUpload className="text-primary text-2xl" /></span>
                                        <span className="text-sm font-bold text-gray-600 group-hover:text-primary transition-colors">อัปโหลดสลิปโอนเงินที่นี่</span>
                                        <input type="file" accept="image/*" onChange={handleSlipChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="w-full flex-grow flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex justify-center items-center mb-6">
                                <FiCheckCircle size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">พร้อมรับน้องไปดูแล?</h3>
                            <p className="text-gray-500">เพียงกดยืนยันเพื่อขอรับเข้าบ้านได้เลย</p>
                        </div>
                    )}

                    <button
                        onClick={handleCheckout}
                        disabled={processing || (parseFloat(product.price) > 0 && !slipImage)}
                        className={`w-full mt-8 py-4 px-6 rounded-full font-black text-white text-lg transition-all shadow-md mt-auto ${(processing || (parseFloat(product.price) > 0 && !slipImage)) ? 'bg-gray-300 cursor-not-allowed opacity-70' : 'bg-primary hover:bg-primary-dark hover:shadow-lg transform hover:-translate-y-1'}`}
                    >
                        {processing ? 'กำลังประมวลผล...' : parseFloat(product.price) === 0 ? 'ยืนยันรับสัตว์เลี้ยง' : 'ยืนยันการชำระเงิน'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
