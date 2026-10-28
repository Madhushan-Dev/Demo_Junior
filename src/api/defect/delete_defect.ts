import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export const deleteDefectById = async (id: string | number) => {
  const response = await apiClient.delete(`${ENDPOINTS.deletedefect}/${id}`);

  return response.data;
};

export const deleteDefect = deleteDefectById;
