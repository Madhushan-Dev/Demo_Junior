import apiClient from "../../lib/api";
import { CreateModuleRequest, CreateModuleResponse } from "../../types/index";
import ENDPOINTS from "../../utils/endpoints";

export const createModule = async (
  data: CreateModuleRequest,
): Promise<CreateModuleResponse> => {

try {
const response = await apiClient.post(ENDPOINTS.module(data.projectId), {
      moduleName: data.name,
      projectId: data.projectId,
    });
return response.data;
} catch (error: any) {
if (error.response && error.response.data) {
return error.response?.data?.[0]?.message ||" Module name must be between 50 characters";
    }

    throw error;
  }
};

export const createSubmodule = async (data: {
  subModuleName: string;
  moduleId: number;
}) => {
  try {
    const response = await apiClient.post(
      `/module/${data.moduleId}/sub-module`,
      {
        subModuleName: data.subModuleName,
        moduleId: data.moduleId,
        submoduleDevId: null,
      },
    );

    return {
      status: "success",
      message:
        response.data?.data?.[0]?.message ||
        response.data?.message ||
        response.data?.statusMessage ||
        "Submodule created successfully",
      data: response.data?.data,
    };
  } catch (error: any) {
    return {
      status: "error",
      message:
        error.response?.data?.data?.[0]?.message ||
        error.response?.data?.message ||
        error.response?.data?.statusMessage ||
        "Failed to create submodule",
      statusCode: error.response?.status,
      errorCode: error.response?.data?.errorCode,
    };
  }
};