import ENDPOINTS from "../utils/endpoints";
import apiClient from "../lib/api";

export interface DefectStatus {
  statusTypeId: number;
  statusName: string;
  statusType: string;
  colorCode: string;
}

export interface DefectStatusData {
  content: DefectStatus[];
  totalPages: number;
}

export interface DefectStatusResponse {
  status: string;
  statusMessage: string;
  data: DefectStatusData;
  statusCode: number;
}

export interface CreateDefectStatusRequest {
  statusName: string;
  statusType: string;
  colorCode: string;
}

export interface UpdateDefectStatusRequest {
  statusName: string;
  statusType: string;
  colorCode: string;
}

export const getAllDefectStatuses = async (
  page: number = 0,
  pagesize: number = 5,
): Promise<DefectStatusData> => {
  const response = await apiClient.get(
    ENDPOINTS.statusTypePagination(page, pagesize),
  );

  return response.data.data;
};

export const createDefectStatus = async (
  statusData: CreateDefectStatusRequest,
): Promise<DefectStatusResponse> => {
  const response = await apiClient.post(ENDPOINTS.createStatusType, statusData);
  return response.data;
};

export const updateDefectStatus = async (
  statusTypeId: number,
  statusData: UpdateDefectStatusRequest,
): Promise<DefectStatusResponse> => {

const response = await apiClient.put(
    ENDPOINTS.updateStatusType(statusTypeId),
    statusData,
  );

  return response.data;
};

export const deleteDefectStatus = async (
  statusTypeId: number,
): Promise<DefectStatusResponse> => {

  const response = await apiClient.delete(
    ENDPOINTS.deleteStatusType(statusTypeId),
  );
  return response.data;
};
