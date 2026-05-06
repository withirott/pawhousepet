import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/axios';
import ProductCard from '../components/ProductCard';
import { FiSearch, FiMessageSquare, FiShield, FiHeart, FiStar } from 'react-icons/fi';

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const res = await api.get('/products');
        setFeaturedPets(res.data.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch featured pets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, []);

  return (
    <div className="bg-white flex-grow">
      
      {/* 1. Hero Section */}
      <section className="relative bg-secondary overflow-hidden">
        {/* Abstract Background Bubbles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl mix-blend-screen pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="pt-20 pb-24 md:pt-32 md:pb-36 flex flex-col items-center text-center">
                <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 border border-primary/30 bg-primary/10 px-4 py-1.5 rounded-full">ยินดีต้อนรับสู่ PetPew</span>
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight max-w-4xl tracking-tight">
                    เติมเต็ม <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">ความสุข</span> ให้กับบ้านของคุณ
                </h1>
                <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed font-light">
                    แพลตฟอร์มตลาดซื้อขายและรับเลี้ยงสัตว์เลี้ยงที่ปลอดภัยที่สุด สบายใจด้วยระบบยืนยันตัวตนผู้ขาย สลิปโอนเงิน และฟีเจอร์แชทคุยสด
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Link to="/marketplace" className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:bg-primary-dark transition-all transform hover:-translate-y-1 shadow-[0_10px_40px_-10px_rgba(255,107,107,0.7)] flex items-center justify-center">
                        <FiSearch className="mr-2" /> ค้นหาสัตว์เลี้ยง
                    </Link>
                    <Link to="/dashboard" className="px-8 py-4 bg-transparent border-2 border-gray-600 text-white hover:border-white hover:bg-white hover:text-secondary rounded-full font-bold text-lg transition-all flex items-center justify-center">
                        ลงประกาศขาย
                    </Link>
                </div>
            </div>
        </div>
        
        {/* Bottom Curve Divider */}
        <div className="absolute bottom-0 w-full overflow-hidden leading-none">
            <svg className="relative block w-full h-[50px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39 56.44c58-10.79 114.16-30.13 172-41.86 82.39-16.72 168.19-17.73 250.45-.39C823.78 31 906.67 72 985.66 92.83c70.05 18.48 146.53 26.09 214.34 3V120H0V95.8C59.71 118.08 130.83 118.08 192.27 101.99 236.46 89.26 279 73.16 321.39 56.44z" className="fill-gray-50"></path>
            </svg>
        </div>
      </section>

      {/* 2. How It Works */}
      <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-black text-secondary mb-5 tracking-tight">3 ขั้นตอนง่ายๆ</h2>
                  <p className="text-gray-500 max-w-2xl mx-auto text-lg">การรับเพื่อนใหม่เข้าบ้านง่ายกว่าที่คุณคิดและปลอดภัยกว่าที่เคย</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                  {/* Decorative dashed line on desktop */}
                  <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 border-t-2 border-dashed border-gray-300 pointer-events-none"></div>

                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-24 h-24 bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex items-center justify-center -rotate-3 hover:rotate-0 transition-transform duration-300 border border-gray-100 mb-6">
                          <FiSearch size={40} className="text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">1. ค้นหาและทำความรู้จัก</h3>
                      <p className="text-gray-500 leading-relaxed max-w-xs">เลือกดูสัตว์เลี้ยงนับร้อยที่เราเตรียมไว้ให้และค้นหาเพื่อนที่ตรงกับไลฟ์สไตล์คุณ</p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-24 h-24 bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300 border border-gray-100 mb-6">
                          <FiMessageSquare size={40} className="text-secondary" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">2. ทักแชทพูดคุย</h3>
                      <p className="text-gray-500 leading-relaxed max-w-xs">ใช้งานระบบแชทส่วนตัวที่ปลอดภัย ถามข้อสงสัยและขอดูรูปภาพเพิ่มเติมจากผู้ขายได้ 24 ชั่วโมง</p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-24 h-24 bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex items-center justify-center -rotate-3 hover:rotate-0 transition-transform duration-300 border border-gray-100 mb-6">
                          <FiShield size={40} className="text-green-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">3. ชำระเงินล่วงหน้าปลอดภัย</h3>
                      <p className="text-gray-500 leading-relaxed max-w-xs">โอนเงินและอัปโหลดสลิปเข้าระบบ เพื่อส่งสัญญาณให้ผู้ขายเตรียมส่งมอบ ตัดปัญหาการฉ้อโกง</p>
                  </div>
              </div>
          </div>
      </section>

      {/* 3. Featured Pets */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-secondary mb-4 tracking-tight">สัตว์เลี้ยงแนะนำ</h2>
                    <p className="text-gray-500 text-lg">รายการสัตว์เลี้ยงดาวเด่นที่กำลังรอคอยความรักจากครอบครัวใหม่</p>
                </div>
                <Link to="/marketplace" className="hidden sm:inline-flex text-primary font-bold hover:text-primary-dark tracking-wide items-center group bg-primary/10 px-6 py-3 rounded-full transition-colors hover:bg-primary/20">
                    ดูทั้งหมด <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center h-48 items-center">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredPets.map(pet => (
                        <ProductCard key={pet.id} product={pet} />
                    ))}
                </div>
            )}

            <div className="mt-12 text-center sm:hidden">
                <Link to="/marketplace" className="inline-block px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-bold transition-colors w-full">
                    ดูสัตว์เลี้ยงทั้งหมด
                </Link>
            </div>
        </div>
      </section>

      {/* 4. Testimonials */}
      <section className="py-24 bg-secondary text-white relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-gray-700 rounded-full opacity-20"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 border-4 border-gray-700 rounded-full opacity-20"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-16 relative">
                  <div className="inline-block p-4 bg-primary/20 rounded-full mb-6">
                     <FiHeart className="text-primary" size={40} />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">เสียงจากผู้ใช้งานจริง</h2>
                  <p className="text-gray-400 text-lg max-w-2xl mx-auto">ความประทับใจส่วนหนึ่งจากผู้ใช้งานนับพันของแพลตฟอร์มเรา</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Review 1 */}
                  <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:-translate-y-2 transition-transform duration-300">
                      <div className="flex text-yellow-400 mb-6">
                          {[1,2,3,4,5].map(i => <FiStar key={i} className="fill-current" />)}
                      </div>
                      <p className="text-gray-300 mb-8 font-light text-lg leading-relaxed">"ฉันเจอน้องหมา Golden Retriever ที่แสนเพอร์เฟคจาก PetMart ระบบแชท ใช้งานได้ดีมาก ทำให้สอบถามเรื่องต่างๆจากฟาร์มได้อย่างรวดเร็ว!"</p>
                      <div className="flex items-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center font-bold text-xl mr-4 text-white shadow-lg">S</div>
                          <div>
                              <p className="font-bold text-white tracking-wide">สุชานันท์ เครือข่าย</p>
                              <p className="text-sm text-primary-light">รับเลี้ยง 'น้องแม็กซ์'</p>
                          </div>
                      </div>
                  </div>

                  {/* Review 2 */}
                  <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:-translate-y-2 transition-transform duration-300">
                      <div className="flex text-yellow-400 mb-6">
                          {[1,2,3,4,5].map(i => <FiStar key={i} className="fill-current" />)}
                      </div>
                      <p className="text-gray-300 mb-8 font-light text-lg leading-relaxed">"การปล่อยขายลูกแมวเปอร์เซียง่ายดายมาก ระบบยืนยันตัวตนและการอัปโหลดสลิปมันทำให้ผมมั่นใจได้ 100% ว่าปลอดภัย ก่อนการส่งมอบ"</p>
                      <div className="flex items-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center font-bold text-xl mr-4 text-white shadow-lg">ว</div>
                          <div>
                              <p className="font-bold text-white tracking-wide">วิทวัส เพชรเจริญ</p>
                              <p className="text-sm text-blue-300">ฟาร์มแมวเปอร์เซีย กทม.</p>
                          </div>
                      </div>
                  </div>

                  {/* Review 3 */}
                  <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 hover:-translate-y-2 transition-transform duration-300">
                      <div className="flex text-yellow-400 mb-6">
                          {[1,2,3,4,5].map(i => <FiStar key={i} className="fill-current" />)}
                      </div>
                      <p className="text-gray-300 mb-8 font-light text-lg leading-relaxed">"หน้าตาของเว็บไซต์สวยมาก โดดเด่น ดีกว่าการค้นหาผ่านกลุ่ม Facebook ที่ไม่ค่อยเป็นระเบียบ แนะนำแพลตฟอร์มนี้มากๆ!"</p>
                      <div className="flex items-center">
                          <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center font-bold text-xl mr-4 text-white shadow-lg">จ</div>
                          <div>
                              <p className="font-bold text-white tracking-wide">จิราภา นวลจันทร์</p>
                              <p className="text-sm text-green-300">รับเลี้ยง 'น้องลูน่า'</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* 5. CTA Footer */}
      <section className="py-20 bg-primary overflow-hidden relative">
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">คุณพร้อมที่จะขยายครอบครัวหรือยัง?</h2>
              <p className="text-primary-100 text-lg mb-10 text-white/80 max-w-2xl mx-auto">มาร่วมสร้างคอมมูนิตี้สำหรับคนรักสัตว์ที่น่าอยู่ และสร้างความทรงจำดีๆร่วมกับเรา</p>
              <Link to="/register" className="inline-block px-10 py-5 bg-white text-primary rounded-full font-black text-xl hover:shadow-[0_20px_40px_-5px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all">
                  เริ่มใช้งานฟรีทันที!
              </Link>
          </div>
          <div className="absolute top-0 transform -translate-y-1/2 left-10 w-64 h-64 bg-white opacity-10 rounded-full mix-blend-overlay"></div>
          <div className="absolute bottom-0 transform translate-y-1/2 right-20 w-80 h-80 bg-white opacity-10 rounded-full mix-blend-overlay"></div>
      </section>

    </div>
  );
};

export default Home;
