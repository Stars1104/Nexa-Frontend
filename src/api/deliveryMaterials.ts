import { apiClient } from '../services/apiClient';

export interface DeliveryMaterial {
  id: number;
  contract_id: number;
  creator_id: number;
  brand_id: number;
  milestone_id?: number;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  media_type: 'image' | 'video' | 'document' | 'other';
  title?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  rejection_reason?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
  
  // Computed properties
  file_url?: string;
  thumbnail_url?: string;
  formatted_file_size?: string;
  status_color?: string;
  status_icon?: string;
  media_type_icon?: string;
  
  // Relationships
  creator?: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  brand?: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  milestone?: {
    id: number;
    title: string;
    milestone_type: string;
  };
  contract?: {
    id: number;
    title: string;
  };
}

export interface DeliveryMaterialStatistics {
  total_materials: number;
  pending_materials: number;
  approved_materials: number;
  rejected_materials: number;
  by_media_type: {
    images: number;
    videos: number;
    documents: number;
    other: number;
  };
}

export interface SubmitDeliveryMaterialRequest {
  contract_id: number;
  milestone_id?: number;
  file: File;
  title?: string;
  description?: string;
}

export interface ApproveDeliveryMaterialRequest {
  comment?: string;
}

export interface RejectDeliveryMaterialRequest {
  rejection_reason: string;
  comment?: string;
}

class DeliveryMaterialsApi {
  /**
   * Get delivery materials for a contract
   */
  async getDeliveryMaterials(contractId: number): Promise<DeliveryMaterial[]> {
    const response = await apiClient.get('/delivery-materials', {
      params: { contract_id: contractId }
    });
    return response.data.data;
  }

  /**
   * Submit a new delivery material
   */
  async submitDeliveryMaterial(data: SubmitDeliveryMaterialRequest): Promise<DeliveryMaterial> {
    const formData = new FormData();
    formData.append('contract_id', data.contract_id.toString());
    if (data.milestone_id) {
      formData.append('milestone_id', data.milestone_id.toString());
    }
    formData.append('file', data.file);
    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiClient.post('/delivery-materials', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  /**
   * Approve a delivery material
   */
  async approveDeliveryMaterial(materialId: number, data: ApproveDeliveryMaterialRequest): Promise<DeliveryMaterial> {
    const response = await apiClient.post(`/delivery-materials/${materialId}/approve`, data);
    return response.data.data;
  }

  /**
   * Reject a delivery material
   */
  async rejectDeliveryMaterial(materialId: number, data: RejectDeliveryMaterialRequest): Promise<DeliveryMaterial> {
    const response = await apiClient.post(`/delivery-materials/${materialId}/reject`, data);
    return response.data.data;
  }

  /**
   * Download a delivery material file
   */
  async downloadDeliveryMaterial(materialId: number): Promise<Blob> {
    const response = await apiClient.get(`/delivery-materials/${materialId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get delivery material statistics for a contract
   */
  async getStatistics(contractId: number): Promise<DeliveryMaterialStatistics> {
    const response = await apiClient.get('/delivery-materials/statistics', {
      params: { contract_id: contractId }
    });
    return response.data.data;
  }
}

export const deliveryMaterialsApi = new DeliveryMaterialsApi(); 