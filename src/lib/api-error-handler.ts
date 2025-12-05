

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  retry_after?: number;
}


export const handleApiError = (error: any): ApiError => {
  console.error('API Error:', error);

  
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
        
        const retryAfter = data?.retry_after || 60;
        let message = 'Muitas requisições. Tente novamente em alguns instantes.';
        
        
        if (error.config?.url?.includes('/login') || error.config?.url?.includes('/register')) {
          if (error.config?.url?.includes('/register')) {
            message = `Muitas tentativas de registro. Tente novamente em ${Math.ceil(retryAfter / 60)} minuto(s).`;
          } else {
            message = `Muitas tentativas de login. Tente novamente em ${Math.ceil(retryAfter / 60)} minuto(s).`;
          }
        }
        
        
        if (error.config?.url?.includes('/notifications')) {
          message = `Muitas requisições de notificações. Tente novamente em ${Math.ceil(retryAfter / 60)} minuto(s).`;
        }
        
        
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
  
  
  if (error.request) {
    return {
      message: 'Erro de conexão. Verifique sua conexão com a internet.',
      code: 'NETWORK_ERROR'
    };
  }
  
  
  return {
    message: error.message || 'Erro inesperado. Tente novamente.',
    code: 'UNKNOWN_ERROR'
  };
};


export const isHttpError = (error: any, status: number): boolean => {
  return error.response?.status === status;
};


export const isRateLimitError = (error: any): boolean => {
  return error.response?.status === 429;
};


export const getRetryAfterTime = (error: any): number => {
  if (isRateLimitError(error)) {
    return error.response?.data?.retry_after || 60;
  }
  return 0;
};


export const isAuthError = (error: any): boolean => {
  return isHttpError(error, 401) || isHttpError(error, 403);
}; 