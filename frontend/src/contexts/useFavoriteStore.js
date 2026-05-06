import { create } from 'zustand';
import api from '../services/axios';
import Swal from 'sweetalert2';
import useAuthStore from './useAuthStore';

const useFavoriteStore = create((set, get) => ({
    favoriteIds: [],
    loading: false,

    fetchFavoriteIds: async () => {
        // Only fetch if authenticated
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isAuthenticated) return;

        set({ loading: true });
        try {
            const res = await api.get('/favorites/my-favorite-ids');
            set({ favoriteIds: res.data });
        } catch (error) {
            console.error('Fetch favorite ids error:', error);
        } finally {
            set({ loading: false });
        }
    },

    toggleFavorite: async (productId) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        
        if (!isAuthenticated) {
            Swal.fire({
                icon: 'info',
                title: 'กรุณาเข้าสู่ระบบ',
                text: 'คุณต้องเข้าสู่ระบบก่อนเพื่อเพิ่มสัตว์เลี้ยงตัวนี้ในรายการโปรด',
                confirmButtonColor: '#34d399',
            });
            return false;
        }

        try {
            const res = await api.post('/favorites/toggle', { productId });
            
            // Update local state based on backend response
            set((state) => {
                if (res.data.isFavorite) {
                    return { favoriteIds: [...state.favoriteIds, productId] };
                } else {
                    return { favoriteIds: state.favoriteIds.filter(id => id !== productId) };
                }
            });
            
            return res.data.isFavorite;

        } catch (error) {
            console.error('Toggle favorite error:', error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกรายการโปรดได้ในขณะนี้', 'error');
            return null;
        }
    },
    
    clearFavorites: () => set({ favoriteIds: [] })
}));

export default useFavoriteStore;
