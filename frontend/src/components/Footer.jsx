import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiPhone } from 'react-icons/fi';

const Footer = () => {
    return (
        <footer className="bg-secondary text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center mb-4">
                            <span className="text-2xl font-black text-white tracking-tight">
                                PetHouse<span className="text-primary">Pew</span>
                            </span>
                        </Link>
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            เชื่อมต่อความรักระหว่างคุณกับสัตว์เลี้ยงแสนน่ารัก ภารกิจของเราคือการรับเลี้ยงที่ปลอดภัยและเต็มไปด้วยความสุข
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><FiFacebook size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><FiTwitter size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><FiInstagram size={20} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">ค้นหาและลงขาย</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/marketplace" className="hover:text-primary transition-colors">ค้นหาสัตว์เลี้ยง</Link></li>
                            <li><Link to="/dashboard" className="hover:text-primary transition-colors">ลงขายสัตว์เลี้ยง</Link></li>
                            <li><a href="#" className="hover:text-primary transition-colors">เรื่องราวผู้ใช้งาน</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">พันธมิตรฟาร์มสัตว์</a></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">ศูนย์ช่วยเหลือ</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-primary transition-colors">ศูนย์บริการลูกค้า</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">ความปลอดภัยของแพลตฟอร์ม</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">นโยบายความเป็นส่วนตัว</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">ข้อตกลงและเงื่อนไข</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">ติดต่อเรา</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start">
                                <FiMail className="mt-1 mr-2 text-primary shrink-0" />
                                <span>support@gmail.com</span>
                            </li>
                            <li className="flex items-start">
                                <FiPhone className="mt-1 mr-2 text-primary shrink-0" />
                                <span>+66 (0) 98-746-0393</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                    <p>&copy; {new Date().getFullYear()} PetMart Inc. สงวนลิขสิทธิ์ทั้งหมด</p>
                    <div className="mt-4 md:mt-0 flex space-x-4">
                        <a href="#" className="hover:text-white transition-colors">คุกกี้</a>
                        <a href="#" className="hover:text-white transition-colors">ความปลอดภัย</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
