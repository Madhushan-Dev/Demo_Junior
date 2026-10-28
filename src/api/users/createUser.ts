import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  whatsappNumber: string;
  designationId: number;
  joinDate: string;
}

export async function createUser(userData: CreateUserPayload) {
  const response = await apiClient.post(ENDPOINTS.employee, userData);
return response.data;
}
