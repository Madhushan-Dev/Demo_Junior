import ENDPOINTS from "../utils/endpoints";

import apiClient from "../lib/api";
import Severity from "../pages/Severity";

export interface Severity {
  severityId: number;
  severityName: string;
  colorCode: string;
  weight: number;
}

export interface CreateSeverityRequest {
  severityName: string;
  colorCode: string;
  weight: number;
}

export interface CreateSeverityResponse {
  message: string;
  statusCode: number;
  data?: Severity;
}

export interface GetSeveritiesResponse {
  statusCode: number;
  statusMessage: string;
  data: {
    content: Severity[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

export interface ErrorResponse {
  status: string;
  message: string;
  statusCode: number;
}

export const createSeverity = async (
  data: CreateSeverityRequest,
): Promise<CreateSeverityResponse> => {
  const response = await apiClient.post(ENDPOINTS.severity, data);
  return response.data;
};

export const updateSeverity = async (
  id: number,
  data: Partial<CreateSeverityRequest>,
): Promise<CreateSeverityResponse> => {
  const response = await apiClient.put(ENDPOINTS.severityById(id), data);

  return response.data;
};

export const getSeverities = async (
  page: number = 0,
  pageSize: number = 100,
): Promise<GetSeveritiesResponse> => {
  const response = await apiClient.get(
    ENDPOINTS.severityPagination(page, pageSize),
  );
  return response.data;
};

export const deleteSeverity = async (id: number) => {
  const response = await apiClient.delete(ENDPOINTS.severityById(id));
  return response.data;
};
