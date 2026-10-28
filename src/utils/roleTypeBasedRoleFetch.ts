import apiClient from "../lib/api";

export type RoleType =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "QA_LEAD"
  | "QA_ENGINEER"
  | "DEV_LEAD"
  | "SENIOR_DEVELOPER"
  | "DEVELOPER"
  | "JUNIOR_DEVELOPER"
  | "BUSINESS_ANALYST"
  | "UI_UX_DESIGNER"
  | "DEVOPS_ENGINEER"
  | "SUPPORT_ENGINEER"
  | "CLIENT";

export interface RoleItem {
  roleId: number | string;
  roleName: string;
  roleType: RoleType | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number | string | null;
  updatedBy: number | string | null;
}

export interface RoleApiResponse {
  status: string;
  statusCode: number | string;
  statusMessage: string;
  data: {
    content: RoleItem[];
  };
}

export const roleFetch = async (): Promise<RoleApiResponse> => {
  const response = await apiClient.get<RoleApiResponse>("/Role");
  return response.data;
  //.filter((role) => role.type === role)
};

export const roleTypeBasedRoleFetch = async (
  roleType: RoleType,
): Promise<string[]> => {
  const response = await roleFetch();

  return response.data.content
    .filter((role) => role.roleType === roleType)
    .map((role) => role.roleName);
};

export const roleTypesBasedRoleFetch = async (
  roleTypes: RoleType[],
): Promise<string[]> => {
  const response = await roleFetch();

  return response.data.content
    .filter((role) => role.roleType !== null && roleTypes.includes(role.roleType))
    .map((role) => role.roleName);
};

export const roleTypeBasedRoleIdFetch = async (
  roleType: RoleType,
): Promise<number[]> => {
  const response = await roleFetch();

  return response.data.content
    .filter((role) => role.roleType === roleType)
    .map((role) => Number(role.roleId))
    .filter((id) => Number.isFinite(id));
};
