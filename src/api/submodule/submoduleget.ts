import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface Submodule {
  id: number;
  name: string;
  submoduleName?: string;
  subModuleName?: string;
  getSubModuleName?: string;
}

export interface GetSubmodulesResponse {
  status: string;
  message: string;
  data: Submodule[];
  statusCode: number;
}

export const getSubmodulesByModule = async (
  moduleId: number,
): Promise<GetSubmodulesResponse> => {
  const response = await apiClient.get(ENDPOINTS.subModule(moduleId));
  return response.data;
};

export const getSubmodulesByModuleId = async (
  moduleId: number,
): Promise<GetSubmodulesResponse> => {
  const response = await apiClient.get(ENDPOINTS.subModule(moduleId));
  return response.data;
};

export default getSubmodulesByModule;
