import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export const getActiveRelease = async (projectId: string | number) => {
  const response = await apiClient.get(
    ENDPOINTS.releaseViewByProject(Number(projectId)),
  );

  return response.data;
};
