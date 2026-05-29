import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiUser, FiLogOut, FiMenu, FiX, FiShoppingCart } from 'react-icons/fi';
import useAuthStore from '../contexts/useAuthStore';
import useCartStore from '../contexts/useCartStore';
import api from '../services/axios';
import io from 'socket.io-client';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const cartItemCount = useCartStore(state => state.cart.length);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();

      const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
      socket.emit('join_user_room', user.id);

      socket.on('new_notification', () => {
        fetchNotifications(); // Refresh list when pinged
      });

      return () => socket.disconnect();
    }
  }, [isAuthenticated, user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  const markAsRead = async (id = 'all') => {
    try {
      if (id === 'all') {
        await api.patch('/notifications/read-all');
        setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      } else {
        await api.patch(`/notifications/${id}/read`);
        setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notifications");
    }
  };

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                PetPew
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {(!user || user.role !== 'admin') && (
                <Link to="/marketplace" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  ตลาดซื้อขาย
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden sm:flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative text-gray-400 focus-within:text-gray-600">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <FiSearch className="h-5 w-5" />
                </div>
                <input
                  id="search"
                  className="block w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:ring-1 focus:ring-primary focus:border-primary transition-all sm:text-sm"
                  placeholder="ค้นหาสัตว์เลี้ยง..."
                  type="search"
                />
              </div>
            </div>
          </div>

          {/* Right Side Icons / Auth Links */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Cart Icon */}
                <Link to="/cart" className="bg-white p-2 rounded-full font-bold text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors relative">
                    <span className="sr-only">View Cart</span>
                    <FiShoppingCart className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform bg-secondary rounded-full">
                        {cartItemCount}
                      </span>
                    )}
                </Link>

                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setNotificationOpen(!notificationOpen); setProfileDropdownOpen(false); }}
                    className="bg-white p-2 rounded-full font-bold text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors relative"
                  >
                    <span className="sr-only">View notifications</span>
                    <FiBell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform bg-red-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                      <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-sm font-bold text-gray-800">การแจ้งเตือน</h3>
                        {unreadCount > 0 && (
                          <button onClick={() => markAsRead('all')} className="text-xs text-primary font-medium hover:underline">ทำเครื่องหมายอ่านแล้วทั้งหมด</button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-gray-500">ไม่มีการแจ้งเตือนใหม่</div>
                        ) : (
                          notifications.map(notif => (
                            <div key={notif.id} onClick={() => { if (!notif.is_read) markAsRead(notif.id) }} className={`p-3 border-b border-gray-50 cursor-pointer flex items-start space-x-3 hover:bg-gray-50 ${notif.is_read ? 'opacity-60' : 'bg-primary/5'}`}>
                              <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${notif.is_read ? 'bg-transparent' : 'bg-primary'}`}></div>
                              <div className="flex-1">
                                <p className={`text-sm ${notif.is_read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{notif.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString('th-TH')}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-primary transition duration-150 ease-in-out"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      {user?.username ? user.username.charAt(0).toUpperCase() : <FiUser />}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 overflow-hidden">
                      <div className="px-4 py-3">
                        <p className="text-sm">เข้าสู่ระบบในชื่อ</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.username || 'User'}</p>
                      </div>
                      <div className="py-1">
                        {user?.role !== 'admin' && (
                          <Link to="/dashboard" onClick={() => setProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">แดชบอร์ดส่วนตัว</Link>
                        )}
                        {user?.role === 'admin' && (
                          <Link to="/admin" onClick={() => setProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-primary font-bold hover:bg-primary/5">ศูนย์ควบคุม Admin</Link>
                        )}
                      </div>
                      <div className="py-1">
                        <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                          <FiLogOut className="mr-2" /> ออกจากระบบ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  เข้าสู่ระบบ
                </Link>
                <Link to="/register" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm">
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <FiX className="block h-6 w-6" /> : <FiMenu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            {(!user || user.role !== 'admin') && (
              <Link to="/marketplace" className="bg-primary/10 border-primary text-primary block pl-3 pr-4 py-2 border-l-4 text-base font-medium">ตลาดซื้อขาย</Link>
            )}
          </div>
          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                    {user?.username ? user.username.charAt(0).toUpperCase() : <FiUser />}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.username || 'User'}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {user?.role !== 'admin' && (
                  <Link to="/dashboard" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">แดชบอร์ดส่วนตัว</Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="block px-4 py-2 text-base font-bold text-primary hover:bg-gray-100">ศูนย์ควบคุม Admin</Link>
                )}
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">ออกจากระบบ</button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200 space-y-1">
              <Link to="/login" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">เข้าสู่ระบบ</Link>
              <Link to="/register" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">สมัครสมาชิก</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
//erbetb