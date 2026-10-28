import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export const updateRole = async (
  id: number,
  data: { roleName: string; roleType: string },
) => {
  const response = await apiClient.put(ENDPOINTS.roleUpdate(id), data);

  return response.data;
};
