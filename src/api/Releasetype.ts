import ENDPOINTS from "../utils/endpoints";

import apiClient from "../lib/api.ts";

export interface Releasetype {
  id: number;
  releaseTypeName: string;
}

export interface ReleaseTypeList {
  totalElements?: number;
  content?: Releasetype[];
}

export interface ReleaseTypeResponse {
  status: string;
  statusMessage: string;
  data: ReleaseTypeList;
  statusCode: number;
}

export interface CreateReleaseTypeRequest {
  releaseTypeName: string;
}

export interface UpdateReleaseTypeRequest {
  releaseTypeName: string;
}

export const getAllReleaseTypes = async (
  currentPage: number = 0,
  pageSize: number = 5,
): Promise<ReleaseTypeResponse> => {
  const response = await apiClient.get(
    ENDPOINTS.releaseTypePagination(currentPage, pageSize),
  );

  const list = response.data?.data?.content || [];

  const content = list.map((item: any) => ({
    id: item.id,
    releaseTypeName: item.type,
  }));

  return {
    status: "success",
    statusMessage: response.data?.statusMessage || "Success",
    statusCode: response.data?.statusCode || 200,
    data: {
      content,
      totalElements: response.data?.data?.totalElements ?? content.length,
    },
  };
};

export const createReleaseType = async (
  data: CreateReleaseTypeRequest,
): Promise<Releasetype> => {
  const response = await apiClient.post(ENDPOINTS.releaseType, {
    type: data.releaseTypeName,
  });
  const result = response.data?.data;
  return { id: result.id, releaseTypeName: result.type };
};

export const updateReleaseType = async (
  id: number,
  data: UpdateReleaseTypeRequest,
): Promise<Releasetype> => {
  const response = await apiClient.put(ENDPOINTS.releaseTypeById(id), {
    type: data.releaseTypeName,
  });
  const result = response.data?.data;
  return { id: result.id, releaseTypeName: result.type };
};

export const deleteReleaseType = async (id: number): Promise<any> => {
  const response = await apiClient.delete(ENDPOINTS.releaseTypeById(id));

  return response.data;
};
