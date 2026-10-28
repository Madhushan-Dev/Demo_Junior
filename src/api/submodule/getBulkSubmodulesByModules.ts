import apiClient from "../../lib/api";
export interface BulkSubmodule {
  subModuleId: number;
  subModuleName: string;
  moduleId: number;
  moduleName: string;
}

export interface GetBulkSubmodulesResponse {
  status?: string;
  message?: string;
  data?: BulkSubmodule[];
  statusCode?: number;
}

export const getBulkSubmodulesByModules = async (
  projectId: string | number,
  moduleIds: number[] | string,
): Promise<BulkSubmodule[]> => {
  try {
    const moduleIdsParam = Array.isArray(moduleIds)
      ? moduleIds.join(",")
      : moduleIds;
const response = await apiClient.get<
      BulkSubmodule[] | GetBulkSubmodulesResponse
    >(`subModule/bulk-by-modules`, {
      params: {
        projectId: String(projectId),
        moduleIds: moduleIdsParam,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && "data" in response.data) {
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
return [];
      }
    } else if (
      response.data &&
      "status" in response.data &&
      response.data.status === "success"
    ) {
      return [];
    } else {
return [];
    }
  } catch (error) {
throw error;
  }
};
