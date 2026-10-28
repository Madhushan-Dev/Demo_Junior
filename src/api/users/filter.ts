import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface UserFilter {
  id: number;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  userGender?: string;
  status?: string;
  designationId?: number;
  designationName?: string;
}

export async function getUsersByFilter(
  gender?: string,
  status?: string,
  designationId?: number,
  page: number = 1,
  size: number = 10,
) {
  const response = await apiClient.get(ENDPOINTS.employee, {
    params: { gender, status, designationId, page, size },
  });
  return response.data.data;
}

export const filterUsers = getUsersByFilter;
