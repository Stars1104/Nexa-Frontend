/**
 * Utility functions for handling API errors consistently across the application
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  retry_after?: number;
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
        // Enhanced rate limiting error handling
        const retryAfter = data?.retry_after || 60;
        let message = 'Muitas requisições. Tente novamente em alguns instantes.';
        
        // Check if it's an authentication-related rate limit
        if (error.config?.url?.includes('/login') || error.config?.url?.includes('/register')) {
          if (error.config?.url?.includes('/register')) {
            message = `Muitas tentativas de registro. Tente novamente em ${Math.ceil(retryAfter / 60)} minuto(s).`;
          } else {
            message = `Muitas tentativas de login. Tente novamente em ${Math.ceil(retryAfter / 60)} minuto(s).`;
          }
        }
        
        // Check for new user flow rate limiting
        if (data?.error_type === 'new_user_flow_rate_limited') {
          message = `Muitas tentativas de criação de conta. Tente novamente em ${Math.ceil(retryAfter / 60)} minuto(s).`;
        }
        
        return {
          message,
          status,
          code: 'RATE_LIMITED',
          retry_after: retryAfter
        };
      
      case 500:
        return {
          message: 'Erro interno do servidor. Tente novamente mais tarde.',
          status,
          code: 'SERVER_ERROR'
        };
      
      default:
        return {
          message: data?.message || `Erro inesperado (${status}). Tente novamente.`,
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
 * Check if an error is a rate limiting error
 */
export const isRateLimitError = (error: any): boolean => {
  return error.response?.status === 429;
};

/**
 * Get retry after time from rate limit error
 */
export const getRetryAfterTime = (error: any): number => {
  if (isRateLimitError(error)) {
    return error.response?.data?.retry_after || 60;
  }
  return 0;
};

/**
 * Check if an error is an authentication error (401 or 403)
 */
export const isAuthError = (error: any): boolean => {
  return isHttpError(error, 401) || isHttpError(error, 403);
}; 