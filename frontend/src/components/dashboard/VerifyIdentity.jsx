import React, { useState } from 'react';
import api from '../../services/axios';
import Swal from 'sweetalert2';
import useAuthStore from '../../contexts/useAuthStore';
import { isValidThaiID } from '../../utils/idValidator';
import { FiShield, FiCheckCircle, FiUploadCloud, FiClock, FiXCircle } from 'react-icons/fi';

const VerifyIdentity = ({ onSuccess }) => {
    const { user, fetchUserProfile } = useAuthStore();
    const [nationalId, setNationalId] = useState('');
    const [idCardFile, setIdCardFile] = useState(null);
    const [idCardPreview, setIdCardPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (user?.verification_status === 'pending') {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-12 animate-fade-in fade-in flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-yellow-600 shadow-inner">
                    <FiClock size={40} />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">รอการตรวจสอบ</h2>
                <p className="text-gray-600 text-center max-w-md">คุณได้ส่งข้อมูลยืนยันตัวตนแล้ว กรุณารอแอดมินตรวจสอบข้อมูลและอนุมัติภายใน 24 ชั่วโมงครับ</p>
            </div>
        );
    }

    const handleChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 13);
        setNationalId(value);
        if (error) setError('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('ไฟล์ใหญ่เกิน 5MB');
                return;
            }
            setIdCardFile(file);
            setIdCardPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (nationalId.length !== 13) {
            setError('กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก');
            return;
        }

        if (!isValidThaiID(nationalId)) {
            setError('เลขประจำตัวประชาชนไม่ถูกต้องตามรูปแบบ');
            return;
        }

        if (!idCardFile) {
            setError('กรุณาอัปโหลดรูปภาพถ่ายบัตรประชาชนของคุณ');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('nationalId', nationalId);
            formData.append('idCardImage', idCardFile);

            await api.post('/users/verify-id', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchUserProfile();
            
            Swal.fire({
                icon: 'success',
                title: 'ส่งข้อมูลสำเร็จ',
                text: 'กรุณารอแอดมินตรวจสอบและอนุมัติ',
                confirmButtonColor: '#34d399',
                timer: 3000,
                showConfirmButton: false
            });
            
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Verify error', err);
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-12 animate-fade-in fade-in flex flex-col items-center justify-center min-h-[60vh]">
            {user?.verification_status === 'rejected' && (
                <div className="w-full max-w-md bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center">
                    <FiXCircle className="mr-3 flex-shrink-0" size={24} />
                    <div>
                        <p className="font-bold">การยืนยันตัวตนถูกปฏิเสธ</p>
                        <p className="text-sm text-red-600">รูปถ่ายอาจไม่ชัดเจน หรือข้อมูลไม่ถูกต้อง กรุณาส่งใหม่อีกครั้ง</p>
                    </div>
                </div>
            )}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 shadow-inner">
                <FiShield size={40} />
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">ยืนยันตัวตนผู้ขาย</h2>
            
            <div className="max-w-md w-full bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8 text-center text-sm text-gray-600 shadow-sm">
                <p className="mb-3">เพื่อความปลอดภัยและสร้างความน่าเชื่อถือให้กับแพลตฟอร์ม <b>ผู้ขายทุกท่านจำเป็นต้องยืนยันตัวตน</b> ก่อนการลงประกาศสินค้า</p>
                <div className="flex items-center justify-center text-xs text-primary font-medium bg-green-50 p-2 rounded-lg border border-green-100">
                    <FiCheckCircle className="mr-2" size={16} /> ข้อมูลของคุณจะถูกเข้ารหัสและเก็บรักษาเป็นความลับอย่างสูงสุด
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm">
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">เลขประจำตัวประชาชน 13 หลัก</label>
                    <input
                        type="text"
                        value={nationalId}
                        onChange={handleChange}
                        className={`w-full text-center tracking-[0.3em] text-lg px-4 py-4 rounded-xl border ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20'} focus:ring-4 focus:outline-none transition-all`}
                        placeholder="1-2345-67890-12-3"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">อัปโหลดรูปถ่ายหน้าบัตรประชาชน</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer min-h-[150px]">
                        {idCardPreview ? (
                            <img src={idCardPreview} alt="ID Card Preview" className="h-32 object-contain rounded-lg" />
                        ) : (
                            <>
                                <FiUploadCloud size={30} className="mb-2 text-primary" />
                                <p className="text-sm text-center">คลิกเพื่อเลือกไฟล์รูปภาพบัตร</p>
                            </>
                        )}
                        <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                    {error && <p className="text-red-500 text-sm mt-3 text-center font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading || nationalId.length !== 13 || !idCardFile}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        'ยืนยันข้อมูลและดำเนินการต่อ'
                    )}
                </button>
            </form>
        </div>
    );
};

export default VerifyIdentity;
