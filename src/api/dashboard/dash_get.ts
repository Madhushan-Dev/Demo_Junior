import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface TimeToFindDefectsResponse {
  status: string;
  message: string;
  data: {
    dayNumber: number;
    totalDefects: number;
    periodStart: string;
    periodEnd: string;
  }[];
  statusCode: number;
}

export interface TimeToFixDefectsResponse {
  projectId: number;
  releaseName: string;
  dailyData: {
    label: string;
    dayNumber: number;
    defectFixedCount: number;
    timeRange: string;
  }[];
  data?: {
    label: string;
    dayNumber: number;
    defectFixedCount: number;
    timeRange: string;
  }[];
}

export async function getDefectSeveritySummary(projectId: string) {
  try {
    const response = await apiClient.get(
      ENDPOINTS.defectSeverityBreakdown(Number(projectId)),
    );

    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getReleaseDefectsDaily(
  projectId: string,
  releaseId: string,
) {
  const response = await apiClient.get(
    ENDPOINTS.dashboardTimeToFind(Number(projectId), Number(releaseId)),
  );

  return {
    status: "success",
    data: response.data.map(
      (item: { day: string; count: number }) => ({
        dayNumber: parseInt(item.day.replace("Day ", "")),
        totalDefects: item.count,
      }),
    ),
  };
}

export async function getAllDefectsDaily(projectId: string) {
  const response = await apiClient.get(
    ENDPOINTS.dashboardTimeToFindAll(Number(projectId)),
  );

  return {
    status: "success",
    data: response.data.map(
      (item: { day: string; count: number }) => ({
        dayNumber: parseInt(item.day.replace("Day ", "")),
        totalDefects: item.count,
      }),
    ),
  };
}

export async function getAllTimeToFixDefectsDaily(
  projectId: number,
) {
  const response = await apiClient.get(
    ENDPOINTS.dashboardTimeToFixAll(projectId),
  );

  const rawData = response.data || [];

  return {
    projectId,
    releaseName: "All Releases",
    dailyData: rawData.map(
      (item: { day: string; count: number }) => ({
        label: item.day,
        dayNumber: parseInt(item.day.replace("Day ", "")),
        defectFixedCount: item.count,
        timeRange: "24h",
      }),
    ),
  };
}

export async function getTimeToFixDefectsDaily(
  projectId: number,
  releaseId: number,
) {
  const response = await apiClient.get(
    ENDPOINTS.dashboardTimeToFix(projectId, releaseId),
  );

  const rawData = response.data || [];

  return {
    projectId,
    releaseName: "",
    dailyData: rawData.map((item: { day: string; count: number }) => ({
      label: item.day,
      dayNumber: parseInt(item.day.replace("Day ", "")),
      defectFixedCount: item.count,
      timeRange: "24h",
    })),
  };
}