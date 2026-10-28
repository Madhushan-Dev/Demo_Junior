import { filterTestCases } from "../../api/testCase/testCaseApi";
const data = await filterTestCases(
  Number(selectedProjectId),
  Number(selectedModuleId),
  Number(selectedSubmoduleId),
  searchFilters.description || undefined,
  searchFilters.typeId
    ? Number(searchFilters.typeId)
    : undefined,
  searchFilters.severityId
    ? Number(searchFilters.severityId)
    : undefined,
);
const mappedSearchResults = (data as any[]).map((tc: any) => ({
  ...tc,

  id: tc.testCaseId,
  testCaseId: tc.testCaseId,
  testcaseNo: String(tc.testCaseId),

  description: tc.description,
  steps: tc.testSteps ?? "",

  moduleId: tc.moduleId,
  module: tc.moduleName || "",

  subModuleId: tc.subModuleId,
  subModule: tc.subModuleName || "",

  severity: tc.severityName || "",

  type: tc.defectTypeName || "",
}));

console.log("MAPPED SEARCH RESULTS:", mappedSearchResults);

console.log(
  "MAPPED SEARCH FIRST ID:",
  mappedSearchResults[0]?.testCaseId,
);
setSearchResults(mappedSearchResults);
setClientFilteredResults(mappedSearchResults