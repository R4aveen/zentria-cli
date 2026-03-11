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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      AuthService.logout();
      throw new Error('Sesión expirada o inválida. Por favor, cierre el sistema y vuelva a ingresar.');
    }
    return Promise.reject(error);
  }
);

export class ApiService {
  static async login(email: string, password: Buffer | string) {
    try {
      const response = await api.post('/api/login', { email, password });
      
      if (response.data) {
        const token = response.data.access_token || response.data.token || (response.data.data && response.data.data.token);
        const branchId = response.data.user?.branch?.id || response.data.data?.user?.branch?.id;
        
        if (token) {
          AuthService.setToken(token);
          if (branchId) AuthService.setBranchId(branchId);
          return response.data;
        } else {
          throw new Error(`Respuesta inválida: No se encontró token`);
        }
      } else {
        throw new Error('Respuesta vacía del servidor');
      }
    } catch (error: any) {
      this.handleApiError(error);
    }
  }

  /**
   * Obtiene items de un lote específico con filtro de búsqueda opcional
   */
  static async fetchItem(batch_id: string, search?: string): Promise<TechnicalItem[]> {
    try {
      const branchId = AuthService.getBranchId();
      const response = await api.get(`/api/branches/${branchId}/technical-reviews/items`, {
        params: { 
          batch_id,
          search 
        },
      });
      return response.data.data || response.data;
    } catch (error: any) {
      this.handleApiError(error);
      return [];
    }
  }

  static async fetchGlobalItems(search: string): Promise<TechnicalItem[]> {
    try {
      const branchId = AuthService.getBranchId();
      const response = await api.get(`/api/branches/${branchId}/technical-reviews/items`, {
        params: { search },
      });
      return response.data.data || response.data;
    } catch (error: any) {
      this.handleApiError(error);
      return [];
    }
  }

  static async fetchBatches(page = 1, perPage = 10): Promise<any> {
    try {
      const branchId = AuthService.getBranchId();
      const response = await api.get(`/api/branches/${branchId}/technical-reviews/batches`, {
        params: {
          page,
          per_page: perPage,
          sort_by: 'id',
          order: 'desc'
        }
      });
      return response.data;
    } catch (error: any) {
      this.handleApiError(error);
    }
  }

  private static handleApiError(error: any) {
    if (error.response) {
      const status = error.response.status;
      const serverData = error.response.data;
      const serverMsg = serverData.message || serverData.error || (typeof serverData === 'string' ? serverData : null);

      if (status === 404) {
        throw new Error('404: El recurso no existe en esta sucursal.');
      }
      if (status === 500) {
        throw new Error(`500: Error Interno del Servidor. Detalle: ${serverMsg || 'Sin detalle disponible'}`);
      }
      throw new Error(`Error ${status}: ${serverMsg || 'Error desconocido'}`);
    } else if (error.request) {
      throw new Error('Error de Red: El servidor no respondió.');
    } else {
      throw new Error(`Error de Aplicación: ${error.message}`);
    }
  }
}
