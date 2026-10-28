import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface User {
  empId: number;
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string;
  joinDate?: string;
  gender?: string;
  isActive?: boolean;
  designationId?: number;
  designationName?: string;
}

export interface SimpleUser {
  empId: number;
  firstName: string;
  lastName: string;
  email: string;
  designationId?: number;
  designationName?: string;
}

export interface GetUsersByDesignationResponse {
  status: string;
  data: SimpleUser[];
}

export async function getAllUsersSimple(page: number = 0, size: number = 10000) {
  const response = await apiClient.get(ENDPOINTS.getallemployees(), {
    params: { page, size },
  });
return response.data;
}

export async function getAllUsersSimpl() {
  const response = await apiClient.get(ENDPOINTS.employee);
return response.data;
}

export async function getUsersByDesignationId(
  designationId: number,
): Promise<GetUsersByDesignationResponse> {
  const response = await apiClient.get(
    ENDPOINTS.designationEmployee(designationId),
  );
  return response.data;
}
