import ENDPOINTS from "../utils/endpoints";

import apiClient from "../lib/api";

export interface ImportTestCaseResponse {
  status: string;
  message: string;
  data: any;
  statusCode: number;
}

export const importTestCases = async (
  formData: FormData,
  projectId: string | number,
): Promise<ImportTestCaseResponse> => {
  formData.append("projectId", String(projectId));
  const response = await apiClient.post(
  ENDPOINTS.testCaseBulkImport(Number(projectId)),
  formData
);

  return response.data;
};
export interface ImportDefectResponse {
  status: string;
  message: string;
  data: any;
  statusCode: number;
}

// export const importDefects = async (formData: FormData, projectId: string) => {
//   const response = await apiClient.post(
//     `/defect/bulk?projectId=${projectId}`,
//     formData,
//     {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     },
//   );

//   return {
//     status: response.data.status,
//     statusCode: response.data.statusCode,
//     message: response.data.statusMessage,
//     data: response.data.data,
//   };
// };

export const importDefects = async (
  formData: FormData,
  projectId: string
) => {
  const response = await apiClient.post(
    `/defect/bulk?projectId=${projectId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const testAuthHeader = async (): Promise<void> => {
  return Promise.resolve();
};
