import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface CreateTestCaseRequest {
  testCaseName: string;
  description: string;
  testSteps: string;
  defectTypeId: number;
  projectId: number;
  moduleId: number;
  subModuleId: number;
  severityId: number;
}


export interface CreateTestCaseResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: any;
}

export async function createTestCase(
  projectId: number,
  moduleId: number,
  subModuleId: number,
  testCaseData: CreateTestCaseRequest,
): Promise<CreateTestCaseResponse> {

  const url = ENDPOINTS.testCaseBySubModule(
    projectId,
    moduleId,
    subModuleId,
  );

  const response = await apiClient.post(url, testCaseData);

  return response.data;
}

