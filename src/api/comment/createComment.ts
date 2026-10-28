import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface CreateCommentRequest {
  userId: string | number;
  defectId: string | number;
  comment: string;
  attachment?: string | null;
}

export interface CreateCommentResponse {
  message: string;
  data?: any;
  status?: string;
  statusCode?: number;
}
export const createComment = async (
  payload: CreateCommentRequest,
): Promise<CreateCommentResponse> => {
  try {
    const response = await apiClient.post(
      ENDPOINTS.defectComment(Number(payload.defectId)),
      { comment: payload.comment,  userId: payload.userId ,attachment: payload.attachment },
    );

    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const updateComment = async (commentId: number, comment: string, defectId:number) => {

    const response = await apiClient.put(
      `/defect/${defectId}/comment/${commentId}`,
      {
        comment: comment,
      },
    );
    return response.data;
  
};
