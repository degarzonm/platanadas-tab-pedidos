import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore'; // Importamos el store directamente

export const API_URL = 'https://platanadas.com/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Recomendado: timeout de 10s para evitar congelamientos
});

// ==========================================
// 🛡️ INTERCEPTOR DE SEGURIDAD
// ==========================================
client.interceptors.request.use(
  async (config) => {
    // Accedemos al estado SIN usar el hook (fuera de componentes React)
    // Zustand permite acceso directo vía .getState()
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Opcional: Interceptor de respuesta para manejar 401 (Token Expirado) automáticamente
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el backend dice "No autorizado", cerramos sesión automáticamente
      useAuthStore.getState().logout(); 
    }
    return Promise.reject(error);
  }
);

export default client;