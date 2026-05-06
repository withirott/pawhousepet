import React, { useState, useEffect } from 'react';
import api from '../../services/axios';
import ProductCard from '../ProductCard';
import useFavoriteStore from '../../contexts/useFavoriteStore';
import { FiHeart } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const { favoriteIds } = useFavoriteStore();

    useEffect(() => {
        fetchFavorites();
    }, []);

    // Also listen to favoriteIds changes just in case user unfavorites something here
    useEffect(() => {
        if (!loading) {
            // keep favorites in sync with the global favoriteIds incase it was removed
            setFavorites(prev => prev.filter(p => favoriteIds.includes(p.id)));
        }
    }, [favoriteIds]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const res = await api.get('/favorites/my-favorites');
            setFavorites(res.data);
        } catch (error) {
            console.error('Fetch favorites error', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-full flex justify-center items-center">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-full overflow-hidden flex flex-col animate-fade-in fade-in">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-3xl font-black text-secondary tracking-tight">รายการโปรด</h2>
                <p className="text-gray-500 mt-2 text-lg">รายการสัตว์เลี้ยงทั้งหมดที่คุณสนใจและบันทึกเอาไว้</p>
            </div>

            <div className="p-8 flex-grow">
                {favorites.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <FiHeart size={40} className="fill-current" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">ยังไม่มีรายการโปรด</h3>
                        <p className="text-gray-500 mb-8 max-w-sm">คุณสามารถค้นหาสัตว์เลี้ยงที่สนใจ และกดหัวใจเพื่อบันทึกเก็บไว้ดูภายหลังได้</p>
                        <Link to="/marketplace" className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 rounded-full transition-transform hover:-translate-y-1 shadow-md">
                            ไปที่ตลาดซื้อขาย
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
