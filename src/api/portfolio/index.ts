import { apiClient, uploadClient } from '../../services/apiClient';

export interface Portfolio {
  id: number;
  user_id: number;
  title: string | null;
  bio: string | null;
  profile_picture: string | null;
  profile_picture_url?: string;
  project_links?: ({title: string; url: string} | string)[] | null;
  created_at: string;
  updated_at: string;
  items?: PortfolioItem[];
}

export interface PortfolioItem {
  id: number;
  portfolio_id: number;
  file_path: string;
  file_name: string;
  file_type: string;
  media_type: 'image' | 'video';
  file_size: number;
  title: string | null;
  description: string | null;
  order: number;
  file_url?: string;
  thumbnail_url?: string;
  formatted_file_size?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioStats {
  total_items: number;
  images_count: number;
  videos_count: number;
  is_complete: boolean;
  has_minimum_items: boolean;
  profile_complete: boolean;
}

export interface PortfolioResponse {
  portfolio: Portfolio;
  items_count: number;
  images_count: number;
  videos_count: number;
  is_complete: boolean;
}

export interface ReorderRequest {
  item_orders: Array<{
    id: number;
    order: number;
  }>;
}


export const getPortfolio = async (token: string): Promise<PortfolioResponse> => {
  const response = await apiClient.get('/portfolio', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(response.data.data)
  return response.data.data;
};


export const updatePortfolioProfile = async (
  token: string, 
  data: FormData
): Promise<Portfolio> => {
  
  
  const response = await uploadClient.post('/portfolio/profile', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      
    }
  });
  
  return response.data.data;
};


export const testUpdate = async (
  token: string, 
  data: FormData
): Promise<any> => {
  
  const response = await apiClient.post('/portfolio/test-update', data, {
    headers: { 
      Authorization: `Bearer ${token}`,
      
    }
  });
  return response.data;
};


export const testUpload = async (
  token: string, 
  files: File[]
): Promise<any> => {  
  if (files.length === 0) {
    throw new Error('No files provided for upload');
  }

  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append('files[]', file);
  });

  for (let [key, value] of formData.entries()) {
  }

  const response = await uploadClient.post('/portfolio/test-upload', formData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      
    }
  });
  return response.data;
};


export const uploadPortfolioMedia = async (
  token: string, 
  files: File[],
  onUploadProgress?: (progress: number) => void
): Promise<{ items: PortfolioItem[]; total_items: number }> => {
  
  if (files.length === 0) {
    throw new Error('No files provided for upload');
  }

  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append('files[]', file);
  });

  for (let [key, value] of formData.entries()) {
  }

  
  const response = await uploadClient.post('/portfolio/media', formData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onUploadProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(progress);
      }
    }
  });
  return response.data.data;
};


export const updatePortfolioItem = async (
  token: string,
  itemId: number,
  data: {
    title?: string;
    description?: string;
    order?: number;
  }
): Promise<PortfolioItem> => {
  console.log("This is axios",data);
  const response = await apiClient.put(`/portfolio/items/${itemId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
};


export const deletePortfolioItem = async (
  token: string,
  itemId: number
): Promise<{ success: boolean; message?: string }> => {
  const response = await apiClient.delete(`/portfolio/items/${itemId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};


export const reorderPortfolioItems = async (
  token: string,
  data: ReorderRequest
): Promise<void> => {
  await apiClient.post('/portfolio/reorder', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};


export const getPortfolioStats = async (token: string): Promise<PortfolioStats> => {
  const response = await apiClient.get('/portfolio/statistics', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
}; 