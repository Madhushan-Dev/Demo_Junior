import apiClient from "../../lib/api";

export interface DefectHistoryEntry {
  id: number;
  defectId: number;
  assignedByName: string;
  assignedToName: string;
  previousStatus: string;
  defectStatus: string;
  name: string;
  defectDate: string;
  releaseName:string;
  defectTime: string;
  createdBy: string;
  updatedBy: string;
}

export async function getDefectHistoryByDefectId(
  defectId: string | number,
): Promise<DefectHistoryEntry[]> {
  const response = await apiClient.get(`/defect/${defectId}/history`);

  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export const getDefectHistory = getDefectHistoryByDefectId;
