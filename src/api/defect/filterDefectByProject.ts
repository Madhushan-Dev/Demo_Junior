import apiClient from "../../lib/api";
//import { FilteredDefect } from "../../types";
import ENDPOINTS from "../../utils/endpoints";

export interface FilteredDefect {
  id: number;
  projectDefectNumber: number;
  defectId: string;
  description: string;
  steps: string;
  stepsToRecreation?: string;
  moduleId?: number;
  subModuleId?: number;
  severityId?: number;
  priorityId?: number;
  statusId?: number;
  defectTypeId?: number;
  releaseId?: number;
  isAddTestCase?: boolean;
  testCaseId?: number;
  module_name?: string;
  sub_module_name?: string;
  severity_name?: string;
  priority_name?: string;
  defect_status_name?: string;
  defect_type_name?: string;
  release_name?: string;
  project_name?: string;
  assigned_to_name?: string;
  assigned_by_name?: string;
  assigned_to_id?: number;
  assigned_by_id?: number;
  attachment?: string | null;
  reOpenCount?: number;
  release_test_case_description?: string;
  commentsCount?: number;
  name?: string;
}
export interface DefectResponseDTO {
  defectId: number;
  briefDescription: string;
  steps: string;
  attachmentImage: string | null;
  testCaseRequired: boolean;
  ProjectDefectNumber: number;
  moduleId: number;
  moduleName: string;

  subModuleId: number;
  subModuleName: string;

  defectTypeId: number;
  defectTypeName: string;

  releaseId: number;
  releaseName: string;

  severityId: number;
  severityName: string;

  priorityId: number;
  priorityName: string;

  statusTypeId: number;
  statusName: string;

  projectId: number;
  projectName: string;

  assignTo: string;
  enterBy: string;
}
export interface ResponseWrapper<T> {
  statusCode: number;
  statusMessage: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export async function getDefectsByProjectId(
  projectId: number,
  page: number = 0,
  size: number = 10,
): Promise<PageResponse<DefectResponseDTO>> {
  const response = await apiClient.get<
    ResponseWrapper<PageResponse<DefectResponseDTO>>
  >(ENDPOINTS.defectByProject(projectId), {
    params: {
      page,
      size,
    },
  });
  return response.data.data;
}

export interface DefectFilterParams {
  projectId: number | string;
  statusTypeId?: number[];
  severityId?: number[];
  priorityId?: number[];
  defectTypeId?: number;
  moduleId?: number;
  subModuleId?: number;
  releaseId?: number;
  search?: string;
}

// Backend contract: GET /defect/filter?projectId=&statusTypeId=&severityId=
// &priorityId=&defectTypeId=&moduleId=&subModuleId=&search=&page=&size=
export async function filterDefects(
  filters: DefectFilterParams,
  page: number = 0,
  size: number = 10,
): Promise<unknown> {
  const params: Record<string, string | number> = {
    page,
    size,
    projectId: filters.projectId,
  };

    if (filters.statusTypeId && filters.statusTypeId.length > 0) params.statusTypeId = filters.statusTypeId.join(",");
  if (filters.severityId && filters.severityId.length > 0) params.severityId = filters.severityId.join(",");
  if (filters.priorityId && filters.priorityId.length > 0) params.priorityId = filters.priorityId.join(",");
  if (filters.defectTypeId !== undefined) params.defectTypeId = filters.defectTypeId;
  if (filters.moduleId !== undefined) params.moduleId = filters.moduleId;
  if (filters.subModuleId !== undefined) params.subModuleId = filters.subModuleId;
  if (filters.releaseId !== undefined) params.releaseId = filters.releaseId;
  if (filters.search) params.search = filters.search;

  const response = await apiClient.get(ENDPOINTS.defectFilter, { params });

  return response.data;
}

export async function filterDefectsForTest(filters: {
  projectId: string | number;
  releaseId?: number;
}): Promise<FilteredDefect[]> {
  const projectId = Number(filters.projectId);

  const params: any = {
    page: 0,
    size: 1000000,
  };

  if (filters.releaseId) {
  params.releaseId = filters.releaseId;
}

const response = await apiClient.get(
  ENDPOINTS.defectByProject(projectId),
  {
    params,
  }
);

const data = response.data?.data?.content || [];
  return Array.isArray(data) ? data : [];
}

