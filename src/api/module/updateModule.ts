import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface UpdateModuleRequest {
  moduleName: string;
}

export const updateModule = async (
  projectId: number,
  moduleId: number,
  data: UpdateModuleRequest,
) => {
  const response = await apiClient.put(ENDPOINTS.updateModule(projectId,moduleId),data);
  return response.data;
};