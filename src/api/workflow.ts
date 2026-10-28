const ENDPOINTS = {
  designation: "/designation",
  designationPagination : (page : number, size : number) =>  `/designation?page=${page}&size=${size}`,
  designationById: (id: number) => `/designation/${id}`,
  designationEmployee: (designationId: number) =>
    `/designation/${designationId}/employee`,

  role:(page :number, size: number) => `/role?page=${page}&size=${size}&direction=DESC&sort=id`,
  roleById: (id: number) => `/role/${id}`,

  permission: "/permission",
  permissionById: (id: number) => `/permission/${id}`,

  defectType: "/defect-type",
  defectTypeById: (id: number) => `/defect-type/${id}`,

  releaseType: "/release-type",
  releaseTypeById: (id: number) => `/release-type/${id}`,
  releaseTypePagination : (page:number,size:number) => `/release-type?page=${page}&size=${size}`,

  severity: "/severity",
  severityPagination: (page: number = 0, size: number = 5)=>
  `/severity?page=${page}&size=${size}`,
  severityById: (id: number) => `/severity/${id}`,

  priority: "/priority",
  priorityPagination: (page: number = 0, size: number = 5)=>
  `/priority?page=${page}&size=${size}`,
  priorityById: (id: number) => `/priority/${id}`,

  statusType: "/status-type",
  statusTypePagination: (page: number = 0, size: number = 5) =>
    `/status-type?page=${page}&size=${size}`,
  statusTypeById: (id: number) => `/status-type/${id}`,

  workflowNextStatus: (id: number) => `/status/${id}/next`,
  workflow: "/status/workflow",
  workflowById: (id: number) => `/status/workflow/${id}`,
  workflowDeleteAll: "/status/workflow/deleteAll",
  workflowStart: "/status/workflow/start",
  workflowPosition: "/status/workflow-position",

  employee: "/employee",
  employeeById: (id: number) => `/employee/${id}`,
  employeeStatus: (id: number) => `/employee/${id}/status`,

  rolePermissionMatrix: "/assign-permission/matrix",
  rolePermissionMatrixByRoleId: (roleId: number) =>
    `/assign-permission/matrix/${roleId}`,

  login: "/auth/login",
  changePassword: "/auth/change-password",
  forgetPassword: "/auth/forget-password",
  resetPassword: "/auth/reset-password",
  logout: "/auth/log-out",
  refreshToken: "/auth/refresh-token",

  employeePermission: (employeeId: number) =>
    `/employee/${employeeId}/permission`,

  project: "/project",
  projectById: (id: number) => `/project/${id}`,
  availableManagers: (designationId: number) =>
  `/designation/${designationId}/available-managers`,
availableManagersForUpdate: (designationId: number, projectId: number) =>
  `/designation/${designationId}/available-managers/project/${projectId}`,

  module: (projectId: number) => `/project/${projectId}/module`,
  moduleById: (projectId: number, id: number) =>
    `/project/${projectId}/module/${id}`,

  subModule: (moduleId: number) => `/module/${moduleId}/sub-module`,
  subModuleById: (moduleId: number, id: number) =>
    `/module/${moduleId}/sub-module/${id}`,
     subModuleBulk: () => "/subModule/bulk-by-modules",

  subModuleDev: (id: number) => `/sub-module/${id}/employee`,
  subModuleDevDelete: (moduleId: number, employeeId: number) =>
    `/sub-module/${moduleId}/employee/${employeeId}`,

  projectAllocation: "/project-allocation",
  projectAllocationExtend: (id: number) =>
    `/project-allocation/employee/${id}/extend`,
  projectAllocationProjectEmployee: (projectId: number) =>
    `/project-allocation/${projectId}/employee`,
  projectAllocationProjectEmployeeHistory: (projectId: number) =>
    `/project-allocation/${projectId}/employee_history`,
  projectAllocationByEmployee: (userId: number) =>
    `/project-allocation/employee/${userId}`,
  projectAllocationDeallocate: (id: number) =>
    `/project-allocation/employee/${id}`,

testCaseBySubModule: (subModuleId: number, description?: string, defectTypeId?: number, severityId?: number, page?: number, size?: number) => {
  let url = `/sub-module/${subModuleId}/test-case`;
  
  const queryParams: string[] = [];
  
  if (description && description.trim() !== "") {
    queryParams.push(`description=${encodeURIComponent(description)}`);
  }
  if (defectTypeId && defectTypeId > 0) {
    queryParams.push(`defectTypeId=${defectTypeId}`);
  }
  if (severityId && severityId > 0) {
    queryParams.push(`severityId=${severityId}`);
  }
  if (page && page > 0) {
    queryParams.push(`page=${page}`);
  }
  if (size && size > 0) {
    queryParams.push(`size=${size}`);
  }
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  return url;
},
  testCaseById: (subModuleId: number, id: number) =>
    `/sub-module/${subModuleId}/test-case/${id}`,
  testCaseAll: "/test-case",
  testCaseBulkBySubModule: (subModuleId: number) =>
    `/sub-module/${subModuleId}/test-case/bulk`,
  testCaseBulkAll: "/test-case/bulk",
  testCaseBulkExport: "/test-case/bulk",

  release: "/release",
  releaseCount: "/release/counts",
  releaseById: (id: number) => `/release/${id}`,
  releaseStatus: (releaseId: number) => `/release/${releaseId}/status`,
releaseActiveByProject: (projectId: number) =>
  `/project/${projectId}/release/active`,
  releaseKloc: (id: number) => `/release/${id}`,
  releaseKlocById: (releaseId: number) =>
    `/release/${releaseId}/kloc`,
  projectKloc: (projectId: number) => `/project/${projectId}/project-kilo-of-code`,
 gitKloc: "/kloc",

  releaseTestCase: (releaseId: number) =>
    `/release/${releaseId}/test-case`,
  releaseTestCaseById: (releaseId: number, id: number) =>
    `/release/${releaseId}/test-case/${id}`,
  releaseTestCaseQaAssign: (releaseId: number, testcaseId: number) =>
    `/release/${releaseId}/test-case/${testcaseId}/employee`,
  releaseTestCaseQaAllocation: (releaseId: number) =>
    `/release/${releaseId}/test-case-qa-allocation`,
  releaseTestCaseEmployeePatch: (releaseId: number, employeeId: number) =>
    `/release/${releaseId}/test-case/employee/${employeeId}`,
  releaseTestCaseStatus: (releaseId: number, id: number) =>
    `/release/${releaseId}/test-case/${id}/status`,
  testCaseAllocationLog: "/testcase/allocation-log",

  emailConfig: "/email/config",
  emailConfigById: (id: number) => `/email/config/${id}`,
  emailConfigEnable: (id: number) => `/email/config/${id}/enable`,

  emailPointSetup: "/email/point-setup",
  emailPointSetupEnable: (id: number) =>
    `/email/point-setup/${id}/enable`,

  emailRecipientsRoleMatrix: "/email/recipients/role/matrix",
  emailRecipientsEmployee: (employeeId: number) =>
    `/email/recipients/employee/${employeeId}`,

  emailSent : "/email/sent",

  roleAssignedPoints: (roleId: number) =>
  `/role/${roleId}/assigned-points`,

  roleNotificationUpdate: "/role-notifications/update",

  userExtraPoints: (userId: number) => `/user/${userId}/extra-points`,

  userExtraRulesUpdate: "/user/extra-rules/update",

emailTemplate: "/email/template",
  emailTemplateById: (id: number) => `/email/template/${id}`,
  emailTemplateReset: (id: number) => `/email/template/${id}/reset`,
  emailTemplateVariable: (templateId: number) =>
    `/email/template/${templateId}/variable`,


  emailLog: "/email/log",

  defect: "/defect",
  defectById: (defectId: number) => `/defect/${defectId}`,
  defectByProject: (projectId: number) =>
    `/project/${projectId}/defect`,
  defectAssignDev: "/defect/employee",
  defectAllocation: (id: number) => `/defect/allocation/defect/${id}`,
  defectStatus: (defectId: number) => `/defect/${defectId}/status`,
  defectSeverityBreakdown: (projectId: number) =>
    `/project/${projectId}/defect/severity-breakdown`,
  defectBulkImport: "/defect/bulk",
  defectBulkExport: "/defect/bulk",

  defectComment: (defectId: number) =>
    `/defect/${defectId}/comment`,
  defectCommentBtId: (defectId: number) =>
    `/defect/${defectId}/comment`,

  defectStatusLog: (projectId: number, releaseId: number) =>
    `/project/${projectId}/release/${releaseId}/defect-status-log`,
  defectByModules: (projectId: number) =>
    `/project/${projectId}/defect-module`,
  defectByType: (projectId: number) =>
    `/project/${projectId}/defect-type`,
  defectCountByCreated: (projectId: number, releaseId: number) =>
    `/project/${projectId}/release/${releaseId}/defect-created/count`,
  defectFixedCount: (projectId: number, releaseId: number) =>
    `/project/${projectId}/release/${releaseId}/defect-fixed/count`,
  defectDensity: (projectId: number) =>
    `/project/${projectId}/defect-density`,

  dashboard: (projectId: number, releaseId: number) =>
    `/project/${projectId}/release/${releaseId}/dashboard`,
  dashboardReopenedByProject: (projectId: number) =>
  `/project/${projectId}/dashboard/reopened`,

  dashboardTimeToFind: (projectId: number, releaseId: number) =>
  `/project/${projectId}/release/${releaseId}/dashboard/time-to-find`,
  dashboardTimeToFix: (projectId: number, releaseId: number) =>
  `/project/${projectId}/release/${releaseId}/dashboard/time-to-fixed`,
  benchEmployee: "/bench",
  ALLOCATE_MODULE_LEADER :"/allocate-module-leader",
  DEALLOCATE_MODULE_LEADER :(allocateModuleId: number) => `/allocate-module-leader/${allocateModuleId}`,
  GET_MODULE_ALLOCATED_LEADER : (moduleId: number) => `/module/${moduleId}/allocated-leader`,
  GET_PROJECT_ALLOCATED_EMPLOYEES : (projectId: number) => `/project-allocation/${projectId}/employees`,

  currentUserPermissions: "/user/me/permissions",
  currentUserProjects: "/user/me/projects",
  currentUserProjectPermissions: (projectId: number) => `/user/me/projects/${projectId}/permissions`,
  DEFECT_BULK_REASSIGN: "/defects/bulk-reassign"
};

