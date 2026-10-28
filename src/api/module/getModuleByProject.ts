import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface Modules {
  id: number;

  name: string;
  projectId: number;
  submodules?: Submodule[];
  assignedDevs?: string[];
}

export interface ModulesRequst {
  moduleId: string;
  name: string;
  projectId: number;
  submodules?: Submodule[];
  assignedDevs?: string[];
}

export interface Submodule {
  id: number;
  subModuleId: string;
  getSubModuleName: string;
  moduleId: number;
  assignedDevs?: string[];
  name?: string;
  submoduleName?: string;
}

export interface CreateReleaseResponse {
  status: string;
  message: string;
  data: Modules[];
  statusCode: number;
}

export const getModulesByProject = async (
  projectId: number,
): Promise<CreateReleaseResponse> => {
  const response = await apiClient.get(ENDPOINTS.module(projectId));
  return response.data;
};
