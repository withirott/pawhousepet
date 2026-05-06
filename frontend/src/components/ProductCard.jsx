import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import useFavoriteStore from '../contexts/useFavoriteStore';

const ProductCard = ({ product }) => {
  const { favoriteIds, toggleFavorite } = useFavoriteStore();
  const isFavorite = favoriteIds.includes(product.id);
  const navigate = useNavigate();

  const imageUrl = product.image_url 
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${product.image_url}`
    : 'https://via.placeholder.com/400x300?text=No+Image';

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(price) || 0);
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  const getGenderIcon = (gender) => {
      switch(gender) {
          case 'Male': return <span className="text-blue-500 font-bold ml-1">♂</span>;
          case 'Female': return <span className="text-pink-500 font-bold ml-1">♀</span>;
          default: return '';
      }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col h-full cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
      {/* Favorite Button (floating) */}
      <button 
        onClick={handleToggleFavorite}
        className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full transition-all z-10 shadow-sm hover:scale-110"
      >
        <FiHeart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
      </button>

      {/* Image Container */}
      <div className="aspect-w-4 aspect-h-3 bg-gray-200 w-full h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 truncate pr-2 flex items-center">
              {product.name}
              {getGenderIcon(product.gender)}
          </h3>
          {product.vaccine_status && (
            <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
              <span>{product.age_months} เดือน</span>
              <span>•</span>
              {product.vaccine_status ? <span className="text-green-600 flex items-center"><FiCheckCircle className="mr-1" />ฉีดวัคซีนแล้ว</span> : <span>ยังไม่ฉีดวัคซีน</span>}
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.breed} • {product.age_months} เดือน</p>
        
        {product.location && (
            <div className="flex items-center text-xs text-secondary font-bold mb-4">
                <FiMapPin className="mr-1" /> {product.location}
            </div>
        )}
        
        <div className="p-4 pt-0 mt-auto flex justify-between items-center bg-gray-50/50 border-t border-gray-100 group-hover:bg-white transition-colors">
          <span className={`text-xl font-extrabold ${parseFloat(product.price) === 0 ? 'text-green-500' : 'text-primary'}`}>
            {parseFloat(product.price) === 0 ? 'แจกฟรี!' : formatPrice(product.price)}
          </span>
          <Link 
            to={`/products/${product.id}`}
            onClick={(e) => e.stopPropagation()} // Prevent double navigation since the card is clickable
            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-full hover:bg-primary-dark transition-colors shadow-sm"
          >
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