import apiClient from "../lib/api";
//import ENDPOINTS from "../utils/endpoints";

export interface WorkflowNodeRequest {
  id: number;
  positionX: number;
  positionY: number;
}

// for the workflow position
export interface WorkFlowPosition {
  id?: number;
  statusTypeId: number;
  positionX: number;
  positionY: number;
}

export interface WorkflowConnectionRequest {
  fromStatusId: number;
  toStatusId: number;
}

export interface SaveWorkflowRequest {
  fromStatusId: number;
  toStatusId: number;
}

// export interface SaveWorkflowRequest {
//   nodes: WorkflowNodeRequest[];
//   connections: WorkflowConnectionRequest[];
// }

export interface SaveWorkflowResponse {
  status: string;
  statusMessage: string;
  data?: any;
  statusCode: number;
}

export interface StatusInfo {
  id: number;
  name: string;
  color: string;
}

export interface WorkflowTransitionResponse {
  id: number;
  fromStatus: StatusInfo;
  toStatus: StatusInfo;
}

export interface GetAllWorkflowsResponse {
  status: string;
  statusMessage: string;
  data: WorkflowTransitionResponse[];
  statusCode: number;
}

export interface NextStatusTransition {
  statusTypeId1: number;
  statusTypeId2: number;
  workflowId: number;
}

