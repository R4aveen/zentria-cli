import axios from 'axios';
import { AuthService } from './auth.service.js';
import { TechnicalItem } from '../types/api.types.js';

const api = axios.create();

api.interceptors.request.use((config) => {
  // Don't send a stored token on the login endpoint — it may be stale
  // and cause the API to reject the request with 401.
  const isLoginRequest = config.url?.includes('/api/login');
  if (!isLoginRequest) {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  config.baseURL = AuthService.getBaseUrl();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't intercept 401 for login — let it reach the login handler
    // so the real server message (e.g. "Invalid credentials") is shown.
    const isLoginRequest = error.config?.url?.includes('/api/login');
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      AuthService.logout();
      throw new Error('Sesión expirada o inválida. Por favor, cierre el sistema y vuelva a ingresar.');
    }
    return Promise.reject(error);
  }
);

export class ApiService {
  static async login(email: string, password: Buffer | string) {
    try {
      // Ensure no stale token contaminates the login request
      AuthService.clearToken();

      const passwordStr = password instanceof Buffer ? password.toString('utf-8') : password;
      const response = await api.post('/api/login', { email, password: passwordStr });
      
      if (response.data) {
        const token = response.data.access_token || response.data.token || (response.data.data && response.data.data.token);
        const branchId = response.data.user?.branch?.id || response.data.data?.user?.branch?.id;
        
        if (token) {
          AuthService.setToken(token);
          if (branchId) AuthService.setBranchId(branchId);
          return response.data;
        } else {
          throw new Error(`Respuesta inválida del servidor: no se encontró token en la respuesta. Contacte soporte.`);
        }
      } else {
        throw new Error('Respuesta vacía del servidor.');
      }
    } catch (error: any) {
      // For login, extract the real server message instead of generic handling
      if (error.response) {
        const status = error.response.status;
        const serverData = error.response.data;
        const serverMsg = serverData?.message || serverData?.error || (typeof serverData === 'string' ? serverData : null);

        if (status === 401 || status === 422) {
          throw new Error(serverMsg || 'Credenciales incorrectas. Verifique su email y contraseña.');
        }
        if (status === 500) {
          throw new Error(`Error del servidor (500). Intente nuevamente más tarde.`);
        }
        throw new Error(`Error ${status}: ${serverMsg || 'Error desconocido del servidor.'}`);
      } else if (error.request) {
        throw new Error('Error de Red: No se pudo conectar con el servidor. Verifique su conexión y la URL de la API.');
      } else {
        // Re-throw errors we created above (no response/request = our own throws)
        throw error;
      }
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
