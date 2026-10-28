import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export const updateReleaseView = async (id: number, data: any) => {
  const response = await apiClient.put(ENDPOINTS.updateReleaseView(id), data);

  return response.data;
};