export interface NextStatusResponse {
  status: string;
  statusMessage: string;
  data: NextStatusTransition[];
  statusCode: number;
}

// GET - Fetch all workflows
export const getAllWorkflows = async (): Promise<GetAllWorkflowsResponse> => {
  const response = await apiClient.get(ENDPOINTS.workflow)
    return response.data;
};

export const deleteAllWorkflows = async (): Promise<void> => {
  await apiClient.delete(ENDPOINTS.workflowDeleteAll);
};

// // POST - Save workflow transitions
// export const saveWorkflow = async (workflowData: SaveWorkflowRequest): Promise<SaveWorkflowResponse> => {
//   const response = await apiClient.post(ENDPOINTS.workflow,workflowData)
//     console.log('API: saveWorkflow (Mocked for Demo)', workflowData);
//     return response.data;
// };

export const getStartingStatus = async (): Promise<number> => {
  const response = await apiClient.get(ENDPOINTS.workflowStart);
  return response.data.data;
};

export const getWorkFlowsByStatusTypeId = async (
  statusTypeId: number
): Promise<any[]> => {
  const response = await apiClient.get(
    ENDPOINTS.workflowById(statusTypeId)
  );

  return response.data.data;
};

export const saveWorkflow = async (
  workflowData: SaveWorkflowRequest[]
): Promise<SaveWorkflowResponse> => {
  const response = await apiClient.post(
    ENDPOINTS.workflow,
    workflowData
  );

  console.log("API: saveWorkflow", workflowData);

  return response.data;
};

export const getNextStatuses = async (
  fromStatusId: number
): Promise<NextStatusResponse> => {

  const response = await apiClient.get(
    ENDPOINTS.workflowNextStatus(fromStatusId)
  );

  console.log("Next statuses response:", response.data);

  return response.data;
};

export const saveWorkflowPositions = async (
  positions: WorkFlowPosition[]
) => {
  const response = await apiClient.post(
    ENDPOINTS.workflowPosition,
    positions
  );

  console.log("API: saveWorkflowPositions", positions);

  return response.data;
};

export const getAllWorkflowPositions = async () => {
  const response = await apiClient.get(
    ENDPOINTS.workflowPosition
  );

  console.log(
    "API: getAllWorkflowPositions",
    response.data
  );

  return response.data;
};

export const deleteAllWorkflowPositions = async () => {
  const response = await apiClient.delete(
    ENDPOINTS.workflowPosition
  );

  return response.data;
};

