import React, { useState, useEffect } from 'react';
import api from '../services/axios';
import ProductCard from '../components/ProductCard';
import { FiFilter, FiSearch } from 'react-icons/fi';

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    species: '',
    min_price: '',
    max_price: '',
    age: '',
    gender: '',
    location: ''
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Debounce logic for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (debouncedSearch) queryParams.append('search', debouncedSearch);
        if (filters.species) queryParams.append('species', filters.species);
        if (filters.min_price) queryParams.append('min_price', filters.min_price);
        if (filters.max_price) queryParams.append('max_price', filters.max_price);
        if (filters.age) queryParams.append('age', filters.age);
        if (filters.gender) queryParams.append('gender', filters.gender);
        if (filters.location) queryParams.append('location', filters.location);

        const res = await api.get(`/products?${queryParams.toString()}`);
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to fetch marketplace data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch, filters.species, filters.min_price, filters.max_price, filters.age, filters.gender, filters.location]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const quickCategories = [
    { label: 'ทั้งหมด', icon: '🐾', action: { species: '', max_price: '' } },
    { label: 'สุนัข', icon: '🐕', action: { species: 'Dog', max_price: '' } },
    { label: 'แมว', icon: '🐈', action: { species: 'Cat', max_price: '' } },
    { label: 'นก', icon: '🐦', action: { species: 'Bird', max_price: '' } },
    { label: 'ปลา', icon: '🐟', action: { species: 'Fish', max_price: '' } },
    { label: 'สายแจกฟรี', icon: '🎁', action: { species: '', max_price: '0' } }
  ];

  const handleCategoryClick = (action) => {
    setFilters({ ...filters, species: action.species, max_price: action.max_price });
  };

  const isCategoryActive = (action) => {
    if (action.max_price === '0') return filters.max_price === '0';
    if (action.species === '') return filters.species === '' && filters.max_price !== '0';
    return filters.species === action.species && filters.max_price !== '0';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Filter */}
      <aside className="w-full md:w-1/4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-24">
        <div className="flex items-center space-x-2 text-xl font-black text-secondary mb-6 border-b pb-4 border-gray-100">
          <FiFilter className="text-primary" />
          <h2>ตัวกรองการค้นหา</h2>
        </div>

        <div className="space-y-6 animate-fade-in fade-in">
          {/* Keyword Search */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">ค้นหา</label>
            <div className="relative">
              <input 
                type="text" 
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="ชื่อสัตว์" 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
              />
              <FiSearch className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">ประเภทสัตว์เลี้ยง</label>
            <select 
                name="species" 
                value={filters.species} 
                onChange={handleFilterChange}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="">ทั้งหมด</option>
              <option value="Dog">สุนัข</option>
              <option value="Cat">แมว</option>
              <option value="Bird">นก</option>
              <option value="Fish">ปลา</option>
              <option value="Other">สายพันธุ์อื่นๆ</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">เพศ</label>
            <select 
                name="gender" 
                value={filters.gender} 
                onChange={handleFilterChange}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="">ทั้งหมด</option>
              <option value="Male">เพศผู้ (Male)</option>
              <option value="Female">เพศเมีย (Female)</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">ช่วงราคา (บาท)</label>
            <div className="flex items-center space-x-3">
              <input 
                type="number" 
                name="min_price"
                value={filters.min_price}
                onChange={handleFilterChange}
                placeholder="ขั้นต่ำ" 
                className="w-1/2 border border-gray-200 bg-gray-50 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              />
              <span className="text-gray-400 font-bold">-</span>
              <input 
                type="number" 
                name="max_price"
                value={filters.max_price}
                onChange={handleFilterChange}
                placeholder="สูงสุด" 
                className="w-1/2 border border-gray-200 bg-gray-50 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              />
            </div>
          </div>

          {/* Age Max */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">อายุไม่เกิน (เดือน)</label>
            <input 
                type="number" 
                name="age"
                value={filters.age}
                onChange={handleFilterChange}
                placeholder="เช่น 12 เดือน" 
                className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">สถานที่ / จังหวัด</label>
            <input 
                type="text" 
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="เช่น ขอนแก่น, กรุงเทพ" 
                className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
            />
          </div>

          <button 
            onClick={() => setFilters({search: '', species: '', min_price: '', max_price: '', age: '', gender: '', location: ''})}
            className="w-full bg-white text-red-500 font-bold border-2 border-red-100 py-3 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all text-sm mt-4 shadow-sm"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      </aside>

      {/* Main Content (Grid) */}
      <main className="w-full md:w-3/4 flex flex-col space-y-6">
        
        {/* Quick Category Pills */}
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
            {quickCategories.map((cat, idx) => {
                const active = isCategoryActive(cat.action);
                return (
                    <button
                        key={idx}
                        onClick={() => handleCategoryClick(cat.action)}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all shadow-sm ${
                            active 
                            ? 'bg-primary text-white shadow-md transform scale-105' 
                            : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:text-primary'
                        }`}
                    >
                        <span className="text-xl">{cat.icon}</span>
                        <span>{cat.label}</span>
                    </button>
                );
            })}
        </div>

        {loading ? (
           <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in fade-in">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-16 text-center rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center animate-fade-in fade-in">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
                <FiSearch size={40} className="text-primary/50" />
             </div>
             <h3 className="text-2xl font-black text-secondary mb-2">ไม่พบสัตว์เลี้ยงที่คุณค้นหา</h3>
             <p className="text-gray-500 text-lg">ลองปรับตัวกรองให้กว้างขึ้น หรือค้นหาด้วยคำอื่นดูอีกครั้ง</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Marketplace;
