import ENDPOINTS from "../utils/endpoints";

import apiClient from "../lib/api";

export interface TestCase {
  id: string;
  module: string;
  subModule: string;
  description: string;
  steps: string;
  type: string;
  severity: string;
  projectId: string;
  releaseId?: string;
  testCaseId?: string;
}

export interface GetTestCasesByFilterResponse {
  status: string;
  message: string;
  data: TestCase[];
  statusCode: number;
}

// export const getTestCasesByFilter = async (
//   projectId: string | number,
//   moduleId: string | number,
//   submoduleId: string | number,
//   releaseId: string | number,
// ): Promise<GetTestCasesByFilterResponse> => {
//   return {
//     status: "success",
//     message: "Fetched (Mocked)",
//     statusCode: 200,
//     data: [
//       {
//         id: "1",
//         testCaseId: "TC001",
//         module: "Auth",
//         subModule: "Login",
//         description: "Check login",
//         steps: "Steps...",
//         type: "Functional",
//         severity: "High",
//         projectId: String(projectId),
//         releaseId: String(releaseId),
//       },
//     ],
//   };
// };

// export const getTestCasesByFilter = async (
//   projectId: string | number,
//   moduleId?: string | number,
//   submoduleId?: string | number,
//   releaseId?: string | number,
// ): Promise<GetTestCasesByFilterResponse> => {
//   const response = await apiClient.get(
//     ENDPOINTS.testCaseFilter,
//     {
//       params: {
//         projectId: Number(projectId),
//         ...(moduleId !== undefined && {
//           moduleId: Number(moduleId),
//         }),
//         ...(submoduleId !== undefined && {
//           subModuleId: Number(submoduleId),
//         }),
//       },
//     },
//   );

//   return {
//     status: "success",
//     message: "Test cases fetched successfully",
//     statusCode: 200,
//     data: response.data || [],
//   };
// };

// export async function getTestCasesByFilter({
//   projectId,
//   releaseId,
//   moduleId,
//   subModuleId,
// }: {
//   projectId: number;
//   releaseId: number;
//   moduleId?: number;
//   subModuleId?: number;
// }): Promise<any[]> {

//   const params: Record<string, number> = {};

//   if (moduleId !== undefined) {
//     params.moduleId = Number(moduleId);
//   }

//   if (subModuleId !== undefined) {
//     params.subModuleId = Number(subModuleId);
//   }

//   const response = await apiClient.get(
//     ENDPOINTS.releaseTestCase(Number(releaseId)),
//     {
//       params,
//     }
//   );

//   console.log("========== FILTER API DEBUG ==========");

//   console.log(
//     "🔥 URL:",
//     response.config.url
//   );

//   console.log(
//     "🔥 PARAMS:",
//     response.config.params
//   );

//   console.log(
//     "🔥 RESPONSE:",
//     JSON.stringify(response.data, null, 2)
//   );

//   console.log("======================================");

//   const rawData =
//     response.data?.data ||
//     response.data?.content ||
//     response.data ||
//     [];

//   let testCases: any[] = [];

//   if (Array.isArray(rawData)) {
//     testCases = rawData;
//   } else if (Array.isArray(rawData.content)) {
//     testCases = rawData.content;
//   }

//   return testCases.map((tc) => ({
//     releaseTestCaseId: tc.releaseTestCaseId,

//     // Test Case
//     testCaseId: tc.testCaseId,
//     testCaseName: tc.testCaseName || "",
//     description: tc.description || "-",
//     testSteps: tc.testSteps || "",

//     // Module
//     moduleId: tc.moduleId,
//     moduleName: tc.moduleName || "-",

//     // Sub Module
//     subModuleId: tc.subModuleId,
//     subModuleName: tc.subModuleName || "-",

//     // Severity
//     severityId: tc.severityId,
//     severityName: tc.severityName || "-",

//     // Priority
//     priorityId: tc.priorityId,
//     priorityName: tc.priorityName || "-",

