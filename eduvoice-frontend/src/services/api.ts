import axios, { AxiosError, AxiosResponse } from 'axios';
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  Document,
  DocumentDetail,
  DocumentUpload,
  Course,
  AudioFile,
  ConversionRequest,
  ConversionResponse,
  UserStatistics,
  AdminStatistics,
  PaginatedResponse,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest.headers['X-Retry']) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry original request
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          originalRequest.headers['X-Retry'] = 'true';
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/register/', data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout/', { refresh: refreshToken });
  },

  getCurrentUser: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get('/auth/user/');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response: AxiosResponse<User> = await api.put('/auth/user/', data);
    return response.data;
  },

  updatePreferences: async (data: any): Promise<User> => {
    const response: AxiosResponse<User> = await api.put('/auth/user/preferences/', data);
    return response.data;
  },

  changePassword: async (data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ message: string }> => {
    const response = await api.post('/auth/user/change-password/', data);
    return response.data;
  },
};

// Documents API
export const documentsAPI = {
  list: async (params?: {
    page?: number;
    search?: string;
    file_type?: string;
    status?: string;
    course?: number;
    subject?: string;
  }): Promise<PaginatedResponse<Document>> => {
    const response: AxiosResponse<PaginatedResponse<Document>> = await api.get('/documents/', {
      params,
    });
    return response.data;
  },

  get: async (id: number): Promise<DocumentDetail> => {
    const response: AxiosResponse<DocumentDetail> = await api.get(`/documents/${id}/`);
    return response.data;
  },

  upload: async (data: DocumentUpload): Promise<Document> => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('file', data.file);
    if (data.course) formData.append('course', data.course.toString());
    if (data.subject) formData.append('subject', data.subject);
    if (data.is_public !== undefined) formData.append('is_public', data.is_public.toString());

    const response: AxiosResponse<Document> = await api.post('/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}/`);
  },

  convert: async (id: number, options?: ConversionRequest): Promise<ConversionResponse> => {
    const response: AxiosResponse<ConversionResponse> = await api.post(
      `/documents/${id}/convert/`,
      options
    );
    return response.data;
  },

  myDocuments: async (): Promise<Document[]> => {
    const response: AxiosResponse<Document[]> = await api.get('/documents/my_documents/');
    return response.data;
  },

  geminiRead: async (id: number, options?: { mode?: string; language?: string }): Promise<any> => {
    const response: AxiosResponse<any> = await api.post(
      `/documents/${id}/gemini_read/`,
      options || { mode: 'summary' }
    );
    return response.data;
  },
  getAudioFiles: async (id: number): Promise<AudioFile[]> => {
  const response: AxiosResponse<AudioFile[]> = await api.get(`/documents/${id}/audio_files/`);
  return response.data;
},

};



// Courses API
export const coursesAPI = {
  list: async (): Promise<Course[]> => {
    const response: AxiosResponse<Course[]> = await api.get('/documents/courses/');
    return response.data;
  },

  get: async (id: number): Promise<Course> => {
    const response: AxiosResponse<Course> = await api.get(`/documents/courses/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Course>): Promise<Course> => {
    const response: AxiosResponse<Course> = await api.post('/documents/courses/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Course>): Promise<Course> => {
    const response: AxiosResponse<Course> = await api.put(`/documents/courses/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/documents/courses/${id}/`);
  },

  enroll: async (id: number): Promise<{ message: string }> => {
    const response = await api.post(`/documents/courses/${id}/enroll/`);
    return response.data;
  },

  unenroll: async (id: number): Promise<{ message: string }> => {
    const response = await api.post(`/documents/courses/${id}/unenroll/`);
    return response.data;
  },
};

// Audio API
export const audioAPI = {
  list: async (params?: {
    page?: number;
    search?: string;
    status?: string;
    voice_type?: string;
    language?: string;
  }): Promise<PaginatedResponse<AudioFile>> => {
    const response: AxiosResponse<PaginatedResponse<AudioFile>> = await api.get('/audio/', {
      params,
    });
    return response.data;
  },

  get: async (id: number): Promise<AudioFile> => {
    const response: AxiosResponse<AudioFile> = await api.get(`/audio/${id}/`);
    return response.data;
  },

  download: async (id: number): Promise<Blob> => {
    const response: AxiosResponse<Blob> = await api.get(`/audio/${id}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getStreamUrl: (id: number): string => {
    const token = localStorage.getItem('access_token');
    return `${API_BASE_URL}/audio/${id}/stream/?token=${token}`;
  },

  getStatus: async (id: number): Promise<any> => {
    const response = await api.get(`/audio/${id}/status/`);
    return response.data;
  },

  myAudio: async (): Promise<AudioFile[]> => {
    const response: AxiosResponse<AudioFile[]> = await api.get('/audio/my_audio/');
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getUserStats: async (days?: number): Promise<UserStatistics> => {
    const response: AxiosResponse<UserStatistics> = await api.get('/analytics/user-stats/', {
      params: { days },
    });
    return response.data;
  },

  getAdminStats: async (days?: number): Promise<AdminStatistics> => {
    const response: AxiosResponse<AdminStatistics> = await api.get('/analytics/admin-stats/', {
      params: { days },
    });
    return response.data;
  },

  logActivity: async (activityType: string, metadata?: any): Promise<void> => {
    await api.post('/analytics/log-activity/', {
      activity_type: activityType,
      metadata,
    });
  },
};


export default api;
