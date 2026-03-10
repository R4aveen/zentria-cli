import axios from 'axios';
import { AuthService } from './auth.service.js';
import { TechnicalItem } from '../types/api.types.js';

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = AuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.baseURL = AuthService.getBaseUrl();
  return config;
});

export class ApiService {
  static async login(email: string, password: Buffer | string) {
    try {
      const response = await api.post('/api/login', { email, password });
      
      if (response.data) {
        // Try multiple common token field names
        const token = response.data.access_token || response.data.token || (response.data.data && response.data.data.token);
        
        if (token) {
          AuthService.setToken(token);
          return response.data;
        } else {
          throw new Error(`Respuesta inválida: No se encontró token en ${JSON.stringify(response.data)}`);
        }
      } else {
        throw new Error('Respuesta vacía del servidor');
      }
    } catch (error: any) {
      if (error.response) {
        // The server responded with a status code that falls out of the range of 2xx
        throw new Error(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error(`No se recibió respuesta del servidor en ${AuthService.getBaseUrl()}. Verifique su conexión.`);
      } else {
        throw new Error(error.message);
      }
    }
  }

  static async fetchItem(batch_id: string): Promise<TechnicalItem[]> {
    const response = await api.get(`/api/branches/1/technical-reviews/items`, {
      params: { batch_id },
    });
    return response.data;
  }
}
