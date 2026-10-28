import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const deallocateModuleLeader = async (
  allocateModuleId: number,
 employeeId: number,
) => {
  const response = await apiClient.delete(
    ENDPOINTS.DEALLOCATE_MODULE_LEADER(allocateModuleId,employeeId),
  );
  return response.data;
};


// export const deallocateDeveloperFromModule = async (
//   projectId: number,
//   moduleId: number,
//   userId: number,
// ) => {
//   try {
//     const response = await apiClient.delete(
//       `${BASE_URL}allocateModule/deallocate-module-leader`,
//       {
//         data: {
//           projectId,
//           moduleId,
//           userId,
//         },
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//         withCredentials: false,
//       },
//     );
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

export const deallocateDeveloperFromModule = async (
  projectId: number,
  moduleId: number,
  employeeId: number
) => {
  try {
    const response = await apiClient.delete(`module/${moduleId}/employee/${employeeId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: false,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Deallocate developer from module error:", error);
    throw error;
  }
};

export const deallocateSubmoduleDeveloperWithAllocateModuleId = async (
  allocateModuleId: number,
) => {
  try {
    const response = await apiClient.delete(
      `${BASE_URL}allocateModule/allocate-submodule/${allocateModuleId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: false,
        timeout: 1000000,
      },
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error(
        `Access denied. You may not have permission to deallocate this submodule developer. (allocateModuleId: ${allocateModuleId})`,
      );
    } else if (error.response?.status === 404) {
      throw new Error(
        `Submodule allocation not found. The allocation may have been removed. (allocateModuleId: ${allocateModuleId})`,
      );
    } else if (error.response?.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    } else {
      throw new Error(
        `Failed to deallocate submodule developer: ${error.response?.data?.message || error.message}`,
      );
    }
  }
};

export const deallocateDeveloperFromSubmodule = async (
  projectId: number,
  moduleId: number,
  submoduleId: number,
  userId: number,
) => {
  try {
    const response = await apiClient.delete(
      `${BASE_URL}allocateModule/deallocate-submodule-developer`,
      {
        data: {
          projectId,
          moduleId,
          submoduleId,
          userId,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: false,
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const reassignDeveloperWithAllocateModuleId = async (
  allocateModuleId: number,
  newUserId: number,
) => {
  try {
    const response = await apiClient.put(
      `${BASE_URL}allocateModule/${allocateModuleId}`,
      {
        userId: newUserId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: false,
        timeout: 1000000,
      },
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error(
        `Access denied. You may not have permission to reassign this developer. (allocateModuleId: ${allocateModuleId})`,
      );
    } else if (error.response?.status === 404) {
      throw new Error(
        `Allocation not found. The allocation may have been removed. (allocateModuleId: ${allocateModuleId})`,
      );
    } else if (error.response?.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    } else {
      throw new Error(
        `Failed to reassign developer: ${error.response?.data?.message || error.message}`,
      );
    }
  }
};

export const reassignSubmoduleDeveloperWithAllocateModuleId = async (
  allocationId: number,
  newUserId: number,
) => {
  try {
    const response = await apiClient.put(
      `${BASE_URL}allocateModule/allocate-submodule/${allocationId}`,
      {
        userId: newUserId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: false,
        timeout: 1000000,
      },
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error(
        `Access denied. You may not have permission to reassign this submodule developer. (allocationId: ${allocationId})`,
      );
    } else if (error.response?.status === 404) {
      throw new Error(
        `Submodule allocation not found. The allocation may have been removed. (allocationId: ${allocationId})`,
      );
    } else if (error.response?.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    } else {
      throw new Error(
        `Failed to reassign submodule developer: ${error.response?.data?.message || error.message}`,
      );
    }
  }
};

export const reassignDeveloperToModule = async (
  projectId: number,
  moduleId: number,
  oldUserId: number,   
  newUserId: number,
) => {
  try {
    const response = await apiClient.put(
      `${BASE_URL}allocateModule/reassign-module-leader`,
      {
        projectId,
        moduleId,
        oldUserId,
        newUserId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: false,
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const reassignDeveloperToSubmodule = async (
  projectId: number,
  moduleId: number,
  submoduleId: number,
  oldUserId: number,
  newUserId: number,
) => {
  try {
    const response = await apiClient.put(
      `${BASE_URL}allocateModule/reassign-submodule-developer`,
      {
        projectId,
        moduleId,
        submoduleId,
        oldUserId,
        newUserId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: false,
      },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
