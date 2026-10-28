import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";
//import { Employee } from "../../types/index";


export interface BenchEmployee {
  empId: number;
  employeeName: string;
  designationName: string;
  availablePercentage: number;
  availablePeriod: string;
  currentProjects: string;
  totalAllocatedPercentage: number;
}
export interface EmployeeDetails {
  empId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  whatsappNumber?: string;
  designationName?: string;
}

export async function getEmployeeDetails(
  id: number | string
): Promise<EmployeeDetails | null> {
  const response = await apiClient.get(
    ENDPOINTS.employeeById(Number(id))
  );

  console.log("EMPLOYEE BY ID RESPONSE:", response.data);

  const data = response.data?.data;
 if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data || null;
}

export interface BenchPageResponse {
  content: BenchEmployee[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export async function getBenchList(
  selectedProjectId: number,
   page: number = 0,
  size: number = 1000
): Promise<BenchPageResponse[]> {
  const response = await apiClient.get(ENDPOINTS.benchEmployee( page, size));

    console.log("BENCH API RESPONSE:", response.data);
     console.log("FIRST EMPLOYEE:", response.data?.data?.content?.[0]);
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}


// export async function getBenchList(
//   page: number = 0,
//   size: number = 10
// ): Promise<BenchPageResponse> {
//   const response = await apiClient.get(
//     ENDPOINTS.benchEmployee(page, size)
//   );

//   console.log("BENCH API RESPONSE:", response.data);

//   const data = response.data?.data ?? response.data;

//   console.log("BENCH PAGINATION DATA:", data);

//   return {
//     content: Array.isArray(data?.content) ? data.content : [],
//     totalElements: data?.totalElements ?? 0,
//     totalPages: data?.totalPages ?? 0,
//     number: data?.number ?? page,
//     size: data?.size ?? size,
//     first: data?.first ?? page === 0,
//     last: data?.last ?? true,
//   };
// }




export const getViewAllocation = async (empId: string) => {
  return { data: { availablePeriods: [] } };
};

/*

export const getBenchAvailability = async (
  page: number = 0,
  size: number = 5,
  filters: any = {},
) => {
  const params: any = { page, size };

  if (filters.designation) params.designation = filters.designation;
  if (filters.minAvailable) params.minAvailable = filters.minAvailable;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const response = await apiClient.get(ENDPOINTS.benchEmployee(page, size), { params });

    console.log("BENCH PAGINATION RESPONSE:", response.data);
  return response.data.data;
};
*/

export const getBenchAvailability = async (
  page: number = 0,
  size: number = 5,
  filters: any = {},
) => {
  const params: any = {  };

  if (filters.designation) params.designation = filters.designation;
  if (filters.minAvailable) params.minAvailable = filters.minAvailable;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.name) params.name = filters.name;
  if (filters.firstName) params.firstName = filters.firstName;
  if (filters.lastName) params.lastName = filters.lastName;

  const response = await apiClient.get(
    ENDPOINTS.benchEmployee(page, size), { params });

  // Don't unwrap to .data.data — we need totalElements/totalPages/etc. for real pagination
  return response.data;
};


export const getEmployeeProjectHistory = async (empId: string) => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.projectAllocationByEmployee(Number(empId)),
    );
    const d = response.data;
    let arr: any[] = [];
    if (Array.isArray(d)) arr = d;
    else if (Array.isArray(d?.data)) arr = d.data;
    else if (Array.isArray(d?.data?.content)) arr = d.data.content;
    else if (Array.isArray(d?.content)) arr = d.content;
    return { data: arr };
  } catch {
    return { data: [] };
  }
};