import React, { useState } from 'react';
import api from '../../services/axios';
import Swal from 'sweetalert2';
import { FiUploadCloud, FiX } from 'react-icons/fi';

const AddProduct = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    price: '',
    vaccine_status: false,
    description: '',
    gender: 'Unknown',
    location: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [vaccineCertFile, setVaccineCertFile] = useState(null);
  const [vaccineCertPreview, setVaccineCertPreview] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check file size 5MB limit
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
        Swal.fire('ไฟล์ใหญ่เกินไป', 'มีรูปภาพบางรูปขนาดเกิน 5MB กรุณาเลือกรูปใหม่', 'warning');
        return;
    }

    // Limit to 5 images
    if (imageFiles.length + files.length > 5) {
        Swal.fire('เกินกำหนด', 'คุณสามารถอัปโหลดรูปภาพได้สูงสุดเพียง 5 รูปเท่านั้น', 'warning');
        return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
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
    if (imageFiles.length === 0) {
        Swal.fire('จำเป็นต้องมีรูปภาพ', 'กรุณาอัปโหลดรูปภาพสัตว์เลี้ยงของคุณอย่างน้อย 1 รูป', 'warning');
        return;
    }

    setLoading(true);
    try {
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            formDataToSend.append(key, formData[key]);
        });
        
        imageFiles.forEach(file => {
            formDataToSend.append('productImage', file);
        });

        if (formData.vaccine_status && vaccineCertFile) {
            formDataToSend.append('vaccineCert', vaccineCertFile);
        }

        await api.post('/products', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        Swal.fire('สำเร็จ', 'ลงประกาศสัตว์เลี้ยงสำเร็จแล้ว!', 'success');
        
        // Reset form
        setFormData({
            name: '', species: 'Dog', breed: '', age_months: '', price: '', vaccine_status: false, description: '', gender: 'Unknown', location: ''
        });
        setImageFiles([]);
        setImagePreviews([]);
        setVaccineCertFile(null);
        setVaccineCertPreview('');
        
        if (onSuccess) onSuccess();

    } catch (error) {
        console.error(error);
        Swal.fire('ล้มเหลว', error.response?.data?.message || 'ไม่สามารถลงประกาศสัตว์เลี้ยงได้', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 relative animate-fade-in fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">สร้างประกาศใหม่</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสัตว์เลี้ยง *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-primary focus:border-primary text-sm" placeholder="เช่น น้องลูน่า" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทสัตว์ *</label>
                    <select name="species" value={formData.species} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-primary focus:border-primary text-sm">
                        <option value="Dog">สุนัข (Dog)</option>
                        <option value="Cat">แมว (Cat)</option>
                        <option value="Bird">นก (Bird)</option>
                        <option value="Fish">ปลา (Fish)</option>
                        <option value="Other">ประเภทอื่นๆ (Other)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เพศ *</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-primary focus:border-primary text-sm">
                        <option value="Unknown">ไม่ระบุ / ไม่ทราบเพศ</option>
                        <option value="Male">เพศผู้ (Male)</option>
                        <option value="Female">เพศเมีย (Female)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สายพันธุ์แบบเฉพาะเจาะจง</label>
                    <input type="text" name="breed" value={formData.breed} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-primary focus:border-primary text-sm" placeholder="เช่น Golden Retriever, เปอร์เซีย" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">อายุ (เดือน) *</label>
                    <input type="number" name="age_months" required min="0" value={formData.age_months} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-primary focus:border-primary text-sm" placeholder="ระบุเป็นเดือน เช่น 12" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาที่ต้องการขาย (บาท) *</label>
                    <input type="number" name="price" required min="0" value={formData.price} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-primary focus:border-primary text-sm" placeholder="เช่น 5500 (ใส่ 0 เพื่อแจกฟรี)" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัดที่สามารถนัดรับได้</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-primary focus:border-primary text-sm" placeholder="เช่น กรุงเทพมหานคร, เชียงใหม่" />
                </div>
                <div className="flex flex-col mt-6">
                    <div className="flex items-center">
                        <input type="checkbox" id="vaccine" name="vaccine_status" checked={formData.vaccine_status} onChange={handleInputChange} className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary" />
                        <label htmlFor="vaccine" className="ml-2 block text-sm text-gray-700">ได้รับวัคซีนครบถ้วนแล้ว</label>
                    </div>
                    {formData.vaccine_status && (
                        <div className="mt-4 p-4 border border-blue-100 bg-blue-50/50 rounded-xl animate-fade-in fade-in">
                            <label className="block text-sm font-bold text-gray-700 mb-2">อัปโหลดรูปใบรับรองวัคซีน</label>
                            {vaccineCertPreview ? (
                                <div className="relative inline-block">
                                    <img src={vaccineCertPreview} alt="Vaccine Cert" className="h-24 w-auto rounded border" />
                                    <button type="button" onClick={() => {setVaccineCertFile(null); setVaccineCertPreview('')}} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-xs">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">คำโฆษณา หรือรายละเอียดเพิ่มเติม</label>
                <textarea name="description" rows="4" value={formData.description} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-primary focus:border-primary text-sm" placeholder="อธิบายจุดเด่นของน้อง ความน่ารัก สุขภาพ โรคประจำตัว หรือสิ่งที่ผู้ซื้อควรทราบ..."></textarea>
            </div>

            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพ (รองรับสูงสุด 5 ไฟล์ * รูปแรกจะเป็นรูปหน้าปก)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors relative">
                    <FiUploadCloud size={40} className="mb-2 text-primary" />
                    <p className="text-sm">คลิกเพื่อเลือกไฟล์ หรือลากปุ่มลงมาวางที่นี่กรอบนี้</p>
                    <p className="text-xs text-gray-400 mt-1">ไฟล์ JPEG, PNG, WEBP ขนาดไม่เกิน 5MB</p>
                    <input type="file" multiple accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>

                {/* Previews */}
                {imagePreviews.length > 0 && (
                    <div className="flex space-x-4 mt-4 overflow-x-auto py-2">
                        {imagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                                <img src={preview} alt="preview" className={`w-full h-full object-cover rounded-lg ${idx === 0 ? 'border-2 border-primary' : ''}`} />
                                {idx === 0 && <span className="absolute bottom-0 left-0 bg-primary bg-opacity-80 text-white text-[10px] px-2 py-0.5 rounded-tr-lg rounded-bl-lg">หน้าปกหลัก</span>}
                                <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                                    <FiX size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8 flex justify-end">
                <button type="submit" disabled={loading} className={`px-6 py-3 rounded-full text-white font-bold transition-all shadow-md ${loading ? 'bg-primary-light cursor-not-allowed' : 'bg-primary hover:bg-primary-dark hover:shadow-lg'}`}>
                    {loading ? 'กำลังบันทึกข้อมูล...' : 'เผยแพร่ประกาศทันที'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default AddProduct;
