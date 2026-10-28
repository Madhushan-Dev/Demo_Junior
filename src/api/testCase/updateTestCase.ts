import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export async function updateTestCase(
  subModuleId: number,
  testCaseId: string | number,
  data: any,
) {
  if (!data) {
    throw new Error("Update data is required");
  }

  try {

    console.log("UPDATE DATA:", data);
    console.log("DEFECT TYPE ID:", data.defectTypeId);
    console.log("TYPE:", data.type);
    
    const response = await apiClient.put(
  ENDPOINTS.testCaseById(
    Number(data.projectId),
    Number(data.moduleId),
    Number(subModuleId),
    Number(testCaseId)
  ),
  {
    testCaseName: data.testCaseName || "Test Case",
    description: data.description,
    testSteps:
      data.testSteps ||
      data.detailsSteps ||
      data.steps ||
      "",
    severityId: data.severityId,
    defectTypeId: data.defectTypeId,
    subModuleId: Number(subModuleId),
    moduleId: Number(data.moduleId),
    projectId: Number(data.projectId),
  },
);
    return response.data;
  } catch (error: any) {
  console.error("UPDATE TEST CASE ERROR:");
  console.error("Status:", error.response?.status);
  console.error("Response:", error.response?.data);
  console.error("Sent Payload:", error.config?.data);

  throw error;
}
}
