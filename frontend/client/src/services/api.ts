// src/services/api.ts
import axios from 'axios';

/**
 * Cliente Axios configurado para comunicação com a API
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://spartaback.timetap.click/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@Spartakus:token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros nas respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se receber um 401 (não autorizado), deslogar o usuário
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('@Spartakus:token');
      localStorage.removeItem('@Spartakus:user');
      
      // Redirecionar para login (se não estiver já na página de login)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Tratamento para erros de rede ou servidor
    if (!error.response) {
      console.error('Erro de rede ou servidor indisponível:', error);
      // Poderia exibir um toast ou notification global aqui
    }
    
    return Promise.reject(error);
  }
);

export { api };