//     // Defect Type
//     defectTypeId: tc.defectTypeId,
//     defectTypeName: tc.defectTypeName || "-",

//     // Release Test Case
//     passOrFail: tc.passOrFail,

//     // Bench
//     benchAllocationId: tc.benchAllocationId,

//     // 🔥 DEFECT
//     defectId: tc.defectId ?? null,

//     // 🔥 EXECUTER / QA
//     employeeId: tc.employeeId ?? null,
//     employeeName: tc.employeeName ?? "",

//     // 🔥 ASSIGNED TO
//     assignToId: tc.assignToId ?? null,
//     assignToName: tc.assignToName ?? "",
//   }));
// }

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
}): Promise<any[]> {

  const params: Record<string, number> = {};

  if (moduleId !== undefined) {
    params.moduleId = Number(moduleId);
  }

  if (subModuleId !== undefined) {
    params.subModuleId = Number(subModuleId);
  }

  const response = await apiClient.get(
    ENDPOINTS.releaseTestCase(Number(releaseId)),
    {
      params,
    }
  );

  console.log("========== FILTER API DEBUG ==========");

  console.log(
    "🔥 URL:",
    response.config.url
  );

  console.log(
    "🔥 PARAMS:",
    response.config.params
  );

  console.log(
    "🔥 RESPONSE:",
    JSON.stringify(response.data, null, 2)
  );

  console.log("======================================");

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

  return testCases.map((tc) => ({
    // Release Test Case
    releaseTestCaseId: tc.releaseTestCaseId,

    // Test Case
    testCaseId: tc.testCaseId,
    testCaseNumber: tc.testCaseNumber, // ⭐ ADD THIS
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

    // Defect
    defectId: tc.defectId ?? null,
    projectDefectNumber: tc.projectDefectNumber ?? null,

    // Executor / QA
    employeeId: tc.employeeId ?? null,
    employeeName: tc.employeeName ?? "",

    // Assigned To
    assignToId: tc.assignToId ?? null,
    assignToName: tc.assignToName ?? "",
  }));
}

// export const allocateTestCaseToRelease = async (
//   releaseId: number,
//   testCaseId: number,
// ): Promise<any> => {
//   console.log("releaseId BEFORE POST:", releaseId);
//   console.log("releaseId TYPE:", typeof releaseId);

//   if (!Number.isFinite(releaseId)) {
//     throw new Error(`Invalid releaseId: ${releaseId}`);
//   }

//   const response = await apiClient.post(
//     ENDPOINTS.releaseTestCase(releaseId),
//     { testCaseIds: [testCaseId] },
//     { params: { skipDuplicates: false } },
//   );

//   return response.data;
// };

export const allocateTestCaseToRelease = async (
  releaseId: number,
  testCaseId: number,
): Promise<any> => {
  console.log("releaseId BEFORE POST:", releaseId);
  console.log("releaseId TYPE:", typeof releaseId);

  if (!Number.isFinite(releaseId)) {
    throw new Error(`Invalid releaseId: ${releaseId}`);
  }

  // const response = await apiClient.post(
  //   ENDPOINTS.releaseTestCase(releaseId),
  //   { testCaseIds: [testCaseId] },
  //   { params: { skipDuplicates: false } },
  // );

  const response = await apiClient.post(
  ENDPOINTS.releaseTestCase(releaseId),
  {
    releaseId,
    testCaseIds: [testCaseId],
  },
  { params: { skipDuplicates: false } },
);

  return response.data;
};

