import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface ModuleEmployee {
  moduleId: number;
  employeeId?: number; 
  employee?: {
  empId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  };
}

export const assignEmployeeToModule = async (
  moduleId: number,
  employeeId: number,
) => {
  const response = await apiClient.post(
    ENDPOINTS.moduleEmployeeAssign(moduleId,employeeId),
  );

  return response.data;
};

export const getEmployeesByModule = async (
  moduleId: number,
): Promise<ModuleEmployee[]> => {
  const response = await apiClient.get(ENDPOINTS.moduleEmployee(moduleId));

  return response.data || [];
};

export const removeEmployeeFromModule = async (
  moduleId: number,
  employeeId: number,
) => {
  const response = await apiClient.delete(
    ENDPOINTS.moduleEmployeeDelete(moduleId, employeeId),
  );

  return response.data;
};
