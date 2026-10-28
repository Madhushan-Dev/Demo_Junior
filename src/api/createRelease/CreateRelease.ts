import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface CreateReleaseRequest {
  name: string;
  releaseDate: string;
  releaseType_name: string;
  project_id: number;
  status?: string;
  description?: string;
  version?: string;
}

export interface CreateReleaseResponse {
  status: string;
  message: string;
  data: CreateReleaseRequest[];
  statusCode: number;
}

export const createRelease = async (
  payload: CreateReleaseRequest,
): Promise<CreateReleaseResponse> => {
  const response = await apiClient.post(ENDPOINTS.release, payload);

  return response.data.data;


};
