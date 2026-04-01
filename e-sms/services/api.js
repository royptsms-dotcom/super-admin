import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../constants/config';

const api = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 10000,
});

// Otomatis tambah token di setiap request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;