import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface Comment {
  id: number;
  comment: string;
  userId: number | string;
  defectId: number | string;
  attachment?: string | null;
  createdAt: string;
}

export interface GetCommentsResponse {
  message: string;
  data: Comment[];
  status?: string;
  statusCode?: number;
}

export const getCommentsByDefectId = async (
  defectId: number | string,
): Promise<GetCommentsResponse> => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.defectComment(Number(defectId)),
    );

    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
