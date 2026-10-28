import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

let BASE_URL = import.meta.env.VITE_BASE_URL || "/api/v1/";

if (BASE_URL && !BASE_URL.endsWith("/")) {
  BASE_URL = BASE_URL + "/";
}

export const getDevelopersByModuleId = async (
  projectId: number,
  moduleId: number,
) => {
try {
    const response = await apiClient.get(ENDPOINTS.moduleEmployee(moduleId));
    const assigned = response.data || [];

    return assigned.map((item: any) => ({
      userId: item.employeeId,
      userName: `${item.firstName} ${item.lastName}`.trim(),
      subModuleId: null,
      isLeader: item.isLeader,
    }));
  } catch (error: any) {
    if (error.response?.status === 404) return [];
    throw error;
  }
};

export const getDevelopersBySubmoduleId = async (
  projectId: number,
  moduleId: number,
  submoduleId: number
) => {
  const response = await apiClient.get(
    ENDPOINTS.subModuleDev(projectId, moduleId, submoduleId)
  );

  return response.data?.data || [];
};
