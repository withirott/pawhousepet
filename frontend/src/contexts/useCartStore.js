import { create } from 'zustand';
import api from '../services/axios';

const useCartStore = create((set, get) => ({
    cart: [],
    loading: false,

    fetchCart: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/cart');
            set({ cart: res.data, loading: false });
        } catch (error) {
            console.error('Fetch cart error:', error);
            set({ loading: false });
        }
    },

    addToCart: async (productId) => {
        try {
            await api.post('/cart', { productId });
            await get().fetchCart();
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Error adding to cart' };
        }
    },

    removeFromCart: async (productId) => {
        try {
            await api.delete(`/cart/${productId}`);
            set((state) => ({
                cart: state.cart.filter(item => item.product_id !== productId)
            }));
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Error removing from cart' };
        }
    },

    clearCart: () => set({ cart: [] })
}));

export default useCartStore;
