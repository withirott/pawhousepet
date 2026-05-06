import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axios';
import { FiMessageSquare, FiShoppingCart, FiUser, FiInfo, FiCheckCircle, FiImage, FiEdit2, FiMapPin } from 'react-icons/fi';
import useAuthStore from '../contexts/useAuthStore';
import useCartStore from '../contexts/useCartStore';
import Swal from 'sweetalert2';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
        if (res.data.images && res.data.images.length > 0) {
          const primary = res.data.images.find(img => img.is_primary) || res.data.images[0];
          setMainImage(primary.image_url);
        }
      } catch (err) {
        console.error("Failed to load product details", err);
        Swal.fire({
            icon: 'error',
            title: 'ข้อผิดพลาด!',
            text: 'ไม่พบสัตว์เลี้ยงนี้ หรืออาจถูกลบไปแล้ว'
        });
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id, navigate]);

  const handleAction = async (type) => {
    if (!isAuthenticated) {
        Swal.fire({
            icon: 'info',
            title: 'กรุณาเข้าสู่ระบบ',
            text: `คุณต้องเข้าสู่ระบบก่อนเพื่อ ${type === 'chat' ? 'พูดคุยกับผู้ขาย' : 'สั่งซื้อสัตว์เลี้ยงนี้'}`,
            showCancelButton: true,
            confirmButtonColor: '#34d399',
            confirmButtonText: 'เข้าสู่ระบบตอนนี้',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                navigate('/login');
            }
        });
        return;
    }

    if (user && product.seller_id === user.id) {
        return;
    }

    if (type === 'chat') {
        try {
            await api.post('/chats/start', { productId: product.id });
            navigate('/dashboard'); // Will load the Chat component
        } catch (error) {
            Swal.fire('คำเตือน', 'ไม่สามารถเปิดห้องแชทได้ในขณะนี้', 'error');
        }
    } else if (type === 'cart') {
        const result = await useCartStore.getState().addToCart(product.id);
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ!',
                text: 'เพิ่มสัตว์เลี้ยงลงในตะกร้าแล้ว',
                showCancelButton: true,
                confirmButtonText: 'ดูตะกร้าสินค้า',
                cancelButtonText: 'เลือกดูตัวอื่นต่อ'
            }).then((res) => {
                if (res.isConfirmed) navigate('/cart');
            });
        } else {
            Swal.fire('ไม่สามารถเพิ่มได้', result.message, 'warning');
        }
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div></div>;
  if (!product) return null;

  const getFullImageUrl = (path) => `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
  const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(price) || 0);

  const formatGender = (gender) => {
      if (gender === 'Male') return 'ตัวผู้ (Male)';
      if (gender === 'Female') return 'ตัวเมีย (Female)';
      return 'ไม่ระบุ';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in fade-in">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
            
            {/* Image Gallery (Left) */}
            <div className="w-full md:w-1/2 p-6 bg-gray-50 flex flex-col">
                <div className="aspect-w-1 aspect-h-1 w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4 h-96 flex items-center justify-center">
                   {mainImage ? (
                        <img 
                            src={getFullImageUrl(mainImage)} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                        />
                   ) : (
                        <span className="text-gray-400 font-bold tracking-wide">ไม่มีรูปภาพ</span>
                   )}
                </div>

                {/* Thumbnails */}
                {product.images && product.images.length > 1 && (
                    <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                        {product.images.map((img, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => setMainImage(img.image_url)}
                                className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${mainImage === img.image_url ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-transparent hover:border-primary-light'}`}
                            >
                                <img src={getFullImageUrl(img.image_url)} alt="thumbnail" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Details (Right) */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                <div>
                    <div className="flex items-center space-x-4 mb-4">
                        <h1 className="text-3xl font-extrabold text-gray-900">{product.name}</h1>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full uppercase tracking-wide ${product.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.status}
                        </span>
                        
                        {/* Edit Button for Admin or Content Owner */}
                        {user && (user.id === product.seller_id || user.role === 'admin') && (
                            <button 
                                onClick={() => navigate(`/edit-product/${product.id}`)}
                                className="ml-auto flex items-center space-x-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors font-bold"
                            >
                                <FiEdit2 size={16} />
                                <span>แก้ไข</span>
                            </button>
                        )}
                    </div>
                    
                    <p className={`text-4xl font-bold mb-6 ${parseFloat(product.price) === 0 ? 'text-green-500' : 'text-primary'}`}>
                        {parseFloat(product.price) === 0 ? 'แจกฟรี!' : formatPrice(product.price)}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div><span className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1 block">สายพันธุ์สัตว์</span><p className="font-semibold text-gray-800 text-lg">{product.species}</p></div>
                        <div><span className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1 block">พันธุ์ (Breed)</span><p className="font-semibold text-gray-800 text-lg">{product.breed || '-'}</p></div>
                        <div><span className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1 block">เพศ</span><p className={`font-semibold text-lg ${product.gender === 'Male' ? 'text-blue-600' : product.gender === 'Female' ? 'text-pink-600' : 'text-gray-800'}`}>{formatGender(product.gender)}</p></div>
                        <div><span className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1 block">อายุ</span><p className="font-semibold text-gray-800 text-lg">{product.age_months} เดือน</p></div>
                        <div><span className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1 block flex items-center"><FiMapPin className="mr-1"/>สถานที่รับ</span><p className="font-semibold text-gray-800 text-lg truncate" title={product.location}>{product.location || '-'}</p></div>
                        <div>
                            <span className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1 block">วัคซีน</span>
                            <div className="flex flex-col">
                                <div className="flex items-center space-x-1.5 font-semibold text-gray-800 text-lg">
                                    {product.vaccine_status ? <><FiCheckCircle className="text-green-500" /> <span>ฉีดแล้ว</span></> : <span>ยังไม่ฉีด</span>}
                                </div>
                                {product.vaccine_status && product.vaccine_cert && (
                                    <button 
                                        onClick={() => Swal.fire({
                                            imageUrl: getFullImageUrl(product.vaccine_cert),
                                            title: 'ใบรับรองวัคซีน',
                                            confirmButtonText: 'ปิดหน้าต่าง',
                                            customClass: { image: 'max-h-96 object-contain' }
                                        })}
                                        className="text-xs text-blue-500 hover:underline flex items-center mt-1 font-bold"
                                    >
                                        <FiImage className="mr-1" /> ดูรูปใบรับรอง
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center">
                            <FiInfo className="mr-2 text-primary" /> รายละเอียดเพิ่มเติม
                        </h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg font-light">
                            {product.description || "ผู้ขายไม่ได้ระบุรายละเอียดเพิ่มเติมเอาไว้"}
                        </p>
                    </div>

                    {/* Seller Profile Line */}
                    <div className="flex items-center space-x-4 mb-8 p-4 border border-gray-200 rounded-2xl hover:shadow-sm transition-shadow bg-white">
                        <div className="h-14 w-14 rounded-full bg-primary-light flex justify-center items-center text-white overflow-hidden text-xl font-bold shadow-inner">
                             {product.seller_image ? (
                                <img src={getFullImageUrl(product.seller_image)} alt="seller" className="w-full h-full object-cover" />
                             ) : (
                                product.seller_name.charAt(0).toUpperCase()
                             )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-0.5">ลงขายโดย</p>
                            <p className="font-black text-gray-800 text-lg">{product.seller_name}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-100">
                    <button 
                        onClick={() => handleAction('chat')}
                        className="flex-1 bg-white border-2 border-primary text-primary hover:bg-primary/5 hover:border-primary-dark font-black py-4 px-6 rounded-full flex justify-center items-center transition-all shadow-sm font-lg text-lg"
                    >
                        <FiMessageSquare className="mr-2" size={20} /> แชทคุยกับผู้ขาย
                    </button>
                    <button 
                        onClick={() => handleAction('cart')}
                        disabled={product.status !== 'available'}
                        className={`flex-1 text-white font-black py-4 px-6 rounded-full flex justify-center items-center transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-lg bg-primary hover:bg-primary-dark hover:-translate-y-1 shadow-primary/30`}
                    >
                        <FiShoppingCart className="mr-2" size={20} /> 
                        หยิบใส่ตะกร้า
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
};

export default ProductDetail;
