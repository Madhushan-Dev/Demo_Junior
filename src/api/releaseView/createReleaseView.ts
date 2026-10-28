import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface ReleaseViewRequest {
  projectId: number;
  releaseName: string;
  releaseVersion: string;
  releaseDate: string;
  releaseTypeId: number;
}

export const createReleaseView = async (data: ReleaseViewRequest) => {
  const response = await apiClient.post(ENDPOINTS.releaseViewCreate, data);

  return response.data;
};
