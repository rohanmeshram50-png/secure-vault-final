
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://35.154.133.180:3000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
