import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export const deleterole = async (id: number) => {
  const response = await apiClient.delete(ENDPOINTS.roleDelete(id));
  return response.data;
};
