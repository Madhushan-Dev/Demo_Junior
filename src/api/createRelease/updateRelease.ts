import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export async function updateRelease(id: number, data: any) {
  const response = await apiClient.put(ENDPOINTS.releaseById(id), data);

  return response.data;
}
