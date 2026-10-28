import apiClient from "../apiClient";
import ENDPOINTS from "../../utils/endpoints";

export interface ReleaseView {
  releaseId: number;
  releaseName: string;
  releaseVersion: string;
  releaseDate: string;
}

export interface ReleaseViewResponse {
  data: ReleaseView[];
  statusCode: number;
  statusMessage: string;
}

export const getAllReleaseView = async (): Promise<ReleaseViewResponse> => {
  const response = await apiClient.get(ENDPOINTS.releaseView);

  return response.data;
};

export const projectReleaseCardView = async (
  projectId: string | number,
) => {
  const response = await apiClient.get(
    ENDPOINTS.releaseByProject(Number(projectId)),
  );

  return response.data;
};
