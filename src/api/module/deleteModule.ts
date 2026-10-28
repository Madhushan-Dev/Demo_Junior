import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export const deleteModule = async (projectId: number,  moduleId: number) => {
  const response = await apiClient.delete(ENDPOINTS.deleteModule(projectId, moduleId));

  return response.data;
};
