import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface DefectDensityData {
  kloc: number;
  totalDefects: number;
  defectDensity: number;
}

export interface DefectDensityResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: DefectDensityData;
}

export interface KlocResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: {
    kloc: number;
  };
}

export const getKILOC = async (projectId: number): Promise<KlocResponse> => {
  const response = await apiClient.get(ENDPOINTS.projectKloc(projectId));
  return response.data;
};

export const getDefectDensity = async (
  projectId: number,
): Promise<DefectDensityResponse> => {
  const response = await apiClient.get(ENDPOINTS.defectDensity(projectId));
  return response.data;
};
