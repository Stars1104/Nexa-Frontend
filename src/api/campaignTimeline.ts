import { apiClient } from '../services/apiClient';
import { DeliveryMaterial } from './deliveryMaterials';

export interface CampaignMilestone {
  id: number;
  contract_id: number;
  milestone_type: 'script_submission' | 'script_approval' | 'video_submission' | 'final_approval';
  title: string;
  description?: string;
  deadline: string;
  completed_at?: string;
  status: 'pending' | 'approved' | 'delayed' | 'completed';
  comment?: string;
  file_path?: string;
  
  file_name?: string;
  file_size?: string;
  file_type?: string;
  justification?: string;
  is_delayed: boolean;
  delay_notified_at?: string;
  extension_days: number;
  extension_reason?: string;
  extended_at?: string;
  extended_by?: number;
  created_at: string;
  updated_at: string;
  formatted_deadline?: string;
  formatted_completed_at?: string;
  formatted_file_size?: string;
  status_icon?: string;
  milestone_icon?: string;
  status_color?: string;
  days_until_deadline?: number;
  days_overdue?: number;
  is_overdue?: boolean;
  can_be_completed?: boolean;
  can_be_approved?: boolean;
  can_upload_file?: boolean;
  can_request_approval?: boolean;
  can_justify_delay?: boolean;
  can_be_extended?: boolean;
  is_extended?: boolean;
  total_extension_days?: number;
  
  // Materials loaded with the milestone
  deliveryMaterials?: DeliveryMaterial[];
}

export interface TimelineStatistics {
  total_milestones: number;
  completed_milestones: number;
  pending_milestones: number;
  approved_milestones: number;
  delayed_milestones: number;
  overdue_milestones: number;
  progress_percentage: number;
}

export interface FileUploadResponse {
  success: boolean;
  data: CampaignMilestone;
  message: string;
}

export interface DownloadFileResponse {
  success: boolean;
  data: {
    download_url: string;
    file_name: string;
    file_size: string;
    file_type: string;
  };
}

class CampaignTimelineApi {
  /**
   * Get timeline for a contract
   */
  async getTimeline(contractId: number): Promise<CampaignMilestone[]> {
    const response = await apiClient.get('/campaign-timeline', {
      params: { contract_id: contractId }
    });
    return response.data.data;
  }

  /**
   * Create timeline milestones for a contract
   */
  async createMilestones(contractId: number): Promise<CampaignMilestone[]> {
    const response = await apiClient.post('/campaign-timeline/create-milestones', {
      contract_id: contractId
    });
    return response.data.data;
  }

  /**
   * Upload file for a milestone
   */
  async uploadFile(milestoneId: number, file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('milestone_id', milestoneId.toString());
    formData.append('file', file);

    const response = await apiClient.post('/campaign-timeline/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Approve a milestone
   */
  async approveMilestone(milestoneId: number, comment?: string): Promise<CampaignMilestone> {
    const response = await apiClient.post('/campaign-timeline/approve-milestone', {
      milestone_id: milestoneId,
      comment
    });
    return response.data.data;
  }

  /**
   * Reject a milestone
   */
  async rejectMilestone(milestoneId: number, comment?: string): Promise<CampaignMilestone> {
    const response = await apiClient.post('/campaign-timeline/reject-milestone', {
      milestone_id: milestoneId,
      comment
    });
    return response.data.data;
  }

  /**
   * Complete a milestone
   */
  async completeMilestone(milestoneId: number): Promise<CampaignMilestone> {
    const response = await apiClient.post('/campaign-timeline/complete-milestone', {
      milestone_id: milestoneId
    });
    return response.data.data;
  }

  /**
   * Justify delay for a milestone
   */
  async justifyDelay(milestoneId: number, justification: string): Promise<CampaignMilestone> {
    const response = await apiClient.post('/campaign-timeline/justify-delay', {
      milestone_id: milestoneId,
      justification
    });
    return response.data.data;
  }

  /**
   * Mark milestone as delayed
   */
  async markAsDelayed(milestoneId: number, justification?: string): Promise<CampaignMilestone> {
    const response = await apiClient.post('/campaign-timeline/mark-delayed', {
      milestone_id: milestoneId,
      justification
    });
    return response.data.data;
  }

  /**
   * Extend timeline deadline
   */
  async extendTimeline(milestoneId: number, extensionDays: number, extensionReason: string): Promise<CampaignMilestone> {
    const response = await apiClient.post('/campaign-timeline/extend-timeline', {
      milestone_id: milestoneId,
      extension_days: extensionDays,
      extension_reason: extensionReason
    });
    return response.data.data;
  }

  /**
   * Download file for a milestone
   */
  async downloadFile(milestoneId: number): Promise<DownloadFileResponse> {
    const response = await apiClient.get('/campaign-timeline/download-file', {
      params: { milestone_id: milestoneId }
    });
    return response.data;
  }

  /**
   * Get timeline statistics
   */
  async getStatistics(contractId: number): Promise<TimelineStatistics> {
    const response = await apiClient.get('/campaign-timeline/statistics', {
      params: { contract_id: contractId }
    });
    return response.data.data;
  }
}

export const campaignTimelineApi = new CampaignTimelineApi(); 