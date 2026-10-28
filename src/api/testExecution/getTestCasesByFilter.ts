import ENDPOINTS from "../../utils/endpoints";
import apiClient from "../../lib/api";

export interface ReleaseTestCase {
  releaseTestCaseId: number;

  // Test Case
  testCaseId: number;
  testCaseName: string;
  description: string;
  testSteps: string;

  // Module
  moduleId: number;
  moduleName: string;

  // Sub Module
  subModuleId?: number;
  subModuleName?: string;

  // Severity
  severityId?: number;
  severityName?: string;

  // Priority
  priorityId?: number;
  priorityName?: string;

  // Defect Type
  defectTypeId?: number;
  defectTypeName?: string;

  // Release Test Case
  passOrFail?: string;

  // Bench Allocation
  benchAllocationId?: number;
}

export async function getTestCasesByFilter({
  projectId,
  releaseId,
  moduleId,
  subModuleId,
}: {
  projectId: number;
  releaseId: number;
  moduleId?: number;
  subModuleId?: number;
}): Promise<ReleaseTestCase[]> {

  const params: Record<string, number> = {};

  if (moduleId !== undefined) {
    params.moduleId = moduleId;
  }

  if (subModuleId !== undefined) {
    params.subModuleId = subModuleId;
  }

  const response = await apiClient.get(
    ENDPOINTS.releaseTestCase(releaseId),
    {
      params,
    }
  );

  const rawData =
    response.data?.data ||
    response.data?.content ||
    response.data ||
    [];

  let testCases: any[] = [];

  if (Array.isArray(rawData)) {
    testCases = rawData;
  } else if (Array.isArray(rawData.content)) {
    testCases = rawData.content;
  }

   return testCases.map((tc): ReleaseTestCase => ({
    releaseTestCaseId: tc.releaseTestCaseId,

    // Test Case
    testCaseId: tc.testCaseId,
    testCaseName: tc.testCaseName || "",
    description: tc.description || "-",
    testSteps: tc.testSteps || "",

    // Module
    moduleId: tc.moduleId,
    moduleName: tc.moduleName || "-",

    // Sub Module
    subModuleId: tc.subModuleId,
    subModuleName: tc.subModuleName || "-",

    // Severity
    severityId: tc.severityId,
    severityName: tc.severityName || "-",

    // Priority
    priorityId: tc.priorityId,
    priorityName: tc.priorityName || "-",

    // Defect Type
    defectTypeId: tc.defectTypeId,
    defectTypeName: tc.defectTypeName || "-",

    // Release Test Case
    passOrFail: tc.passOrFail,

    // Bench
    benchAllocationId: tc.benchAllocationId,
  }));
}