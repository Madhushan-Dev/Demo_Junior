import ENDPOINTS from "../../utils/endpoints";
import apiClient from "../../lib/api";

export interface DefectByModule {
  name: string;
  value: number;
  percentage?: number;
}

export interface DefectsByModuleResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: DefectByModule[];
}

export async function getDefectsByModule(
  projectId: number,
): Promise<DefectsByModuleResponse> {
  const response = await apiClient.get(ENDPOINTS.defectByModules(projectId));

  const rawData: any[] = Array.isArray(response.data?.data)
    ? response.data.data
    : Array.isArray(response.data)
      ? response.data
      : [];

  const mapped: DefectByModule[] = rawData.map((item: any) => ({
    name: item.moduleName ?? item.module ?? item.name ?? "Unknown",
    value: Number(item.defectCount ?? item.count ?? item.value ?? 0),
    percentage: item.percentage ?? null,
  }));

  const total = mapped.reduce((sum, m) => sum + m.value, 0);

  const withPercentage = mapped.map((m) => ({
    ...m,
    percentage:
      m.percentage ?? (total > 0 ? (m.value / total) * 100 : 0),
  }));

  return {
    status: response.data?.status ?? "SUCCESS",
    statusCode: response.data?.statusCode ?? 200,
    statusMessage: response.data?.statusMessage ?? "OK",
    data: withPercentage,
  };
}