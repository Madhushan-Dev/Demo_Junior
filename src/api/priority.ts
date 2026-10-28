import apiClient from "../lib/api";
import ENDPOINTS from "../utils/endpoints";

export interface Priority {
  name: any;
  priorityId: number;
  priorityName: string;
  colorCode: string;
}

export interface GetPrioritiesResponse {
  status: string;
  message: string;
  data: {
    content: Priority[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

export const getAllPriorities = async (
  page: number = 0,
  Size: number = 100,
): Promise<GetPrioritiesResponse> => {
  const response = await apiClient.get(
    ENDPOINTS.priorityPagination(page, Size),
  );
  return response.data;
};

export const updatePriority = async (
  id: number,
  data: { priorityName: string; colorCode: string },
) => {
  const response = await apiClient.put(ENDPOINTS.priorityUpdate(id), data);
  return response.data;
};

export const deletePriority = async (id: number) => {
  const response = await apiClient.delete(ENDPOINTS.priorityDelete(id));
  return response.data;
};

export const createPriority = async (data: {
  priorityName: string;
  colorCode: string;
}) => {
  const response = await apiClient.post("/priority/save", data);

  return response.data;
};
