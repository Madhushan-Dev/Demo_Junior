import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface Module {
  moduleId: number;
  moduleName: string;
  projectId: number;
  projectName?: string;
}

export interface CreateModuleRequest {
  moduleName: string;
  projectId: number;
}

export interface ModuleResponse {
  statusCode: number;
  statusMessage: string;
  data: Module[];
}

export const getModulesByProjectId = async (
  projectId: number,
): Promise<ModuleResponse> => {


  const response = await apiClient.get(ENDPOINTS.module(projectId));

  return response.data;
};

export const createModule = async (
  data: CreateModuleRequest,
): Promise<ModuleResponse> => {

const response = await apiClient.post(ENDPOINTS.module(data.projectId), {
    moduleName: data.moduleName,
    projectId: data.projectId,
  });

  return response.data;
};

export const updateModule = async (
  moduleId: number,
  data: CreateModuleRequest,
): Promise<ModuleResponse> => {
  const response = await apiClient.put(ENDPOINTS.updateModule(moduleId), {
    moduleName: data.moduleName,
    projectId: data.projectId,
  });

  return response.data;
};

export const deleteModule = async (moduleId: number) => {
  return apiClient.delete(ENDPOINTS.deleteModule(moduleId));
};
