import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import { FiBox, FiShoppingBag, FiMessageSquare, FiStar, FiCheckCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';
import useAuthStore from '../../contexts/useAuthStore';

const Overview = ({ setView }) => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ products: 0, orders: 0, spent: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                // Fetch products and orders specifically for these quick metrics
                // Or just use existing api routes
                const [productsRes, ordersRes] = await Promise.all([
                    api.get('/products/me/items'),
                    api.get('/orders/me')
                ]);
                
                const myProducts = productsRes.data;
                const myOrders = ordersRes.data;

                const totalSpent = myOrders.reduce((acc, curr) => acc + parseFloat(curr.total_price), 0);

                setStats({
                    products: myProducts.length,
                    orders: myOrders.length,
                    spent: totalSpent
                });
            } catch (error) {
                console.error('Failed to load overview blocks', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, []);

    const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in fade-in">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-secondary tracking-tight mb-2">ยินดีต้อนรับกลับมา!</h2>
                    <p className="text-gray-500 text-lg">สรุปภาพรวมบัญชีผู้ใช้และการลงทะเบียนสัตว์เลี้ยงของคุณ</p>
                </div>
                {user?.verification_status === 'verified' && (
                    <div className="mt-4 md:mt-0 flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200 shadow-sm w-max">
                        <FiCheckCircle className="mr-2 text-green-500" size={20} />
                        <div>
                            <p className="font-bold text-sm leading-tight">บัญชีผู้ใช้ยืนยันตัวตนแล้ว</p>
                            <p className="text-[10px] opacity-80 leading-tight">เพิ่มความน่าเชื่อถือในการซื้อขาย</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Stat 1 */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-primary/10 text-primary rounded-2xl"><FiBox size={28} /></div>
                    <div>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">สินค้าที่กำลังลงขาย</p>
                        <p className="text-3xl font-black text-gray-800">{stats.products}</p>
                    </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-secondary/10 text-secondary rounded-2xl"><FiShoppingBag size={28} /></div>
                    <div>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">จำนวนการสั่งซื้อ</p>
                        <p className="text-3xl font-black text-gray-800">{stats.orders}</p>
                    </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-orange-100 text-orange-500 rounded-2xl"><FiStar size={28} /></div>
                    <div>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">ยอดเงินที่ใช้จ่ายไป</p>
                        <p className="text-3xl font-black text-gray-800">{formatPrice(stats.spent)}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <h3 className="text-xl font-bold text-gray-800 mb-4">เมนูลัดด่วน</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                    onClick={() => setView('add_product')}
                    className="flex items-center p-6 bg-gradient-to-br from-primary-light to-primary text-white rounded-3xl shadow border-0 hover:shadow-lg hover:-translate-y-1 transition-all h-32"
                >
                    <div className="p-4 bg-white/20 rounded-2xl mr-4"><FiBox size={28} /></div>
                    <div className="text-left">
                        <span className="font-black text-xl block">ประกาศขายสัตว์เลี้ยง</span>
                        <span className="text-white/80 text-sm">เพิ่มสัตว์เลี้ยงใหม่ลงในตลาด</span>
                    </div>
                </button>
                
                <button 
                    onClick={() => setView('chats')}
                    className="flex items-center p-6 bg-gradient-to-br from-secondary-light to-secondary text-white rounded-3xl shadow border-0 hover:shadow-lg hover:-translate-y-1 transition-all h-32"
                >
                    <div className="p-4 bg-white/20 rounded-2xl mr-4"><FiMessageSquare size={28} /></div>
                    <div className="text-left">
                        <span className="font-black text-xl block">เช็คข้อความแชท</span>
                        <span className="text-white/80 text-sm">ดูและพูดคุยกับผู้ซื้อ/ผู้ขาย</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Overview;
