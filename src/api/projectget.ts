import apiClient from "../lib/api";
import ENDPOINTS from "../utils/endpoints";


//------------------------------------------------------------------
export const getAllProjects = async (
  status?: string,
  search?: string
): Promise<any[]> => {

  const params: any = {};

  if (status && status !== "ALL") {
    params.status = status;
  }

  if (search && search.trim()) {
    params.search = search.trim();
  }

  const response = await apiClient.get(ENDPOINTS.project, {
    params,
  });

  const d = response.data;

  const raw = Array.isArray(d)
    ? d
    : Array.isArray(d?.data)
      ? d.data
      : Array.isArray(d?.data?.content)
        ? d.data.content
        : Array.isArray(d?.content)
          ? d.content
          : [];

  return raw.map((p: any) => ({
    ...p,
    id: p.projectId,
    name: p.projectName,
  }));
};
//---------------------------------------------------------

export const getAllProjectsForDashbord = async (): Promise<any[]> => {
  const response = await apiClient.get(ENDPOINTS.project);
  const d = response.data;

  const raw = Array.isArray(d)
    ? d
    : Array.isArray(d?.data)
      ? d.data
      : Array.isArray(d?.data?.content)
        ? d.data.content
        : Array.isArray(d?.content)
          ? d.content
          : [];

  return raw.map((p: any) => ({
    ...p,
    id: p.projectId,
    name: p.projectName,
  }));
};

export async function updateProject(id: number, projectData: any) {
  const response = await apiClient.put(
    ENDPOINTS.projectById(id),
    projectData
  );

  return response.data;
}



export async function deleteProject(id: string | number) {
  try {
    const projectResponse = await apiClient.get(
      ENDPOINTS.projectById(Number(id))
    );

    const project = projectResponse.data;
    const projectData = project?.data ?? project;

    if (projectData?.status?.toLowerCase() === "active") {
      throw new Error("Active project cannot be deleted.");
    }

    if (projectData?.status?.toLowerCase() === "on hold") {
      throw new Error("On Hold project cannot be deleted.");
    }

    const response = await apiClient.delete(
      ENDPOINTS.projectById(Number(id))
    );

    return response.data;

  } catch (error: any) {

    if (error instanceof Error) {
      throw error;
    }
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.statusMessage ||
      error.message ||
      "Failed to delete project.";

    throw new Error(errorMessage);
  }
}


export async function createProject(project: any) {
  const response = await apiClient.post(ENDPOINTS.project, project);

  return response.data;
}

export interface AvailableManager {
  empId: number;
  firstName: string;
  lastName: string;
  email: string;
  designationId: number;
  designationName: string;
  availabilityPercent: number;
  isActive: boolean;
  availability?: number;
  designationId?: number;
  designationName?: string;
  availabilityPercent?: number;
}


const getFreeAvailability = (employee: any): number => {
  const freeValue =
    employee.availablePercentage ??
    employee.availablePercent ??
    employee.freePercentage ??
    employee.freeCapacity ??
    employee.remainingAvailability ??
    employee.allocationAvailability ??
    employee.availabilityPercent;

  if (freeValue !== undefined && freeValue !== null) {
    return Number(freeValue);
  }

  const totalAvailability = Number(
    employee.totalAvailability ??
      employee.totalPercentage ??
      employee.capacity ??
      100,
  );

  const allocatedPercentage = Number(
    employee.allocatedPercentage ??
      employee.allocationPercentage ??
      employee.allocatedPercent ??
      employee.projectAllocation ??
      employee.allocated ??
      0,
  );

  return Math.max(0, totalAvailability - allocatedPercentage);
};

/** Normalises the designation-employee endpoint's response for the project form. */
const getManagerList = (responseData: any): AvailableManager[] => {
  const raw = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(responseData?.data?.data)
        ? responseData.data.data
        : Array.isArray(responseData?.data?.content)
          ? responseData.data.content
          : Array.isArray(responseData?.content)
            ? responseData.content
            : [];

  return raw
.map((employee: any) => ({
  empId: Number(employee.empId ?? employee.employeeId ?? employee.id),
  firstName: employee.firstName ?? "",
  lastName: employee.lastName ?? "",
  email: employee.email ?? "",
  designationId: Number(employee.designationId ?? 0),
  designationName: employee.designationName ?? "",
  availabilityPercent: getFreeAvailability(employee),
  isActive: employee.isActive ?? employee.active ?? true,
}))
    .filter((employee: AvailableManager) => Number.isFinite(employee.empId));
};

export const getAvailableManagers = async (
  designationId: number,
): Promise<AvailableManager[]> => {
  const response = await apiClient.get(
    ENDPOINTS.availableManagers(designationId),
  );
//   const d = response.data;
//   if (Array.isArray(d)) return d;
//   if (Array.isArray(d?.data)) return d.data;
//   if (Array.isArray(d?.data?.content)) return d.data.content;
//   if (Array.isArray(d?.content)) return d.content;
//   return [];
    return getManagerList(response.data);
};

export const getAvailableManagersForUpdate = async (
  designationId: number,
  projectId: number,
): Promise<AvailableManager[]> => {
  const response = await apiClient.get(
    ENDPOINTS.availableManagersForUpdate(designationId, projectId),
  );
//   const d = response.data;
//
//   if (Array.isArray(d)) return d;
//   if (Array.isArray(d?.data)) return d.data;
//   if (Array.isArray(d?.data?.content)) return d.data.content;
//   if (Array.isArray(d?.content)) return d.content;
//   return [];

 return getManagerList(response.data);
};
