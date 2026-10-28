import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export const getSubmodulesByModule = async (moduleId: number) => {
  try {
    const response = await apiClient.get(ENDPOINTS.subModule(moduleId));

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSubmodulesByModuleId = getSubmodulesByModule;

export default getSubmodulesByModule;
