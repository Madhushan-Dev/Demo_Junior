import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface ActiveRelease {
  id: string;
  releaseId: string;
  name: string;
  description: string;
  status: string;
  releaseDate: string;
  releaseType_id: string;
  project_id: number;
}

export interface ActiveReleasesResponse {
  message: string;
  data: ActiveRelease[];
  status: string;
  statusCode: string;
}

export const getActiveReleases = async (
  projectId: string | number,
): Promise<ActiveReleasesResponse> => {
  const response = await apiClient.get(
    ENDPOINTS.releaseViewByProject(Number(projectId)),
  );

  return response.data;
};

export interface CreateReleaseViewRequest {
  releaseName: string;
  releaseVersion: string;
  releaseDate: string;
}

export const createReleaseView = async (payload: CreateReleaseViewRequest) => {
  const response = await apiClient.post(ENDPOINTS.releaseViewCreate, payload);

  return response.data;
};
