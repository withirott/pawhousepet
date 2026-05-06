import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../contexts/useCartStore';
import useAuthStore from '../contexts/useAuthStore';
import api from '../services/axios';
import Swal from 'sweetalert2';
import { FiTrash2, FiShoppingCart, FiCheckCircle } from 'react-icons/fi';

const Cart = () => {
    const { cart, loading, fetchCart, removeFromCart } = useCartStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) fetchCart();
    }, [user, fetchCart]);

    const handleCheckoutAll = async () => {
        try {
            const result = await Swal.fire({
                title: 'ยืนยันการสั่งซื้อ?',
                text: 'คุณต้องการสั่งซื้อสัตว์เลี้ยงทั้งหมดในตะกร้าใช่หรือไม่?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonText: 'ยกเลิก',
                confirmButtonText: 'ใช่, ชำระเงินเลย!'
            });

            if (result.isConfirmed) {
                const res = await api.post('/cart/checkout');
                await fetchCart(); // Refresh cart (should be empty now)
                
                if (res.data.isFreeOnly) {
                    Swal.fire({
                        icon: 'success',
                        title: 'สำเร็จ!',
                        text: 'ดำเนินการขอรับสัตว์เลี้ยงฟรีเรียบร้อยแล้ว',
                    }).then(() => navigate('/dashboard'));
                } else {
                    navigate(`/payment/${res.data.transactionId}`);
                }
            }
        } catch (error) {
            Swal.fire('ข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถทำรายการได้', 'error');
        }
    };

    const getFullImageUrl = (path) => `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
    const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(price) || 0);

    if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in fade-in min-h-screen">
            <h1 className="text-3xl font-black text-gray-800 mb-8 flex items-center">
                <FiShoppingCart className="mr-3 text-primary" /> ตะกร้าสินค้าของคุณ
            </h1>

            {cart.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center">
                    <FiShoppingCart className="text-6xl text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-500 mb-2">ตะกร้าของคุณว่างเปล่า</h2>
                    <p className="text-gray-400 mb-8">ลองไปค้นหาน้องๆ ที่ถูกใจในตลาดซื้อขายดูสิ!</p>
                    <Link to="/marketplace" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                        ไปที่ตลาดซื้อขาย
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <ul className="divide-y divide-gray-100">
                        {cart.map((item) => (
                            <li key={item.cart_item_id} className="p-6 sm:p-8 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row items-center gap-6">
                                {/* Product Image */}
                                <Link to={`/products/${item.product_id}`} className="shrink-0">
                                    <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                                        <img 
                                            src={item.product_image ? getFullImageUrl(item.product_image) : 'https://via.placeholder.com/150'} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                </Link>

                                {/* Product Info */}
                                <div className="flex-1 text-center sm:text-left">
                                    <Link to={`/products/${item.product_id}`} className="text-2xl font-black text-gray-800 hover:text-primary transition-colors">
                                        {item.name}
                                    </Link>
                                    <p className="text-gray-500 font-medium mt-1">{item.species} {item.breed && `• ${item.breed}`}</p>
                                    
                                    <div className="mt-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Price & Actions */}
                                <div className="shrink-0 flex flex-col items-center sm:items-end gap-4 w-full sm:w-auto">
                                    <p className="text-3xl font-black text-primary">
                                        {parseFloat(item.price) === 0 ? 'แจกฟรี!' : formatPrice(item.price)}
                                    </p>
                                    
                                    <div className="flex w-full sm:w-auto gap-3">
                                        <button 
                                            onClick={() => removeFromCart(item.product_id)}
                                            className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-gray-200 hover:border-red-200"
                                            title="ลบออกจากตะกร้า"
                                        >
                                            <FiTrash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    
                    {/* Cart Footer */}
                    <div className="bg-gray-50 p-6 sm:p-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">ยอดรวมทั้งหมด</p>
                            <p className="text-4xl font-black text-gray-900">
                                {formatPrice(cart.reduce((total, item) => total + parseFloat(item.price), 0))}
                            </p>
                        </div>
                        <button 
                            onClick={handleCheckoutAll}
                            disabled={cart.some(item => item.status !== 'available')}
                            className="w-full sm:w-auto px-10 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            <FiCheckCircle size={24} /> ชำระเงินรวมทั้งหมด
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
