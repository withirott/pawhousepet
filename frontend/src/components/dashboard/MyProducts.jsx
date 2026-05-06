import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axios';
import Swal from 'sweetalert2';
import { FiTrash2, FiEdit, FiPlus } from 'react-icons/fi';

const MyProducts = ({ setView }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/me/items');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดประวัติฟาร์มของคุณได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: 'คุณแน่ใจหรือไม่?',
        text: "หากลบแล้วข้อมูลประกาศนี้จะหายไปจากระบบทันที!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#9ca3af',
        confirmButtonText: 'ใช่, ฉันต้องการลบ!',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/products/${id}`);
            Swal.fire('ลบสำเร็จ!', 'ข้อมูลประกาศสัตว์เลี้ยงของคุณถูกลบแล้ว', 'success');
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            Swal.fire('ปัญหาในการลบ', 'เกิดปัญหาขึ้นระหว่างลบข้อมูล โปรดลองอีกครั้ง', 'error');
        }
    }
  };

  const getFullImageUrl = (path) => `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
  const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-full">
        <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100 bg-gray-50/50 relative">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">ประกาศของฉัน</h2>
                <p className="text-sm text-gray-500 mt-1">จัดการรายการสัตว์เลี้ยงที่คุณลงประกาศขาย</p>
            </div>
            <button 
                onClick={() => setView('add_product')}
                className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full font-semibold shadow-sm transition-colors flex items-center"
            >
                <FiPlus className="mr-2" size={18} /> ลงประกาศฟรี
            </button>
        </div>

        <div className="p-6 md:p-8">
            {loading ? (
                <div className="flex justify-center items-center h-40">
                   <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-500 mb-4 text-lg">คุณยังไม่มีข้อมูลลงประกาศขายในขณะนี้</p>
                    <button onClick={() => setView('add_product')} className="text-primary font-bold hover:underline">
                        เริ่มต้นลงประกาศขายตัวแรกของคุณ
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col overflow-hidden relative group">
                            <div className="h-40 bg-gray-100 overflow-hidden relative">
                                <img 
                                    src={product.image_url ? getFullImageUrl(product.image_url) : 'https://via.placeholder.com/400x300?text=No+Image'} 
                                    className="w-full h-full object-cover" 
                                    alt={product.name} 
                                />
                                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => navigate(`/edit-product/${product.id}`)} className="bg-white p-1.5 rounded-md shadow-sm text-blue-500 hover:text-blue-600"><FiEdit size={16} /></button>
                                    <button onClick={() => handleDelete(product.id)} className="bg-white p-1.5 rounded-md shadow-sm text-red-500 hover:text-red-700"><FiTrash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="p-4 flex-grow flex flex-col justify-between hidden-text-group">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-gray-800 text-lg truncate">{product.name}</h3>
                                        {/* Status Translate */}
                                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap mt-1 ${product.status==='available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                             {product.status === 'available' ? 'พร้อมขาย' : 'ยกเลิก/ขายแล้ว'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{product.species} • {product.age_months} เดือน</p>
                                </div>
                                <p className="font-extrabold text-primary mt-3 text-lg">{formatPrice(product.price)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default MyProducts;
