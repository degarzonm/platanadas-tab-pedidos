import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  sucursalId: string | null;
  isAuthenticated: boolean;
  
  login: (token: string, sucursalId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      sucursalId: null,
      isAuthenticated: false,

      login: (token, sucursalId) => set({ 
        token, 
        sucursalId, 
        isAuthenticated: true 
      }),

      logout: () => set({ 
        token: null, 
        sucursalId: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'platanadas-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);