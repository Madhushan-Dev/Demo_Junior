import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export async function deleteUser(id: number) {
  const response = await apiClient.delete(ENDPOINTS.employeeDelete(id));
return response.data;
}