export const allocateTestCaseToMultipleReleases = async (
  testCaseId: string | number,
  releaseIds: (string | number)[],
): Promise<{
  results: any[];
  failed: { releaseId: number; error: string }[];
  message: string;
}> => {
  const results = await Promise.allSettled(
    releaseIds.map((releaseId) =>{
      console.log("releaseIds BEFORE MAP:", releaseIds);

releaseIds.forEach((id) => {
  console.log("release ID:", id, "TYPE:", typeof id);
});
if (!Number.isFinite(Number(releaseId))) {
  throw new Error(`Invalid releaseId: ${releaseId}`);
}
      // return apiClient.post(
      //   ENDPOINTS.releaseTestCase(Number(releaseId)),
      //   { testCaseIds: [Number(testCaseId)] },
      //   { params: { skipDuplicates: false } },
      // );

      return apiClient.post(
  ENDPOINTS.releaseTestCase(Number(releaseId)),
  {
    releaseId: Number(releaseId),
    testCaseIds: [Number(testCaseId)],
  },
  { params: { skipDuplicates: false } },
);
    }),
  );
  

  const succeeded: any[] = [];
  const failed: { releaseId: number; error: string }[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      succeeded.push(result.value);
    } else {
      const errorMessage =
        result.reason?.response?.data?.message ||
        result.reason?.message ||
        "Unknown error occurred";
      failed.push({
        releaseId: Number(releaseIds[index]),
        error: errorMessage,
      });
    }
  });

  let message = "";
  if (succeeded.length > 0 && failed.length === 0) {
    message = `Test case allocated to ${succeeded.length} release(s) successfully.`;
  } else if (succeeded.length > 0 && failed.length > 0) {
    message = `Test case allocated to ${succeeded.length} release(s). Failed for ${failed.length} release(s).`;
  } else {
    message = `Failed to allocate test case to all ${failed.length} release(s).`;
  }

  return {
    results: succeeded,
    failed,
    message,
  };
};

export const allocateTestCasesToManyReleases = async (
  releaseIds: (string | number)[],
  releaseNames: string[],
  testCaseIds: (string | number)[],
): Promise<any> => {
  const results = await Promise.allSettled(
    releaseIds.map((releaseId) =>{
      console.log("SELECTED RELEASE IDS:", releaseIds);
console.log(
  "RELEASE IDS WITH TYPES:",
  releaseIds.map((id) => ({
    id,
    type: typeof id,
    number: Number(id),
  }))
);
      // return apiClient.post(
      //   ENDPOINTS.releaseTestCase(Number(releaseId)),
      //   { testCaseIds: testCaseIds.map(Number) },
      //   { params: { skipDuplicates: true } },
      // );

      return apiClient.post(
  ENDPOINTS.releaseTestCase(Number(releaseId)),
  {
    releaseId: Number(releaseId),
    testCaseIds: testCaseIds.map(Number),
  },
  { params: { skipDuplicates: true } },
);
    }),
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    const firstError = (failed[0] as PromiseRejectedResult).reason;
    throw firstError;
  }

  return results.map((result, index) => ({
    releaseId: releaseIds[index],
    releaseName: releaseNames[index] || `Release ${releaseIds[index]}`,
    status: result.status,
    data: result.status === "fulfilled" ? result.value.data : null,
    error: result.status === "rejected" ? result.reason : null,
  }));
};

export const bulkAllocateTestCasesToReleases = async (
  testCaseIds: (string | number)[],
  releaseId: string | number,
): Promise<any> => {
  if (!Number.isFinite(Number(releaseId))) {
  throw new Error(`Invalid releaseId: ${releaseId}`);
}
  // const response = await apiClient.post(
  //   ENDPOINTS.releaseTestCase(Number(releaseId)),
  //   { testCaseIds: testCaseIds.map(Number) },
  //   { params: { skipDuplicates: true } },
  // );

  const response = await apiClient.post(
  ENDPOINTS.releaseTestCase(Number(releaseId)),
  {
    releaseId: Number(releaseId),
    testCaseIds: testCaseIds.map(Number),
  },
  { params: { skipDuplicates: true } },
);
  return response.data;
};

