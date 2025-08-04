/**
 * Utility functions for handling API errors consistently across the application
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Handle common HTTP errors and return user-friendly error messages
 */
export const handleApiError = (error: any): ApiError => {
  console.error('API Error:', error);

  // Handle axios errors
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          message: data?.message || 'Dados inválidos. Verifique as informações fornecidas.',
          status,
          code: 'BAD_REQUEST'
        };
      
      case 401:
        return {
          message: 'Sessão expirada. Por favor, faça login novamente.',
          status,
          code: 'UNAUTHORIZED'
        };
      
      case 403:
        return {
          message: data?.message || 'Acesso negado. Você não tem permissão para realizar esta ação.',
          status,
          code: 'FORBIDDEN'
        };
      
      case 404:
        return {
          message: data?.message || 'Recurso não encontrado.',
          status,
          code: 'NOT_FOUND'
        };
      
      case 422:
        // Handle validation errors with specific field messages
        if (data?.errors) {
          const errorMessages = Object.values(data.errors).flat() as string[];
          return {
            message: errorMessages[0] || 'Dados inválidos. Verifique as informações fornecidas.',
            status,
            code: 'VALIDATION_ERROR'
          };
        }
        return {
          message: data?.message || 'Dados inválidos. Verifique as informações fornecidas.',
          status,
          code: 'VALIDATION_ERROR'
        };
      
      case 429:
        return {
          message: 'Muitas requisições. Tente novamente em alguns instantes.',
          status,
          code: 'RATE_LIMITED'
        };
      
      case 500:
        return {
          message: 'Erro interno do servidor. Tente novamente mais tarde.',
          status,
          code: 'SERVER_ERROR'
        };
      
      default:
        return {
          message: data?.message || 'Erro inesperado. Tente novamente.',
          status,
          code: 'UNKNOWN_ERROR'
        };
    }
  }
  
  // Handle network errors
  if (error.request) {
    return {
      message: 'Erro de conexão. Verifique sua conexão com a internet.',
      code: 'NETWORK_ERROR'
    };
  }
  
  // Handle other errors
  return {
    message: error.message || 'Erro inesperado. Tente novamente.',
    code: 'UNKNOWN_ERROR'
  };
};

/**
 * Check if an error is a specific HTTP status
 */
export const isHttpError = (error: any, status: number): boolean => {
  return error.response?.status === status;
};

/**
 * Check if an error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

/**
 * Check if an error is an authentication error (401 or 403)
 */
export const isAuthError = (error: any): boolean => {
  return isHttpError(error, 401) || isHttpError(error, 403);
}; 