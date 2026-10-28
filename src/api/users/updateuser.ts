import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  whatsappNumber?: string;
  joinDate?: string;
  gender?: string;
  designationId?: number;
}
export async function updateUser(id: number, userData: UpdateUserPayload) {
  const response = await apiClient.put(ENDPOINTS.employeeUpdate(id), userData);
return response.data;
}

export async function updateUserStatus(id: number, status: boolean) {
  const response = await apiClient.patch(ENDPOINTS.employeeStatus(id), {
    isActive: status,
  });
return response.data;
}