export const getReleaseTestCasesByFiltersGroup = async (params: {
  releaseId: number;
  moduleId: number;
  subModuleId: number;
}): Promise<any> => {
  const response = await apiClient.get(
    ENDPOINTS.releaseTestCase(params.releaseId),
    {
      params: {
        moduleId: params.moduleId,
        subModuleId: params.subModuleId,
      },
    },
  );

  const responseData = response.data;

  console.log("Release Test Case API Response:", responseData);
  console.log("FIRST TEST CASE:", list[0]);

console.log("ASSIGN TO:", list[0]?.assignToName);
console.log("ASSIGN TO ID:", list[0]?.assignToId);
console.log("DEFECT ID:", list[0]?.defectId);
console.log("PRIORITY:", list[0]?.priorityName);

  const list = Array.isArray(responseData)
  ? responseData
  : responseData?.data?.content ||
    responseData?.content ||
    responseData?.data ||
    [];

  console.log("Release Test Case List:", list);

  return {
    status: "success",
    data: list.map((tc: any) => ({
      id: tc.releaseTestCaseId,
      releaseTestCaseId: tc.releaseTestCaseId,

      testCaseId: tc.testCaseId,

      description: tc.description || "-",
      steps: tc.testSteps || "",

      type: tc.defectTypeName || "-",
      severity: tc.severityName || "-",
      priority: tc.priorityName || "-",

      moduleId: tc.moduleId,
      module: tc.moduleName || "-",

      subModuleId: tc.subModuleId,
      subModule: tc.subModuleName || "-",

      defectTypeId: tc.defectTypeId,
      defectTypeName: tc.defectTypeName || "-",

      severityId: tc.severityId,
      severityName: tc.severityName || "-",

      priorityId: tc.priorityId,
      priorityName: tc.priorityName || "-",

      passOrFail: tc.passOrFail,
      benchAllocationId: tc.benchAllocationId,

      defectId: tc.defectId,
      assignToId: tc.assignToId,
      assignToName: tc.assignToName,

      status: tc.status,
    })),
  };
};

export const getQaAllocationSummary = async (
  qaEngineerIds: string,
): Promise<any> => {
  return {
    status: "success",
    data: {
      allocationSummary: {
        totalAllocated: 10,
        qaEngineerCount: 2,
        remaining: 5,
        qaEngineers: [
          { id: 1, name: "QA User 1", testCases: 5 },
          { id: 2, name: "QA User 2", testCases: 5 },
        ],
      },
    },
    statusCode: 200,
  };
};

export const getQaEngineerTestCases = async (params: any): Promise<any> => {
  return {
    status: "success",
    data: [
      {
        id: 1,
        testCaseId: "TC-01",
        description: "Demo test case",
        steps: "Steps...",
        type: "Functional",
        severity: "High",
      },
    ],
    statusCode: 200,
  };
};

export const getDefectTestCaseCounts = async (
  releaseId: string | number,
): Promise<any> => {
  return {
    status: "success",
    data: [
      {
        testId: 1,
        testCaseId: "TC-01",
        defectId: "DEF-01",
        assignedTo: "Dev User 1",
        priority: "High",
      },
    ],
    statusCode: 200,
  };
};

export const getAvailableQAEmployees = async (
  releaseId: number,
  testcaseId: number,
) => {
  const response = await apiClient.get(
    ENDPOINTS.releaseTestCaseAvailableEmployees(
      releaseId,
      testcaseId,
    ),
  );

  return response.data;
};

export const assignQAEmployee = async (
  releaseId: number,
  testcaseId: number,
  employeeId: number,
) => {
  const response = await apiClient.post(
    ENDPOINTS.releaseTestCaseQaAssign(
      releaseId,
      testcaseId,
    ),
    {
      employeeId,
    },
  );

  return response.data;
};

export const getReleaseTestCases = async (
  releaseId: number
) => {
  const response = await apiClient.get(
    ENDPOINTS.releaseTestCase(releaseId)
  );

  return Array.isArray(response.data)
    ? response.data
    : response.data?.data?.content || [];
};

