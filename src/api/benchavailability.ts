import apiClient from "../lib/api";

export interface BenchAvailabilityEmployee {
  empId: number;
  employeeName: string;
  currentProjects: string | null;
  designationName: string | null;
  roleType: string | null;
  availablePercentage: number;
  totalAllocatedPercentage: number;
}

export interface BenchAvailabilityResponse {
  data: {
    content: BenchAvailabilityEmployee[];
    totalElements: number;
    totalPages: number;
  };
  statusCode: number;
  statusMessage: string;
}

export const getBenchAvailability = async (
  page = 0,
  size = 100,
): Promise<BenchAvailabilityResponse> => {
  const response = await apiClient.get(
    `/bench-availability-view?page=${page}&size=${size}`,
  );

  return response.data;
};
export const getCurrentProjectDevelopers = async (
  projectId: number,
) => {
  const response = await apiClient.get(
    `/bench-allocation/project/${projectId}/developers`,
  );

  return response.data;
};