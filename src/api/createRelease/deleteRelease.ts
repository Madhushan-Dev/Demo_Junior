import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export async function deleteReleaseById(id: number) {
  const response = await apiClient.delete(ENDPOINTS.releaseById(id));

  return response.data;
}

export const deleteRelease = deleteReleaseById;
