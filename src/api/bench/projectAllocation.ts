import ENDPOINTS from "../../utils/endpoints";
import apiClient from "../../lib/api";
import { formatDateTime } from "../../utils/formatDateTime";

export interface AvailablePeriod {
  period: string;
  percentage: number;
  project: string;
  empId: number;
}

export interface ViewAllocationsResponse {
  data: {
    availablePeriods: AvailablePeriod[];
  };
  message: string;
  status: string;
  statusCode: number;
}

export interface ProjectAllocationPayload {
  empId: number;
  projectId: number;
  roleId: number;
  availability: number;
  startDate: string;
  endDate: string;
}

export interface UpdateProjectAllocationPayload {
  empId: number;
  projectId: number;
  startDate: string;
  endDate: string;
  availability: number;
  roleId: number;
}

export async function postProjectAllocations(
  payload: ProjectAllocationPayload,
) {
  const response = await apiClient.post(ENDPOINTS.projectAllocation, {
    empId: payload.empId,
    projectId: payload.projectId,
    roleId: payload.roleId,
    availability: payload.availability,
    startDate: payload.startDate,
    endDate: payload.endDate,
  });

  return response.data;
}

export async function getProjectAllocationsById(projectId: string | number) {
  const response = await apiClient.get(
    ENDPOINTS.projectAllocationProjectEmployee(Number(projectId)),
  );
  return response.data.data;
}


// const getAllocationId = (emp: any) => {
//   const id = Number(emp.benchAllocationId ?? emp.allocationId ?? emp.id);
//   return Number.isFinite(id) && id > 0 ? String(id) : null;
// };
export async function updateProjectAllocation(
  id: string | number,
  payload: UpdateProjectAllocationPayload,
) {
  const response = await apiClient.put(
    ENDPOINTS.bench_allocation_update(Number(id)),
    {
      empId: payload.empId,
      projectId: payload.projectId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      availability: payload.availability,
      roleId: payload.roleId,
    },
  );

  return response.data.data;
}

export async function deleteProjectAllocation(id: string | number) {
  const allocationId = Number(id);

  if (!Number.isFinite(allocationId) || allocationId <= 0) {
    throw new Error("Invalid project allocation ID");
  }

  const response = await apiClient.patch(
    ENDPOINTS.projectAllocationDeallocate(allocationId),
    {},
  );

  return response.data.data;
}

export async function filterProjectAllocations(
  projectId: string | number,
  filters: any,
) {
  const params: any = {};
  if (filters.name) params.name = filters.name;
  if (filters.role) params.role = filters.role;
  if (filters.availability !== undefined && filters.availability !== null) {
    params.availability = filters.availability;
  }

  const requestParams = {
    ...params,
    projectId: Number(projectId),
  };
// ENDPOINTS.projectAllocationProjectEmployee(Number(projectId)),
//     { params },
  const response = await apiClient.get(
    ENDPOINTS.filterbench(Number(projectId)),
    { params: requestParams },
  );

  return response.data;
}

export async function getMaxAvailablePercentage(
  empId: string | number,
  startDate: string,
  endDate: string,
) {
  const response = await apiClient.get(
    ENDPOINTS.projectAllocationByEmployee(Number(empId)),
  );
  const allocations = response.data.data || [];

  let totalAllocated = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  allocations.forEach((alloc: any) => {
    const allocStart = new Date(alloc.startDate);
    const allocEnd = new Date(alloc.endDate);

    if (allocStart <= end && allocEnd >= start) {
      totalAllocated += alloc.allocationPercent;
    }
  });

  const maxAvailable = Math.max(0, 100 - totalAllocated);
  return { data: maxAvailable };
}

export async function getDevelopersWithRolesByProjectId(
  projectId: number | string | undefined,
) {
  if (!projectId) return [];
  const response = await apiClient.get(
    `/project/${projectId}/defect/developers`,
  );
  return response.data;
}

export async function allocateDeveloperToModule(
  moduleId: number,
  projectAllocationId: number,
) {
  const response = await apiClient.post(`/api/v1/module/${moduleId}/developer`, {
    projectAllocationId,
  });
  return response.data;
}

export async function allocateDeveloperToSubModule(
  moduleId: number,
  projectAllocationId: number,
  id: number,
) {
  const response = await apiClient.post(ENDPOINTS.subModuleDev(id), {
    moduleId,
    projectAllocationId,
  });
  return response.data;
}


export interface UserRole {
  roleId: number;
  roleName: string;
}

export async function getUserRoles(
  empId: number,
): Promise<UserRole[]> {
  const response = await apiClient.get(
    `/bench-allocation/employee/${empId}/roles`,
  );

  return response.data;
}
////////////////////////////////////////////////////////////////////hasan
// export async function getViewAllocations(
//   empId: string | number,
// ): Promise<ViewAllocationsResponse> {
//   const response = await apiClient.get(
//     ENDPOINTS.projectAllocationByEmployee(Number(empId)),
//   );

