import ENDPOINTS from "../utils/endpoints";

import apiClient from "../lib/api";

export interface SubModuleDevResponse {
  status: string;
  statusCode: number | string;
  statusMessage: string;
  data: SubModuleDevAllocation[];
}

export interface SubModuleDevAllocation {
  subModuledevId: number;
  employee: {
    empId: number;
    firstName: string;
    lastName: string;
    email: string;
    designation?: {
      designationId?: number;
      designationName?: string;
    };
    isActive?: boolean;
  };
}

export interface RequestSubModuleDev {
  subModuleId: number;
  devId: number;
}

export interface ProjectAllocationResponse {
  id: number;
  employeeId: number;
  firstName: string;
  lastName: string;
  projectId: number;
  projectName: string;
  roleId: number;
  roleName: string;
  startDate: string;
  endDate: string;
  allocationPercent: number;
}

export interface ProjectAllocationEmployeeResponse {
  status: string;
  statusCode: number | string;
  statusMessage: string;
  data: ProjectAllocationResponse[];
}

export interface AvailableDeveloper {
  benchAllocationId: number;
  empId: number;
  firstName: string;
  lastName: string;
  roleType: string;
}

export const getMockProjectAllocatedEmployees = async (
  projectId: string | number,
  projectName?: string,
): Promise<ProjectAllocationEmployeeResponse> => {
  const numericProjectId = Number(projectId) || 1;
  const normalizedProjectName = projectName?.trim().toLowerCase();
  const seededProjectAllocations: ProjectAllocationResponse[] = [
    {
      id: 1,
      employeeId: 1,
      firstName: "John",
      lastName: "Perera",
      projectId: 1,
      projectName: "Defect Tracking System",
      roleId: 2,
      roleName: "Developer",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      allocationPercent: 60,
    },
    {
      id: 2,
      employeeId: 2,
      firstName: "Nimal",
      lastName: "Silva",
      projectId: 1,
      projectName: "Defect Tracking System",
      roleId: 3,
      roleName: "QA",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      allocationPercent: 40,
    },
    {
      id: 3,
      employeeId: 3,
      firstName: "Amal",
      lastName: "Fernando",
      projectId: 2,
      projectName: "Payroll Management System",
      roleId: 1,
      roleName: "Project Manager",
      startDate: "2026-02-01",
      endDate: "2026-11-30",
      allocationPercent: 50,
    },
  ];

  const allocationsByName = normalizedProjectName
    ? seededProjectAllocations.filter(
        (allocation) =>
          allocation.projectName.toLowerCase() === normalizedProjectName,
      )
    : [];

  return {
    status: "Success",
    statusCode: 200,
    statusMessage: "Retrieved Successfully.",
    data:
      allocationsByName.length > 0
        ? allocationsByName
        : seededProjectAllocations.filter(
            (allocation) => allocation.projectId === numericProjectId,
          ),
  };
};

export const getAllSubmoduleAllocatedDevBySubmoduleId = async (
  moduleId: number,
  subModuleId: number,
): Promise<SubModuleDevResponse> => {
  console.log("Fetching allocated developers for moduleId:", moduleId, "subModuleId:", subModuleId);
  const response = await apiClient.get(ENDPOINTS.subModuleDev(moduleId, subModuleId));

  return response.data;
};

export const assignDevToASubmdule = async (
  moduleId: number,
  subModuleId: number,
  devId: number,
): Promise<SubModuleDevAllocation> => {
  const response = await apiClient.post<SubModuleDevAllocation>(
    ENDPOINTS.subModuleDev(moduleId, subModuleId),
    {
      employeeId: devId,
    },
  );

  return response.data;
};

export const deAllocateDevFromASubModule = async (
  moduleId: number,
  subModuleId: number,
  devId: number,
): Promise<SubModuleDevResponse> => {
  const response = await apiClient.delete(
    ENDPOINTS.subModuleDevDelete(moduleId, subModuleId, devId),
  );
  return response.data;
};

export const allocateProjectEmployeeToSubModule = async (
  moduleId: number,
  subModuleId: number,
  employeeId: number,
): Promise<SubModuleDevResponse> => {
  return assignDevToASubmdule(moduleId, subModuleId, employeeId);
};

export const deAllocateProjectEmployeeFromSubModule = async (
  moduleId: number,
  subModuleId: number,
  employeeId: number,
): Promise<SubModuleDevResponse> => {
  return deAllocateDevFromASubModule(moduleId, subModuleId, employeeId);
};

export const getAvailableDevelopers = async (
  moduleId: number,
  subModuleId: number,
): Promise<AvailableDeveloper[]> => {
  const response = await apiClient.get(
    ENDPOINTS.subModuleAvailableEmployees(
      moduleId,
      subModuleId
    )
  );

  return Array.isArray(response.data)
    ? response.data
    : response.data?.data || [];
};
