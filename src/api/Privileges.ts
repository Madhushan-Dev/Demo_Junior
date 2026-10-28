import ENDPOINTS from "../utils/endpoints";

import apiClient from "../lib/api.ts";

interface Permission {
  permissionId: number;
  action: string;
  description: string | null;
}

export type PermissionId = number | string;

export interface ModulePermission {
  module: string;
  permissions: Permission[];
}

export interface GetPrivilegesResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: ModulePermission[];
}

export interface PermissionAssignmentChange {
  permissionId: string;
  isAssigned: boolean;
}

export interface EmployeePermissionUpdatePayload {
  permissionIds: number[];
}

export interface RolePermissionResponse {
  status: string;
  statusCode: number | string;
  statusMessage: string;
  data: {
    permissionIds: number[];
    messages: string[];
  };
}

export interface UserPrivilegeResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: {
    module: string;
    permissions: {
      permissionId: number;
      action: string;
      description: string | null;
      checked: boolean;
      inheritedFromRole: boolean;
    }[];
  }[];
}

export interface RolePermissionByRoleResponse {
  permissionIds: PermissionId[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizePermissionIds = (value: unknown): PermissionId[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is PermissionId =>
      typeof item === "string" || typeof item === "number",
  );
};

const readPermissionIds = (payload: unknown): PermissionId[] => {
  if (!isRecord(payload)) return [];

  if ("permissionIds" in payload) {
    return normalizePermissionIds(payload.permissionIds);
  }

  if ("data" in payload) {
    const data = payload.data;
    if (isRecord(data) && "permissionIds" in data) {
      return normalizePermissionIds(data.permissionIds);
    }
  }

  return [];
};

export const getAllPrivileges = async (): Promise<GetPrivilegesResponse> => {
  const response = await apiClient.get(ENDPOINTS.permission);
  return response.data;
};

export const getRolePermission = async (
  roleId: number,
): Promise<RolePermissionResponse> => {
  const response = await apiClient.get(
    ENDPOINTS.rolePermissionMatrixByRoleId(roleId),
  );
  return response.data;
};

export const getRolePermissionByRoleId = async (
  roleId: number | string,
): Promise<RolePermissionByRoleResponse> => {
  const response = await apiClient.get(
    ENDPOINTS.rolePermissionMatrixByRoleId(Number(roleId)),
  );
  return {
    permissionIds: readPermissionIds(response.data),
  };
};

export const addRolePermission = async (
  roleId: number,
  rolePermissions: PermissionAssignmentChange[],
): Promise<RolePermissionResponse> => {
  const response = await apiClient.post(
    ENDPOINTS.rolePermissionMatrixByRoleId(roleId),
    rolePermissions,
  );
  return response.data;
};

export const getAllEmployeePermission = async (
  employeeId: number,
): Promise<UserPrivilegeResponse> => {
  const response = await apiClient.get(
    ENDPOINTS.employeePermission(employeeId),
  );
  return response.data;
};

export const addEmployeePermission = async (
  employeeId: number,
  payload: EmployeePermissionUpdatePayload,
): Promise<UserPrivilegeResponse> => {
  const response = await apiClient.post(
    ENDPOINTS.employeePermission(employeeId),
    payload,
  );
  return response.data;
};
