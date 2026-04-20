import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  // URL Jaringan ini akan disuntikkan secara otomatis oleh script server 3 .bat
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] Using Token:', token.substring(0, 10) + '...');
  }
  
  console.log('[API] Calling:', config.method?.toUpperCase(), config.url);
  return config;
});

export default api;