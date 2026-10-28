import apiClient from "../../lib/api";

export const updateSubmodule = async (
  submoduleId: number,
  moduleId: number,
  data: { subModuleName: string },
) => {
  try {
    const response = await apiClient.put(
      `/module/${moduleId}/sub-module/${submoduleId}`,
      {
        subModuleName: data.subModuleName,
      },
    );

    return {
      status: "success",
      message: response.data?.statusMessage || "Submodule updated successfully",
      data: response.data?.data,
    };
  } catch (error: any) {
return {
      status: "error",
      message:
        error.response?.data?.data?.[0]?.message ||
        error.response?.data?.message ||
        "Failed to update submodule",
      errorCode: error.response?.data?.data?.[0]?.errorCode,
      statusCode: error.response?.status,
    };
  }
};
