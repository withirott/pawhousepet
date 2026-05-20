import { create } from 'zustand';
import api from '../services/axios';

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    loading: true, // For initial page load checking token

    // Action to set user directly (e.g. after login)
    login: (userData, token) => {
        localStorage.setItem('token', token);
        set({ user: userData, isAuthenticated: true, loading: false });
    },

    // Action to logout
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false, loading: false });
    },

    // Action to verify token and fetch me data
    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ user: null, isAuthenticated: false, loading: false });
            return;
        }

        try {
            const response = await api.get('/auth/me'); // Assuming we have GET /api/auth/me
            set({ user: response.data, isAuthenticated: true, loading: false });
        } catch (error) {
            console.error('Failed to authenticate:', error);
            localStorage.removeItem('token');
            set({ user: null, isAuthenticated: false, loading: false });
        }
    },

    // Alias for checkAuth to refresh profile data
    fetchUserProfile: async () => {
        const { checkAuth } = useAuthStore.getState();
        await checkAuth();
    }
}));

export default useAuthStore;
