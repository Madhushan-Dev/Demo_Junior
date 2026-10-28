
import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";



export interface getProjectAllocationHistoryResponse {
  status: string;
  message: string;
  data: any[];
  statusCode: number;
}

export const getProjectAllocationHistory = async (
  id: number,
): Promise<getProjectAllocationHistoryResponse> => {
  const response = await apiClient.get(
    ENDPOINTS.projectAllocationProjectEmployeeHistory(id),
  );
  return response.data.data;
};

export const getProjectAllocationHistoryByRole = async (
  projectId: number,
  roleId?: string,
): Promise<getProjectAllocationHistoryResponse> => {
  const response = await apiClient.get(
    ENDPOINTS.projectAllocationProjectEmployeeHistory(projectId)
  );
  return response.data.data;
};

