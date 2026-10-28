import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface UserByAllocation {
  userId: number;
  userName: string;
  userRole?: string;
  userWithRole: string;
  allocateModuleId?: number;
  allocationId?: number;
  moduleName?: string;
  projectName?: string;
  moduleId?: number;
  projectId?: number;
  subModuleId?: number;
}

export const getUsersByAllocation = async (
  projectId: number,
  moduleId: number,
): Promise<UserByAllocation[]> => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.GET_MODULE_ALLOCATED_LEADER(moduleId),
    );

    const allocatedLeaders = response.data?.data || response.data || [];
    if (!Array.isArray(allocatedLeaders)) return [];

    return allocatedLeaders.map((dev: any) => ({
      allocationId: dev.id,                                // backend "id"
      userId: dev.employeeId,                              // backend "employeeId"
      userName: `${dev.firstName} ${dev.lastName}`,        // combine names
      userWithRole: dev.isLeader
        ? `${dev.firstName} ${dev.lastName} (Leader)`
        : `${dev.firstName} ${dev.lastName}`,
      userRole: dev.isLeader ? "Leader" : "Developer",     // role handling
      moduleId: dev.moduleId,
      projectId: projectId,
    }));
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 204) {
      return [];
    }
    throw error;
  }
};


// export const getUsersByAllocation = async (
//   projectId: number,
//   moduleId: number,
// ): Promise<UserByAllocation[]> => {
//   try {
//     const response = await apiClient.get(
//       ENDPOINTS.GET_MODULE_ALLOCATED_LEADER(moduleId),
//     );

//     const allocatedUsers = response.data?.data || response.data || [];
//     if (!Array.isArray(allocatedUsers)) return [];

//     return allocatedUsers.map((dev: any) => ({
//       allocationId: dev.id,                                // backend "id"
//       userId: dev.employeeId,                              // backend "employeeId"
//       userName: `${dev.firstName} ${dev.lastName}`,        // combine names
//       userWithRole: dev.isLeader
//         ? `${dev.firstName} ${dev.lastName} (Leader)`
//         : `${dev.firstName} ${dev.lastName}`,
//       userRole: dev.isLeader ? "Leader" : "Developer",     // role handling
//       moduleId: dev.moduleId,
//       projectId: projectId,
//     }));
//   } catch (error: any) {
//     if (error.response?.status === 404 || error.response?.status === 204) {
//       return [];
//     }
//     throw error;
//   }
// };


// export const getUsersByAllocation = async (
//   projectId: number,
//   moduleId: number,
// ): Promise<UserByAllocation[]> => {
//   try {
//     const response = await apiClient.get(
//       ENDPOINTS.GET_MODULE_ALLOCATED_LEADER(moduleId),
//     );

//     if (!response.data || Object.keys(response.data).length === 0) {
//       return [];
//     }
//     const leader = response.data;
//     return [
//       {
//         allocateModuleId: leader.allocateModuleId,
//         moduleId: leader.moduleId,
//         userId: leader.userId,
//         userName: leader.userName || `User ${leader.userId}`,
//         userWithRole: leader.userName || `User ${leader.userId}`,
//         projectId: projectId,
//       },
//     ];
//   } catch (error: any) {
//     if (error.response?.status === 404 || error.response?.status === 204) {
//       return [];
//     }

//     throw error;
//   }
// };


//     const leader = response.data;
//     return [
//       {
//         allocateModuleId: leader.id,                 // backend "id"
//         moduleId: leader.moduleId,                   // backend "moduleId"
//         userId: leader.employeeId,                   // backend "employeeId"
//         userName: `${leader.firstName} ${leader.lastName}`, // combine names
//         userWithRole: leader.isLeader
//           ? `${leader.firstName} ${leader.lastName} (Leader)`
//           : `${leader.firstName} ${leader.lastName}`,
//         projectId: projectId,
//       },
//     ];
//   } catch (error: any) {
//     if (error.response?.status === 404 || error.response?.status === 204) {
//       return [];
//     }
//     throw error;
//   }
// };



export const getUsersBySubmoduleAllocation = async (
  projectId: number,
  moduleId: number,
  subModuleId: number,
): Promise<UserByAllocation[]> => {
  try {
    const response = await apiClient.get(ENDPOINTS.subModuleDev(moduleId, subModuleId));
    const allocatedDevs = response.data?.data || response.data || [];
    if (!Array.isArray(allocatedDevs)) return [];
    return allocatedDevs.map((dev: any) => ({
      allocationId: dev.id,
      userId: dev.assignToId || dev.employeeId,
      userName: dev.employeeName || `Employee ${dev.assignToId}`,
      userWithRole: dev.employeeName || `Employee ${dev.assignToId}`,
      userRole: dev.role || "Developer",
      moduleId: moduleId,
      projectId: projectId,
      subModuleId: subModuleId,
    }));
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
};

export async function getUsersByModuleSubmoduleAllocation(projectId: number) {
  const response = await apiClient.get(
    ENDPOINTS.projectAllocationProjectEmployee(projectId),
  );

  return {
    status: "success",
    message: "Developers retrieved successfully",
    data: response.data || [],
    statusCode: 200,
  };
}