//   const responseData = response.data?.data ?? response.data;

//   const allocations = Array.isArray(responseData)
//     ? responseData
//     : responseData
//       ? [responseData]
//       : [];

// //   const availablePeriods = allocations.map((alloc: any) => ({
// //     period: `${formatDateTime(alloc.startDate)} to ${formatDateTime(alloc.endDate)}`,
// //     percentage: alloc.allocationPercent,
// //     roleId: alloc.roleId,
// //     roleName: alloc.roleName,
// //     project: alloc.projectName || "Unknown",
// //     empId: Number(empId),
// //   }));
//   const data = response.data?.data;
//   return {
//     data: {
//       availablePeriods: data
//         ? [
//             {
//               project: data.currentProjects || "No project allocated",
//               period: data.availablePeriod || "No available period",
//               percentage: data.availablePercentage ?? 0,
//               empId: Number(data.empId ?? empId),
//             },
//           ]
//         : [],
//     },
//     message: response.data?.statusMessage || "Success",
//     status: "success",
//     statusCode: response.data?.statusCode ?? 200,
//   };


// }
////////////////////////////////////////////////////hasan
export async function getViewAllocations(
  empId: string | number,
): Promise<any> {

  const response = await apiClient.get(
    ENDPOINTS.projectAllocationByEmployee(Number(empId)),
  );


  const data = response.data?.data ?? {};


  return {
    data: {

      currentProjects:
        data.currentProjects || "No Project",


      availablePeriod:
        data.availablePeriod || "Not Allocated",


      totalAllocatedPercentage:
        data.totalAllocatedPercentage ?? 0,


      availablePercentage:
        data.availablePercentage ?? 0,


      employeeName:
        data.employeeName,


      designationName:
        data.designationName,


      empId:
        data.empId ?? empId,

    },


    message:
      response.data?.statusMessage ||
      "Retrieved Successfully",


    status: "success",


    statusCode:
      response.data?.statusCode ?? 200,
  };
}
////////////////////////////////////////////////////hasan

// export async function getViewAllocations(
//   empId: string | number,
// ): Promise<any> {
//   const response = await apiClient.get(
//     ENDPOINTS.projectAllocationByEmployee(Number(empId)),
//   );

//   const data = response.data?.data || {};

//   return {
//     employeeName: data.employeeName,
//     designationName: data.designationName,
//     availablePercentage: data.availablePercentage,
//     totalAllocatedPercentage: data.totalAllocatedPercentage,
//     currentProjects: data.currentProjects,
//     roleType: data.roleType,
//   };
// }
// export async function getViewAllocations(
//   empId: string | number,
// ): Promise<ViewAllocationsResponse> {
//   const response = await apiClient.get(
//     ENDPOINTS.projectAllocationByEmployee(Number(empId)),
//   );

//   const responseData = response.data;

//   const allocations = Array.isArray(responseData)
//     ? responseData
//     : Array.isArray(responseData?.data)
//       ? responseData.data
//       : Array.isArray(responseData?.data?.content)
//         ? responseData.data.content
//         : Array.isArray(responseData?.content)
//           ? responseData.content
//           : [];

//   const availablePeriods = allocations.map((alloc: any) => ({
//     period: `${formatDateTime(alloc.startDate)} to ${formatDateTime(
//       alloc.endDate,
//     )}`,
//     percentage: alloc.allocationPercent ?? alloc.availability ?? 0,
//     roleId: alloc.roleId,
//     roleName: alloc.roleName,
//     project: alloc.projectName || alloc.project?.name || "Unknown",
//     empId: Number(empId),
//   }));

//   return {
//     data: { availablePeriods },
//     message: "Success",
//     status: "success",
//     statusCode: 200,
//   };
// }
// export async function getViewAllocations(
//   empId: string | number,
// ): Promise<ViewAllocationsResponse> {
//   const response = await apiClient.get(
//     ENDPOINTS.projectAllocationByEmployee(Number(empId)),
//   );
//   const allocations = response.data.data || [];

//   const availablePeriods = allocations.map((alloc: any) => ({
//     period: `${formatDateTime(alloc.startDate)} to ${formatDateTime(alloc.endDate)}`,
//     percentage: alloc.allocationPercent,
//     roleId: alloc.roleId,
//     roleName: alloc.roleName,
//     project: alloc.projectName || "Unknown",
//     empId: Number(empId),
//   }));

//   return {
//     data: { availablePeriods },
//     message: "Success",
//     status: "success",
//     statusCode: 200,
//   };
