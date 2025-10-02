import { apiClient } from '../../services/apiClient';

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

// Get user's portfolio
export const getPortfolio = async (token: string): Promise<PortfolioResponse> => {
  const response = await apiClient.get('/portfolio', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return response.data.data;
};

// Update portfolio profile
export const updatePortfolioProfile = async (
  token: string, 
  data: FormData
): Promise<Portfolio> => {
  
  
  const response = await apiClient.post('/portfolio/profile', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for FormData - let the browser set it with boundary
    }
  });
  
  return response.data.data;
};

// Test update endpoint
export const testUpdate = async (
  token: string, 
  data: FormData
): Promise<any> => {
  console.log('Testing update:', { data });
  
  const response = await apiClient.post('/portfolio/test-update', data, {
    headers: { 
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for FormData - let the browser set it with boundary
    }
  });
  return response.data;
};

// Test upload endpoint
export const testUpload = async (
  token: string, 
  files: File[]
): Promise<any> => {
  console.log('Testing upload:', { filesCount: files.length, files });
  
  if (files.length === 0) {
    throw new Error('No files provided for upload');
  }

  const formData = new FormData();
  files.forEach((file, index) => {
    console.log(`Adding file ${index}:`, { name: file.name, type: file.type, size: file.size });
    formData.append('files[]', file);
  });

  console.log('FormData entries:');
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const response = await apiClient.post('/portfolio/test-upload', formData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for FormData - let the browser set it with boundary
    }
  });
  return response.data;
};

// Upload portfolio media
export const uploadPortfolioMedia = async (
  token: string, 
  files: File[]
): Promise<{ items: PortfolioItem[]; total_items: number }> => {
  console.log('Uploading portfolio media:', { filesCount: files.length, files });
  
  if (files.length === 0) {
    throw new Error('No files provided for upload');
  }

  const formData = new FormData();
  files.forEach((file, index) => {
    console.log(`Adding file ${index}:`, { name: file.name, type: file.type, size: file.size });
    formData.append('files[]', file);
  });

  console.log('FormData entries:');
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const response = await apiClient.post('/portfolio/media', formData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for FormData - let the browser set it with boundary
    }
  });
  return response.data.data;
};

// Update portfolio item
export const updatePortfolioItem = async (
  token: string,
  itemId: number,
  data: {
    title?: string;
    description?: string;
    order?: number;
  }
): Promise<PortfolioItem> => {
  const response = await apiClient.put(`/portfolio/items/${itemId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
};

// Delete portfolio item
export const deletePortfolioItem = async (
  token: string,
  itemId: number
): Promise<void> => {
  await apiClient.delete(`/portfolio/items/${itemId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Reorder portfolio items
export const reorderPortfolioItems = async (
  token: string,
  data: ReorderRequest
): Promise<void> => {
  await apiClient.post('/portfolio/reorder', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Get portfolio statistics
export const getPortfolioStats = async (token: string): Promise<PortfolioStats> => {
  const response = await apiClient.get('/portfolio/statistics', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
}; 