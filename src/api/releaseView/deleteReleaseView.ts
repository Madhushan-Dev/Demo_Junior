import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export const deleteReleaseView = async (id: number) => {
  const response = await apiClient.delete(ENDPOINTS.deleteReleaseView(id));

  return response.data;
};
