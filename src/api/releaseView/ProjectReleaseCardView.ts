import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface ProjectRelease {
  releaseId: number;
  releaseName: string;
  releaseVersion: string;
  releaseDate: string;
  status: string;
  releaseTypeId?: number;
  projectId?: number;
}

export interface ReleaseTestCaseCount {
  releaseId: number;
  testCaseCount: number;
}

export const projectReleaseCardView = async (
  projectId: string | number,
) => {
  const response = await apiClient.get(
    ENDPOINTS.releaseViewByProject(Number(projectId)),
  );

  return response.data;
};

export const getReleaseTestCaseCountsLoad = async (
  releaseIds: number[],
): Promise<ReleaseTestCaseCount[]> => {

  const responses = await Promise.all(
    releaseIds.map(async (releaseId) => {
      const response = await apiClient.get(
        ENDPOINTS.releaseTestCaseCount(releaseId),
      );

      return response.data?.data ?? response.data;
    }),
  );

  return responses;
};