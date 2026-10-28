import apiClient from "../lib/api";

const VITE_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8082";

import ENDPOINTS from "../utils/endpoints";
export interface CreateDefectTypePayload {
  defectTypeName: string;
}

export interface CreateDefectTypeResponse {
  status: string;
  message: string;
  statusCode: number;
  data: {
    id: number;
    name: string;
  };
}

export interface ApiDefectType {
  defectTypeId: number;
  defectTypeName: string;
}

export interface GetDefectTypesResponse {
  status: string;
  message: string;
  data: {
    content: ApiDefectType[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  };
}

export interface GetDefectTypeByIdResponse {
  status: string;
  message: string;
  statusCode: number;
  data: ApiDefectType;
}

export interface UpdateDefectTypePayload {
  defectTypeName: string;
  description: string;
  category:
    | "functional"
    | "performance"
    | "security"
    | "usability"
    | "compatibility"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  priority: "low" | "medium" | "high" | "critical";
  isActive: boolean;
}

export interface UpdateDefectTypeResponse {
  status: string;
  message: string;
  statusCode: number;
  data: {
    id: number;
    defectTypeName: string;
  };
}

export interface DeleteDefectTypeResponse {
  status: string;
  message: string;
  statusCode: number;
}

export const createDefectType = async (data: { defectTypeName: string }) => {
  const response = await apiClient.post(ENDPOINTS.defectType, data);
  return response.data;
};

export const updateDefectType = async (
  defectTypeId: number,
  data: { defectTypeName: string },
) => {
try {
    const response = await apiClient.patch(
      ENDPOINTS.updatebyid(defectTypeId),
      data,
    );
return response.data;
  } catch (err) {
throw err;
  }
};

export const getDefectTypes = async (
  page: number,
  size: number,
): Promise<GetDefectTypesResponse> => {
  const response = await apiClient.get(
    ENDPOINTS.defectTypePagination(page, size),
  );

  return response.data;
};

export const getDefectTypeById = async (
  id: string,
): Promise<GetDefectTypeByIdResponse> => {
const now = new Date().toISOString();
  return {
    status: "success",
    message: "Fetched (Mocked)",
    statusCode: 200,
    data: {
      id: Number(id),
      defectTypeName: "Sample Type",
      description: "Sample description",
      category: "functional",
      severity: "medium",
      priority: "medium",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  };
};

export const deleteDefectType = async (defectTypeId: number) => {
const response = await apiClient.delete(
    ENDPOINTS.defectTypeById(defectTypeId),
  );
  return response.data;
};
