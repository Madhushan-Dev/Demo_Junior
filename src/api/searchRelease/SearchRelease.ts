import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export const getReleasesByProjectId = async (projectId: string | number) => {
  const response = await apiClient.get(
    `${ENDPOINTS.release}/project/${projectId}`,
  );
  return response.data;
};

export async function searchReleases(params: any) {
  const response = await apiClient.get(ENDPOINTS.releaseById(params));

  return response.data;
}
