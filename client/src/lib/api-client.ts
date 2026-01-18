import axios, { AxiosError, AxiosInstance } from 'axios';

// API response envelope types
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Extract error message
    const message = error.response?.data?.error?.message || 'An unexpected error occurred';
    const code = error.response?.data?.error?.code || 'UNKNOWN_ERROR';

    return Promise.reject({
      message,
      code,
      status: error.response?.status,
    });
  }
);

export default apiClient;
