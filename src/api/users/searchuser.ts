import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface SearchUserData {
  empId: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  gender: string;
  designationName: string;
}

export async function searchUsers(searchTerm: string) {
  const response = await apiClient.get(ENDPOINTS.employee, {
    params: { search: searchTerm },
  });
  return response.data.data;
}
