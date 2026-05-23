import React, { useState } from 'react';
import useAuthStore from '../contexts/useAuthStore';
import MyProducts from '../components/dashboard/MyProducts';
import AddProduct from '../components/dashboard/AddProduct';
import VerifyIdentity from '../components/dashboard/VerifyIdentity';
import MyOrders from '../components/dashboard/MyOrders';
import Chats from '../components/dashboard/Chats';
import Overview from '../components/dashboard/Overview';
import ProfileEdit from '../components/dashboard/ProfileEdit';
import Favorites from '../components/dashboard/Favorites';
import MySales from '../components/dashboard/MySales';
import AdminPanel from '../components/dashboard/AdminPanel';
import { FiHome, FiBox, FiUser, FiShoppingBag, FiMessageSquare, FiHeart, FiDollarSign, FiShield } from 'react-icons/fi';

const Dashboard = () => {
    const { user } = useAuthStore();
    const [activeView, setActiveView] = useState('overview'); // overview, my_products, add_product, profile, orders, chats

    const renderContent = () => {
        switch (activeView) {
            case 'overview':
                return <Overview setView={setActiveView} />;
            case 'my_products':
                return <MyProducts setView={setActiveView} />;
            case 'add_product':
                if (user?.verification_status !== 'verified') {
                    return <VerifyIdentity onSuccess={() => setActiveView('add_product')} />;
                }
                return <AddProduct onSuccess={() => setActiveView('my_products')} />;
            case 'profile':
                return <ProfileEdit />;
            case 'favorites':
                return <Favorites />;
            case 'sales':
                return <MySales />;
            case 'orders':
                return <MyOrders />;
            case 'chats':
                return <Chats />;
            case 'admin':
                return user?.role === 'admin' ? <AdminPanel /> : <Overview setView={setActiveView} />;
            default:
                return <Overview setView={setActiveView} />;
        }
    };

    const navItems = [
        { id: 'overview', label: 'ภาพรวมบัญชี', icon: <FiHome /> },
        { id: 'chats', label: 'กล่องข้อความ', icon: <FiMessageSquare /> },
        { id: 'favorites', label: 'สัตว์เลี้ยงที่ถูกใจ', icon: <FiHeart /> },
        { id: 'orders', label: 'ประวัติการซื้อของฉัน', icon: <FiShoppingBag /> },
        { id: 'my_products', label: 'จัดการประกาศขาย', icon: <FiBox /> },
        { id: 'sales', label: 'ออเดอร์ที่ลูกค้าสั่ง', icon: <FiDollarSign /> },
        { id: 'profile', label: 'ตั้งค่าโปรไฟล์', icon: <FiUser /> },
    ];

    if (user?.role === 'admin') {
        navItems.push({ id: 'admin', label: 'ผู้ดูแลระบบ', icon: <FiShield /> });
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 min-h-[calc(100vh-140px)]">
            
            {/* Sidebar */}
            <aside className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden md:sticky md:top-24 flex flex-col md:h-[calc(100vh-140px)]">
                    <div className="p-6 bg-gradient-to-br from-secondary-light to-secondary flex flex-col items-center flex-shrink-0 hidden md:flex">
                        <div className="h-20 w-20 rounded-full bg-white flex justify-center items-center text-primary overflow-hidden text-3xl font-bold shadow-md mb-4 border-2 border-white">
                            {user?.profile_image ? (
                                <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${user.profile_image}`} alt="profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="flex items-center space-x-1 mb-1">
                            <h2 className="text-xl font-bold text-white">{user?.username}</h2>
                            {user?.verification_status === 'verified' && (
                                <div className="text-green-300" title="ยืนยันตัวตนแล้ว">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <span className="text-xs bg-white text-primary px-3 py-1 rounded-full font-bold tracking-wider">{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'}</span>
                    </div>

                    <nav className="p-4 flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto md:overflow-y-auto show-scrollbar pb-2 md:pb-4 scroll-smooth hide-scrollbar-mobile">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                className={`flex-shrink-0 md:w-full flex items-center space-x-2 md:space-x-3 px-4 py-2.5 md:py-3 rounded-full md:rounded-lg font-medium transition-all whitespace-nowrap ${activeView === item.id ? 'bg-primary text-white md:bg-primary/10 md:text-primary md:border-l-4 md:border-primary shadow-md md:shadow-none' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 md:bg-transparent md:hover:bg-gray-50 hover:text-gray-900 border border-gray-100 md:border-0 md:border-l-4 md:border-transparent'}`}
                            >
                                <span className={activeView === item.id ? 'text-white md:text-primary' : 'text-gray-400'}>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="w-full md:flex-grow md:min-w-0 flex flex-col">
                <div className="flex-grow">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
