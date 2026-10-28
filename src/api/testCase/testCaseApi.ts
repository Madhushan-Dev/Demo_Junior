import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface TestCase {
  
  testCaseId: number;
  testCaseName: string;
  description: string;
  testSteps: string;

  projectId: number;
  projectName: string;

  moduleId: number;
  moduleName: string;

  subModuleId: number;
  subModuleName: string;

  severityId: number;
  severityName: string;

  defectTypeId: number;
  defectTypeName: string;
}



export interface GetTestCaseResponse {
  status: string;
  message: string;
  data: {
    content: TestCase[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  };
}

export async function getTestCasesByProject(
  projectId: string | number,
  page: number = 0,
  size: number = 1000,
) {
  try {
    const response = await apiClient.get(
      `/project/${Number(projectId)}/testcase`,
      {
        params: {
          page,
          size,
        },
      },
    );

    console.log("PROJECT TEST CASE RESPONSE:", response.data);

    const list =
      response.data?.data?.content ||
      response.data?.data ||
      response.data ||
      [];

    console.log("PROJECT TEST CASE LIST:", list);

    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Project test case API error:", error);
    return [];
  }
}

// export async function getTestCasesByProjectAndModule(
//   projectId: string | number,
//   moduleId: string | number,
//   page: number = 0,
//   size: number = 1000,
// ) {
//   try {
//     const response = await apiClient.get(
//       `/project/${Number(projectId)}/module/${Number(moduleId)}/testcase`,
//       {
//         params: {
//           page,
//           size,
//         },
//       },
//     );

//     console.log(
//       "PROJECT + MODULE TEST CASE RESPONSE:",
//       response.data,
//     );

//     const pageData = response.data?.data;

//     const list = pageData?.content || [];

//     console.log(
//       "PROJECT + MODULE TEST CASE LIST:",
//       list,
//     );

//     return Array.isArray(list) ? list : [];
//   } catch (error) {
//     console.error(
//       "Project + Module test case API error:",
//       error,
//     );

//     throw error;
//   }
// }

export const getTestCasesByProjectAndSubmodule = async (
  projectId: string | number,
  moduleId: string | number,
  subModuleId: string | number,
  // releaseId: string | number,
  page: number = 0,
  size: number = 10000,
): Promise<any[]> => {
  try {
    const response = await apiClient.get(
      ENDPOINTS.testCaseBySubModule(
        Number(projectId),
        Number(moduleId),
        Number(subModuleId),
      ),
      {
        params: {
          // releaseId: Number(releaseId),
          page,
          size,
        },
      },
    );

    const pageData = response.data?.data;

    const list = pageData?.content || [];

    console.log("TEST CASE GET RESPONSE:", response.data);
    console.log("TEST CASE LIST:", list);
    console.log("TOTAL ELEMENTS:", pageData?.totalElements);
    console.log("TOTAL PAGES:", pageData?.totalPages);
    console.log("CURRENT PAGE:", pageData?.number);
    console.log("PAGE SIZE:", pageData?.size);

    const arr = Array.isArray(list) ? list : [];

    // Keep pagination information on the returned array
    (arr as any).totalPages = pageData?.totalPages ?? 1;

    (arr as any).totalElements =
      pageData?.totalElements ?? arr.length;

    (arr as any).isServerPaginated = true;

    return arr;
  } catch (error) {
    console.error("Test case API error:", error);
    throw error;
  }
};

export async function deleteTestCase(
  projectId: number,
  moduleId: number,
  subModuleId: number,
  testCaseId: string | number,
) {
  try {
    const response = await apiClient.delete(
      ENDPOINTS.testCaseById(
        Number(projectId),
        Number(moduleId),
        Number(subModuleId),
        Number(testCaseId),
      ),
    );

    return response.data;
  } catch (error) {
    console.error("Delete test case API error:", error);
    throw error;
  }
}

export async function getTestCasesByProjectAndModule(
  projectId: string | number,
  moduleId: string | number,
  page: number = 0,
  size: number = 1000000,
) {
  try {
    const response = await apiClient.get(
      `/project/${projectId}/module/${moduleId}/testcase`,
      {
        params: { page, size },
      },
    );
    const list =
      response.data?.data?.content ||
      response.data?.data ||
      response.data ||
      [];
    const arr = Array.isArray(list) ? list : [];
    (arr as any).totalPages =
      response.data?.data?.totalPages ?? response.data?.totalPages ?? 1;
    (arr as any).totalElements =
      response.data?.data?.totalElements ??
      response.data?.totalElements ??
      arr.length;
    (arr as any).isServerPaginated = !!(
      response.data?.data?.totalPages !== undefined ||
      response.data?.totalPages !== undefined
    );
    return arr;
  } catch (error) {
    return [];
  }
}

export async function getTestCasesByBulkModules(
  projectId: string | number,
  moduleIds: number[],
) {
  try {
    const allTestCases: any[] = [];

    for (const moduleId of moduleIds) {
      const response = await apiClient.get(
        `/module/${moduleId}/testcase?page=0&size=1000000`,
      );

      const list =
        response.data?.data?.content ||
        response.data?.data ||
        response.data ||
        [];

      if (Array.isArray(list)) {
        allTestCases.push(...list);
      }
    }

    return allTestCases;
  } catch (error) {
    return [];
  }
}

// export async function getTestCasesByBulkSubmodules(
//   projectId: string | number,
//   submoduleIds: number[],
// ) {
//   try {
//     const allTestCases: any[] = [];

//     for (const subModuleId of submoduleIds) {
//       const response = await getTestCasesByProjectAndSubmodule(
//         String(projectId),
//         String(subModuleId),
//       );

//       if (Array.isArray(response)) {
//         allTestCases.push(...response);
//       }
//     }

//     return allTestCases;
//   } catch (error) {
//     return [];
//   }
// }
export async function filterTestCases(
  projectId: number,
  moduleId: number,
  subModuleId: number,
  description?: string,
  defectTypeId?: number,
  severityId?: number,
) {
  try {
    const response = await apiClient.get(
      `/project/${projectId}/module/${moduleId}/submodule/${subModuleId}/testcase/filter`,
      {
        params: {
          description: description || undefined,
          defectTypeId: defectTypeId || undefined,
          projectId,
          moduleId,
          subModuleId,
          severityId: severityId || undefined,
        },
      },
    );

    console.log("FILTER TEST CASE RESPONSE:", response.data);

    const list =
      response.data?.data?.content ||
      response.data?.data ||
      response.data ||
      [];

    console.log("FILTER TEST CASE LIST:", list);
    console.log("FILTER FIRST TEST CASE:", list[0]);
    console.log(
      "FILTER FIRST TEST CASE ID:",
      list[0]?.testCaseId,
    );

    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Filter test case API error:", error);
    throw error;
  }
}

export const getAvailableTestCasesForRelease = async (
  releaseId: string | number,
  projectId: string | number,
  moduleId: string | number,
  subModuleId: string | number,
): Promise<any[]> => {
  const response = await apiClient.get(
    ENDPOINTS.releaseTestCaseAvailable(
      Number(releaseId),
    ),
    {
      params: {
        projectId: Number(projectId),
        moduleId: Number(moduleId),
        subModuleId: Number(subModuleId),
      },
    },
  );

  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
};

export async function getTestCasesByProjectAndModuleExternal(
  projectId: string | number,
  moduleId: string | number,
) {
  return [];
  
}

