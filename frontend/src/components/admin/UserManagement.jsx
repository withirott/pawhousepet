import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import Swal from 'sweetalert2';
import { FiTrash2, FiShield, FiUser } from 'react-icons/fi';
import useAuthStore from '../../contexts/useAuthStore';

const UserManagement = () => {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลสมาชิกได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, username) => {
        if (id === currentUser.id) {
            return Swal.fire('ผิดพลาด', 'คุณไม่สามารถลบบัญชีตัวเองได้', 'error');
        }

        const result = await Swal.fire({
            title: 'ยืนยันการลบสมาชิก?',
            html: `คุณกำลังจะลบผู้ใช้ <b>${username}</b><br/><span class="text-sm text-red-500">คำเตือน: โพสต์และประวัติแชททั้งหมดของผู้ใช้รายนี้จะถูกลบถาวร!</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ใช่, ฉันต้องการลบ'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/users/${id}`);
                Swal.fire('สำเร็จ', 'ลบผู้ใช้งานออกจากระบบแล้ว', 'success');
                fetchUsers();
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถลบผู้ใช้งานได้', 'error');
            }
        }
    };

    const handleRoleChange = async (id, currentRole, username) => {
        if (id === currentUser.id) {
            return Swal.fire('ผิดพลาด', 'คุณไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้', 'error');
        }

        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const actionText = newRole === 'admin' ? 'เลื่อนขั้นเป็นแอดมิน' : 'ลดขั้นเป็นผู้ใช้ทั่วไป';

        const result = await Swal.fire({
            title: 'ตกลงเปลี่ยนสิทธิ์?',
            text: `ต้องการ ${actionText} ใช่หรือไม่? (${username})`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#34d399',
            confirmButtonText: 'ยืนยัน'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/admin/users/${id}/role`, { role: newRole });
                Swal.fire('สำเร็จ', `เปลี่ยนสิทธิ์ ${username} สำเร็จ`, 'success');
                fetchUsers();
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถเปลี่ยนสิทธิ์ได้', 'error');
            }
        }
    };

    const formatDate = (dateString) => new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
    const getFullImageUrl = (path) => `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">จัดการข้อมูลสมาชิก</h2>
                <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full font-bold text-sm">รวมทั้งหมด {users.length} บัญชี</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm tracking-wider">
                            <th className="p-4 font-medium">ข้อมูลผู้ใช้</th>
                            <th className="p-4 font-medium">ติดต่อ</th>
                            <th className="p-4 font-medium">วันที่สมัคร</th>
                            <th className="p-4 font-medium">สถานะ</th>
                            <th className="p-4 font-medium text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                        {u.profile_image ? (
                                            <img src={getFullImageUrl(u.profile_image)} alt="profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{u.username.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{u.username}</p>
                                        <p className="text-xs text-gray-500 max-w-[150px] truncate">{u.bio || 'ไม่มีข้อมูลประวัติ'}</p>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">{u.phone || '-'}</td>
                                <td className="p-4 text-sm text-gray-600">{formatDate(u.created_at)}</td>
                                <td className="p-4">
                                    {u.role === 'admin' ? (
                                        <span className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-max"><FiShield className="mr-1" /> ผู้ดูแลระบบ</span>
                                    ) : (
                                        <span className="flex items-center text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded w-max"><FiUser className="mr-1" /> สมาชิกทั่วไป</span>
                                    )}
                                </td>
                                <td className="p-4 flex items-center justify-center space-x-2">
                                    <button 
                                        onClick={() => handleRoleChange(u.id, u.role, u.username)}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                        title="เปลี่ยนสิทธิ์การใช้งาน"
                                        disabled={u.id === currentUser.id}
                                    >
                                        <FiShield size={18} className={u.id === currentUser.id ? 'opacity-30' : ''} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(u.id, u.username)}
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                        title="ลบบัญชีผู้ใช้"
                                        disabled={u.id === currentUser.id}
                                    >
                                        <FiTrash2 size={18} className={u.id === currentUser.id ? 'opacity-30' : ''} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
