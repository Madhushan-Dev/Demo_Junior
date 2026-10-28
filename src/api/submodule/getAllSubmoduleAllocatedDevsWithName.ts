import apiClient from "../../lib/api";

export interface SubDevWithName {
  id: number;
  employeeId: number;
  submoduleId: number;
  employeeName?: string;
}

export interface SubDevWithNameResponse {
  status: number;
  statusCode: string;
  statusMessage: string;
  data: SubDevWithName[];
}

const getAllSubDevwithName = async (
  submoduleId: number,
): Promise<SubDevWithNameResponse> => {
  const response = await apiClient.get(`/sub-module/${submoduleId}/employee`);
  return response.data;
};

export default getAllSubDevwithName;
