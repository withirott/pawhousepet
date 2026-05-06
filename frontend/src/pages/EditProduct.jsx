import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axios';
import Swal from 'sweetalert2';
import { FiUploadCloud, FiX, FiArrowLeft } from 'react-icons/fi';
import useAuthStore from '../contexts/useAuthStore';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age_months: '',
    price: '',
    description: '',
    status: 'available',
    gender: 'Unknown',
    location: ''
  });
  const [existingImages, setExistingImages] = useState([]);
  const [existingVaccineCert, setExistingVaccineCert] = useState(null);
  const [vaccineCertFile, setVaccineCertFile] = useState(null);
  const [vaccineCertPreview, setVaccineCertPreview] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const product = res.data;
        
        // Check if user is authorized (seller or admin)
        if (user.id !== product.seller_id && user.role !== 'admin') {
            Swal.fire('ปฏิเสธการเข้าถึง', 'คุณไม่มีสิทธิ์แก้ไขประกาศนี้', 'error');
            navigate('/dashboard');
            return;
        }

        setFormData({
            name: product.name || '',
            species: product.species || 'Dog',
            breed: product.breed || '',
            age_months: product.age_months || '',
            price: product.price || '',
            vaccine_status: product.vaccine_status === 1 || product.vaccine_status === true,
            description: product.description || '',
            status: product.status || 'available',
            gender: product.gender || 'Unknown',
            location: product.location || ''
        });
        
        setExistingImages(product.images || []);
        if (product.vaccine_cert) {
            setExistingVaccineCert(product.vaccine_cert);
        }
      } catch (error) {
        console.error("Fetch product error", error);
        Swal.fire('ข้อผิดพลาด', 'ไม่พบประกาศที่ต้องการแก้ไข', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProduct();
  }, [id, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVaccineChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire('ไฟล์ใหญ่เกินไป', 'ใบรับรองวัคซีนขนาดเกิน 5MB', 'warning');
            return;
        }
        setVaccineCertFile(file);
        setVaccineCertPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            formDataToSend.append(key, formData[key]);
        });

        if (formData.vaccine_status && vaccineCertFile) {
            formDataToSend.append('vaccineCert', vaccineCertFile);
        }

        await api.put(`/products/${id}`, formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        Swal.fire('สำเร็จ', 'อัปเดตข้อมูลสัตว์เลี้ยงเรียบร้อยแล้ว!', 'success').then(() => {
            navigate(`/products/${id}`);
        });

    } catch (error) {
        console.error(error);
        Swal.fire('ล้มเหลว', error.response?.data?.message || 'ไม่สามารถอัปเดตประกาศได้', 'error');
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  const getFullImageUrl = (path) => `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in fade-in">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-primary mb-6 transition-colors font-bold">
            <FiArrowLeft className="mr-2" /> กลับไปหน้าก่อนหน้า
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative">
            <h2 className="text-3xl font-black text-gray-800 mb-2">แก้ไขประกาศสัตว์เลี้ยง</h2>
            <p className="text-gray-500 mb-8 border-b border-gray-100 pb-6">แก้ไขข้อมูลรายละเอียดต่างๆ ของสัตว์เลี้ยง</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">สถานะประกาศ</label>
                        <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50 font-bold">
                            <option value="available">พร้อมขาย (Available)</option>
                            <option value="reserved">จองแล้ว (Reserved)</option>
                            <option value="sold">ขายแล้ว/ปิดการขาย (Sold)</option>
                        </select>
                    </div>
                    <div className="hidden md:block"></div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อสัตว์เลี้ยง *</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">*</label>
                        <select name="species" value={formData.species} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50">
                            <option value="Dog">สุนัข (Dog)</option>
                            <option value="Cat">แมว (Cat)</option>
                            <option value="Bird">นก (Bird)</option>
                            <option value="Fish">ปลา (Fish)</option>
                            <option value="Other">ประเภทอื่นๆ (Other)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">เพศ *</label>
                        <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50">
                            <option value="Unknown">ไม่ระบุ / ไม่ทราบเพศ</option>
                            <option value="Male">เพศผู้ (Male)</option>
                            <option value="Female">เพศเมีย (Female)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">สายพันธุ์ย่อย (ถ้ามี)</label>
                        <input type="text" name="breed" value={formData.breed} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">อายุ (เดือน) *</label>
                        <input type="number" name="age_months" required min="0" value={formData.age_months} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">ราคา (บาท) * (ใส่ 0 สำหรับแจกฟรี)</label>
                        <input type="number" name="price" required min="0" value={formData.price} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">จังหวัดนัดรับ</label>
                        <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50" placeholder="เช่น กรุงเทพมหานคร" />
                    </div>
                    
                    <div className="flex flex-col mt-6">
                        <div className="flex items-center">
                            <input type="checkbox" id="vaccine" name="vaccine_status" checked={formData.vaccine_status} onChange={handleInputChange} className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary" />
                            <label htmlFor="vaccine" className="ml-2 block text-sm font-bold text-gray-700">ได้รับวัคซีนครบถ้วนแล้ว</label>
                        </div>
                        {formData.vaccine_status && (
                            <div className="mt-4 p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
                                <label className="block text-sm font-bold text-gray-700 mb-2">อัปเดตรูปใบรับรองวัคซีนใหม่ (ถ้ามี)</label>
                                {vaccineCertPreview || existingVaccineCert ? (
                                    <div className="relative inline-block">
                                        <img src={vaccineCertPreview || getFullImageUrl(existingVaccineCert)} alt="Vaccine Cert" className="h-24 w-auto rounded border shadow-sm" />
                                        <button type="button" onClick={() => {setVaccineCertFile(null); setVaccineCertPreview(''); setExistingVaccineCert(null)}} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-xs hover:bg-red-600 transition-colors">
                                            <FiX />
                                        </button>
                                    </div>
                                ) : (
                                    <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleVaccineChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">รายละเอียดเพิ่มเติม</label>
                    <textarea name="description" rows="4" value={formData.description} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50 resize-none"></textarea>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button type="submit" disabled={saving} className={`px-8 py-4 rounded-full text-white font-bold transition-all shadow-md text-lg ${saving ? 'bg-primary-light cursor-not-allowed' : 'bg-primary hover:bg-primary-dark hover:shadow-lg'}`}>
                        {saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการแก้ไขประกาศ'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default EditProduct;
