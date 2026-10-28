const ENDPOINTS = {
  designationEmployee: (designationId: number) =>
    `/designation/${designationId}/employee`,

  designationCreate: "/Designation/createdesignation",

  designationPagination: (page: number, size: number) =>
    `/Designation/getAll?page=${page}&size=${size}`,

  designationById: (id: number) => `/Designation/get/${id}`,

  designationUpdate: (id: number) => `/Designation/update/${id}`,

  designationDelete: (id: number) => `/Designation/delete/${id}`,

  role: (page: number, size: number) =>
    `/role?page=${page}&size=${size}&direction=DESC&sort=id`,
  roleById: (id: number) => `/role/${id}`,
  roleUpdate: (id: number) => `/Role/update/${id}`,
  roleDelete: (id: number) => `/Role/delete/${id}`,

  permission: "/permission",
  permissionById: (id: number) => `/permission/${id}`,

  defectType: "/defecttype/create",
  defectTypeById: (id: number) => `/defecttype/delete/${id}`,

  defectTypePagination: (page: number, size: number) =>
    `/defecttype/getAll?page=${page}&size=${size}`,
  updateDefectType: (id: number) => `/defecttype/${id}`,
  updatebyid: (defectTypeId: number) => `/defecttype/update/${defectTypeId}`,

  releaseType: "/release_types",
  releaseTypeById: (id: number) => `/release_types/${id}`,
  releaseTypePagination: (page: number, size: number) =>
    `/release_types?page=${page}&size=${size}`,
  releaseTestCaseAvailable: (releaseId: number) =>
  `/release-test-cases/release/${releaseId}/available-test-cases`,

  severity: "/severity",
  severityPagination: (page: number = 0, size: number = 4) =>`/severity?page=${page}&size=${size}`,
  severityById: (id: number) => `/severity/${id}`,

  priority: "/priority",
  priorityPagination: (page: number = 0, size: number = 5) =>`/priority/view?page=${page}&size=${size}`,
  priorityById: (id: number) => `/priority/${id}`,

  priorityView: "/priority/view",

  priorityUpdate: (id: number) => `/priority/update/${id}`,
  priorityDelete: (id: number) => `/priority/delete/${id}`,

  createStatusType: "/status-type",

  updateStatusType: (id: number) => `/status-type/${id}`,
  deleteStatusType: (id: number) => `/status-type/${id}`,
  statusTypePagination: (page: number = 0, size: number = 5) =>
    `/status-type?page=${page}&size=${size}`,
  statusTypeById: (id: number) => `/status-type/${id}`,

  workflowNextStatus: (id: number) => `/status/${id}/next`,
  workflow: "/status/workflow",
  workflowById: (id: number) => `/status/workflow/${id}`,
  workflowDeleteAll: "/status/workflow/deleteAll",
  workflowStart: "/status/workflow/start",
  WORKFLOW_POSITION: "/status/workflow-position",

employee: "/Employee/createEmployee",
employeeById: (id: number) => `/Employee/${id}`,  //do not delete please
employeeStatus: (id: number) => `/Employee/status/${id}`,
getallemployees: () => `/Employee/view/paged`,
employeeDelete: (empId: number) => `/Employee/DeleteEmployee/${empId}`,
employeeUpdate: (id: number) => `/Employee/update/${id}`,
employeeSearch: "/Employee/search",

  rolePermissionMatrix: "/assign-permission/matrix",
  rolePermissionMatrixByRoleId: (roleId: number) =>`/assign-permission/matrix/${roleId}`,

  login: "/auth/login",
  changePassword: "/auth/change-password",
  forgetPassword: "/auth/forget-password",
  resetPassword: "/auth/reset-password",
  validateResetToken: "/auth/validate-reset-token", //for validating the reset token before allowing the user to reset their password
  logout: "/auth/log-out",
  refreshToken: "/auth/refresh-token",
  employeePermission: (employeeId: number) =>
    `/employee/${employeeId}/permission`,

  project: "/project",
  projectById: (id: number) => `/project/${id}`,
  availableManagers: (designationId: number) =>
    `/Designation/${designationId}/employee`,
  availableManagersForUpdate: (designationId: number, projectId: number) =>
    `/Designation/${designationId}/employee`,
  projectdelete: (id: number) => `/project/${id}`,

  
  module: (projectId: number) => `/project/${projectId}/module`,
  updateModule: (projectId: number,moduleId: number) => `/project/${projectId}/module/${moduleId}`,
  deleteModule: (moduleId: number, projectId: number) => `/project/${projectId}/module/${moduleId}`,
  //getModuleById: (moduleId: number) => `/module/viewmodule/${moduleId}`,
  //getmodule: (projectId: number) => `module/project/${projectId}/getmodule`,

subModule: (moduleId: number) => `/module/module/${moduleId}`,

subModuleById: (moduleId: number, id: number) =>
  `/module/${moduleId}/sub-module/${id}`,

subModuleBulk: () => "/subModule/bulk-by-modules",

subModuleDev: (moduleId: number, submoduleId: number) =>
  `/module/${moduleId}/sub-module/${submoduleId}/employee`,
getProjectDefectDevelopers: (projectId: number) =>
  `/project/${projectId}/defect/developers`,


subModuleAvailableEmployees: (
  moduleId: number,
  subModuleId: number,
) =>
  `/module/${moduleId}/sub-module/${subModuleId}/available-employees`,
  
moduleAvailableQAs: (moduleId: number) =>`/module/${moduleId}/available-qas`,


subModuleDevDelete: (
  moduleId: number,
  submoduleId: number,
  employeeId: number
) =>
  `/module/${moduleId}/sub-module/${submoduleId}/employee/${employeeId}`,

benchAllocationByProject: (projectId: number) =>
  `/bench-allocation/${projectId}/project`,

  //projectAllocation: "/project-allocation",
   projectAllocation: "/bench-allocation",

    bench_allocation_update:(id: number) => `/bench-allocation/${id}`,

    projectAllocationExtend: (benchAllocationId: number) =>
      `/project-allocation/${benchAllocationId}`,

  projectAllocationProjectEmployee: (projectId: number) =>
    `/bench-allocation/${projectId}/project`,

  projectAllocationProjectEmployeeHistory: (projectId: number) =>
    `/bench-allocation/${projectId}/employee-history`,

  projectAllocationByEmployee: (empId: number) =>
    `/bench-availability-view/employee/${empId}`,

  projectAllocationDeallocate: (id: number) =>
    `/bench-allocation/${id}/deallocate`,
benchEmployee:(
   page: number = 0, size: number = 5) => `/bench-availability-view?page=${page}&size=${size}`,

  testCaseBySubModule: (
  projectId: number,
  moduleId: number,
  subModuleId: number,
) =>
  `/project/${projectId}/module/${moduleId}/submodule/${subModuleId}/testcase`,

testCaseFilter: (
  projectId: number,
  moduleId: number,
  subModuleId: number,
) =>
  `/project/${projectId}/module/${moduleId}/submodule/${subModuleId}/testcase/filter`,

  testCaseById: (
  projectId: number,
  moduleId: number,
  subModuleId: number,
  testCaseId: number
) =>
  `/project/${projectId}/module/${moduleId}/submodule/${subModuleId}/testcase/${testCaseId}`,

testCaseAll: "/testcase",

  testCaseBulkBySubModule: (subModuleId: number) =>
    `/sub-module/${subModuleId}/testcase/bulk`,
  testCaseBulkImport: (projectId: number) =>
  `/project/${projectId}/bulk-import`,
  testCaseBulkAll: "/testcase/bulk",
  testCaseBulkExport: (projectId: number) =>
  `/project/${projectId}/bulk-export`,

  release: "/release",

 releaseTestCaseCount: (releaseId: number) =>
  `/release-test-cases/release/${releaseId}/test-case/count`,
 
  releaseById: (id: number) => `/release/${id}`,
  releaseStatus: (releaseId: number) =>
  `/release-test-cases/release/${releaseId}/status`,
  releaseActiveByProject: (projectId: number) =>
    `/project/${projectId}/release/active`,
  releaseKloc: (id: number) => `/release/${id}`,
  releaseKlocById: (releaseId: number) => `/release/${releaseId}/kloc`,
  projectKloc: (projectId: number) =>
    `/project/${projectId}/kloc`,
  gitKloc: (projectId: number) =>
`/project/${projectId}/calculate-kloc`,
  //gitKloc: "/kloc",


  releaseView: "/ReleaseView",
  releaseViewCreate: "/ReleaseView/save",
  releaseViewByProject: (projectId: number) =>
    `/ReleaseView/project/${projectId}`,
  updateReleaseView: (id: number) => `/ReleaseView/update/${id}`,
  deleteReleaseView: (id: number) => `/ReleaseView/delete/${id}`,

releaseTestCase: (releaseId: number) =>
  `/release-test-cases/release/${releaseId}/test-case`, 
 releaseTestCaseById: (releaseId: number, id: number) =>
    `/release/${releaseId}/test-case/${id}`,
  releaseTestCaseQaAssign: (releaseId: number, testcaseId: number) =>
    `/release-test-cases/release/${releaseId}/test-case/${testcaseId}/employee`,
  releaseTestCaseQaAllocation: (releaseId: number) =>
    `/release-test-cases/release/${releaseId}/test-case-qa-allocation`,
  releaseTestCaseEmployeePatch: (releaseId: number, employeeId: number) =>
    `/release-test-cases/release/${releaseId}/test-case/employee/${employeeId}`,
  releaseTestCaseStatus: (releaseId: number, id: number) =>
    `/release-test-cases/release/${releaseId}/test-case/${id}/status`,
  testCaseAllocationLog: "/test-case/allocation-log",

releaseViewsByProject: (projectId: number | string) =>
  `/ReleaseView/project/${projectId}`,

updateReleaseTestCaseStatus: (id: number) =>
  `/ReleaseTestCase/${id}/status`,

  releaseTestCaseAvailableEmployees: (
  releaseId: number,
  testcaseId: number,
) =>
  `/release/${releaseId}/test-case/${testcaseId}/employees`,

  
  emailConfig: "/email-config",
  emailConfigCreate: "/email-config/create",

  emailConfigById: (id: number) => `/email-config/${id}`,
  emailConfigUpdate: (id: number) => `/email-config/${id}`,
  emailConfigSend: (id: number) => `/email-config/${id}/send`,
  emailConfigToggle: (id: number) => `/email-config/${id}/toggle`,
  emailConfigDelete: (id: number) => `/email-config/${id}`,

  emailPointSetup: "/email-templates",
  emailPointSetupEnable: (id: number) => `/email/point-setup/${id}/enable`,

  emailRecipientsRoleMatrix: "/email/recipients/role/matrix",
  emailRecipientsEmployee: (employeeId: number) =>
    `/email/recipients/employee/${employeeId}`,

  emailSent: "/email/sent",
  roleAssignedPoints: (roleId: number) => `/role/${roleId}/assigned-points`,
  roleNotificationUpdate: "/role-notifications/update",

  userExtraPoints: (userId: number) => `${userId}`,
  userExtraRulesUpdate: "/user/extra-rules/update",
  getAlluserPreferences: (userId: number) => `/user-based-preferences`,
  //userNotificationUpdate: "/user-notifications/update",


  emailTemplate: "/email-templates",
  emailTemplateById: (id: number) => `/email-templates/${id}`,
  emailTemplateReset: (id: number) => `/email-templates/${id}/reset`,
  emailTemplateVariable: (templateId: number) =>
    `/email/template/${templateId}/variable`,

  emailLog: "/email/log",
  deletedefect: "/defect/delete",
  defect: "/defect/save",
  defectById: (defectId: number) => `/defect/${defectId}`,
  updatedefect:"/defect/put",
  defectByProject: (projectId: number) => `defect/project/${projectId}`,
  defectAssignDev: "/defect/employee",
  defectFilter: "/defect/filter",
  defectAllocation: (id: number) => `/defect/allocation/defect/${id}`,
  defectStatus: (defectId: number) => `/defect/${defectId}/status`,
  defectSeverityBreakdown: (projectId: number) =>
    `/project/${projectId}/defect/severity-breakdown`,
  defectBulkImport: "/defect/bulk",
  defectBulkExport:  
  `/defect/export`,

  defectComment: (defectId: number) => `/defect/${defectId}/comment`,
  defectCommentBtId: (defectId: number) => `/defect/${defectId}/comment`,

  defectStatusLog: (projectId: number, releaseId: number) =>
    `/project/${projectId}/release/${releaseId}/defect-status-log`,
defectByModules: (projectId: number) => `/defect/module-summary/${projectId}`,
  defectByType: (projectId: number) => `/project/${projectId}/dashboard/defect-type`,
  defectCountByCreated: (projectId: number, releaseId: number) =>
    `/project/${projectId}/release/${releaseId}/defect-created/count`,
  defectFixedCount: (projectId: number, releaseId: number) =>
    `/project/${projectId}/release/${releaseId}/defect-fixed/count`,
  defectDensity: (projectId: number) => `/project/${projectId}/defect-density`,

  dashboard: (projectId: number, releaseId: number) =>
    `/project/${projectId}/release/${releaseId}/dashboard`,
  dashboardReopenedByProject: (projectId: number) =>
    `/project/${projectId}/dashboard/reopened-summary`,

  dashboardTimeToFind: (projectId: number, releaseId: number) =>
    `/project/${projectId}/release/${releaseId}/dashboard/time-to-find`,
  dashboardTimeToFix: (projectId: number, releaseId: number) =>
    `/project/${projectId}/release/${releaseId}/dashboard/time-to-fixed`,

  dashboardTimeToFindAll: (projectId: number) =>
  `/project/${projectId}/dashboard/time-to-find`,

 dashboardTimeToFixAll: (projectId: number) =>
  `/project/${projectId}/dashboard/time-to-fixed`,
  //moduleEmployee: (moduleId: number) => `/module/${moduleId}/employee`,

  //benchEmployee: "/bench",
  ALLOCATE_MODULE_LEADER: "/allocate-module-leader",
  //DEALLOCATE_MODULE_LEADER: (moduleId: number,employeeId:number) =>`/module/${moduleId}/employee/${employeeId}`,
  
// benchEmployee: "/bench",    //Show Bench Employee -right
GET_PROJECT_ALLOCATED_EMPLOYEES: (projectId: number) => `/project-allocation/${projectId}/employees`,
 //moduleEmployee: (moduleId: number) => `/module/${moduleId}/employee`,
  moduleEmployeeAssign: (moduleId: number, employeeId: number) =>`/module/${moduleId}/employee/${employeeId}`,    //to allocate-post
  GET_MODULE_ALLOCATED_LEADER: (moduleId: number) =>`/module/${moduleId}/employee`,                              //after allocated it will show-left
  moduleEmployeeDelete: (moduleId: number, employeeId: number) =>`/module/${moduleId}/employee/${employeeId}`,
  DEALLOCATE_MODULE_LEADER:(moduleId: number, employeeId: number) =>`/module/${moduleId}/employee/${employeeId}`,
   moduleEmployee: (moduleId: number) => `/module/${moduleId}/employee`,


  //`module/${moduleId}/employee/${employeeId}



  currentUserPermissions: "/user/me/permissions",
  currentUserProjects: "/user/me/projects",
  currentUserProjectPermissions: (projectId: number) =>
    `/user/me/projects/${projectId}/permissions`,
  DEFECT_BULK_REASSIGN: "/defect/bulk-reassign",
};
export default ENDPOINTS;
