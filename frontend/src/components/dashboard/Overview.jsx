import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import { FiBox, FiShoppingBag, FiMessageSquare, FiDollarSign, FiTrendingUp, FiCheckCircle, FiArrowRight, FiClock, FiPackage } from 'react-icons/fi';
import useAuthStore from '../../contexts/useAuthStore';

const Overview = ({ setView }) => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ products: 0, orders: 0, spent: 0, sales_income: 0 });
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        // Set time-based greeting
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('สวัสดีตอนเช้า ☀️');
        else if (hour < 17) setGreeting('สวัสดีตอนบ่าย 🌤️');
        else setGreeting('สวัสดีตอนเย็น 🌙');

        const fetchOverview = async () => {
            try {
                const [productsRes, ordersRes, salesRes] = await Promise.all([
                    api.get('/products/me/items'),
                    api.get('/orders/me'),
                    api.get('/orders/me/sales')
                ]);
                
                const myProducts = productsRes.data;
                const myOrders = ordersRes.data;
                const mySales = salesRes.data;

                const totalSpent = myOrders.reduce((acc, curr) => acc + parseFloat(curr.total_price), 0);
                
                // Calculate income only from completed/approved sales
                const totalIncome = mySales
                    .filter(sale => ['completed', 'approved'].includes(sale.order_status))
                    .reduce((acc, curr) => acc + parseFloat(curr.total_price), 0);

                setStats({
                    products: myProducts.length,
                    orders: myOrders.length,
                    spent: totalSpent,
                    sales_income: totalIncome
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
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in fade-in">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-secondary tracking-tight mb-2">{greeting} <span className="text-primary">{user?.username}</span></h2>
                    <p className="text-gray-500 text-lg">สรุปภาพรวมบัญชีผู้ใช้และการลงทะเบียนสัตว์เลี้ยงของคุณ</p>
                </div>
                {user?.verification_status === 'verified' && (
                    <div className="mt-4 md:mt-0 flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-2xl border border-green-200 shadow-sm w-max">
                        <FiCheckCircle className="mr-2 text-green-500" size={20} />
                        <div>
                            <p className="font-bold text-sm leading-tight">บัญชีผู้ใช้ยืนยันตัวตนแล้ว</p>
                            <p className="text-[10px] opacity-80 leading-tight">เพิ่มความน่าเชื่อถือในการซื้อขาย</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {/* Stat 1 */}
                <div className="bg-gradient-to-br from-[#ff8787] to-[#ff6b6b] p-6 rounded-2xl shadow-sm text-white transform transition-transform hover:scale-105 hover:shadow-md flex items-center space-x-4">
                    <div className="p-4 bg-white/20 rounded-2xl"><FiBox size={28} /></div>
                    <div>
                        <p className="text-sm text-white/80 font-bold uppercase tracking-wider mb-1">สินค้าที่ลงขาย</p>
                        <p className="text-3xl font-black">{stats.products}</p>
                    </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-2xl shadow-sm text-white transform transition-transform hover:scale-105 hover:shadow-md flex items-center space-x-4">
                    <div className="p-4 bg-white/20 rounded-2xl"><FiShoppingBag size={28} /></div>
                    <div>
                        <p className="text-sm text-white/80 font-bold uppercase tracking-wider mb-1">จำนวนการสั่งซื้อ</p>
                        <p className="text-3xl font-black">{stats.orders}</p>
                    </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-6 rounded-2xl shadow-sm text-white transform transition-transform hover:scale-105 hover:shadow-md flex items-center space-x-4">
                    <div className="p-4 bg-white/20 rounded-2xl"><FiDollarSign size={28} /></div>
                    <div>
                        <p className="text-sm text-white/80 font-bold uppercase tracking-wider mb-1">ยอดเงินที่ใช้จ่าย</p>
                        <p className="text-2xl font-black">{formatPrice(stats.spent)}</p>
                    </div>
                </div>
                
                {/* Stat 4 */}
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-2xl shadow-sm text-white transform transition-transform hover:scale-105 hover:shadow-md flex items-center space-x-4">
                    <div className="p-4 bg-white/20 rounded-2xl"><FiTrendingUp size={28} /></div>
                    <div>
                        <p className="text-sm text-white/80 font-bold uppercase tracking-wider mb-1">รายได้จากการขาย</p>
                        <p className="text-2xl font-black">{formatPrice(stats.sales_income)}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <h3 className="text-xl font-bold text-gray-800 mb-4">เมนูลัดด่วน</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                    onClick={() => setView('add_product')}
                    className="group flex flex-col justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left h-40"
                >
                    <div className="p-3 bg-primary/10 text-primary rounded-xl w-max group-hover:scale-110 transition-transform"><FiBox size={24} /></div>
                    <div className="mt-4 flex justify-between items-end w-full">
                        <div>
                            <span className="font-bold text-gray-800 block">ประกาศขายสัตว์เลี้ยง</span>
                            <span className="text-gray-500 text-xs">เพิ่มสัตว์เลี้ยงใหม่ลงในตลาด</span>
                        </div>
                        <FiArrowRight className="text-gray-300 group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
                    </div>
                </button>
                
                <button 
                    onClick={() => setView('chats')}
                    className="group flex flex-col justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400/30 transition-all text-left h-40"
                >
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-xl w-max group-hover:scale-110 transition-transform"><FiMessageSquare size={24} /></div>
                    <div className="mt-4 flex justify-between items-end w-full">
                        <div>
                            <span className="font-bold text-gray-800 block">เช็คข้อความแชท</span>
                            <span className="text-gray-500 text-xs">พูดคุยกับผู้ซื้อและผู้ขาย</span>
                        </div>
                        <FiArrowRight className="text-gray-300 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1" />
                    </div>
                </button>

                <button 
                    onClick={() => setView('orders')}
                    className="group flex flex-col justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-400/30 transition-all text-left h-40"
                >
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl w-max group-hover:scale-110 transition-transform"><FiShoppingBag size={24} /></div>
                    <div className="mt-4 flex justify-between items-end w-full">
                        <div>
                            <span className="font-bold text-gray-800 block">ประวัติการซื้อ</span>
                            <span className="text-gray-500 text-xs">ดูคำสั่งซื้อของคุณ</span>
                        </div>
                        <FiArrowRight className="text-gray-300 group-hover:text-emerald-500 transition-colors transform group-hover:translate-x-1" />
                    </div>
                </button>

                <button 
                    onClick={() => setView('sales')}
                    className="group flex flex-col justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-400/30 transition-all text-left h-40"
                >
                    <div className="p-3 bg-purple-50 text-purple-500 rounded-xl w-max group-hover:scale-110 transition-transform"><FiPackage size={24} /></div>
                    <div className="mt-4 flex justify-between items-end w-full">
                        <div>
                            <span className="font-bold text-gray-800 block">ออเดอร์ลูกค้า</span>
                            <span className="text-gray-500 text-xs">ดูรายการที่ลูกค้าสั่งซื้อ</span>
                        </div>
                        <FiArrowRight className="text-gray-300 group-hover:text-purple-500 transition-colors transform group-hover:translate-x-1" />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Overview;
