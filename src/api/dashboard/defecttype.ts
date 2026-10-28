import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface DefectTypeItem {
  defectTypeName: string;
  defectCount: number;
  percentage: number;
}

export interface DefectTypeResponse {
  status: string;
  statusCode?: number;
  statusMessage?: string;
  data: {
    defectTypes: DefectTypeItem[];
    totalDefectCount: number;
    mostCommonDefectType: string;
    mostCommonDefectCount: number;
  };
}

export async function getDefectTypeByProjectId(
  projectId: string,
): Promise<DefectTypeResponse> {
  try {
  console.log("Defect Type API projectId:", projectId);

  const response = await apiClient.get(
    ENDPOINTS.defectByType(Number(projectId)),
  );

  console.log("Defect Type API response:", response.data);
///
  let defectTypes: any[] = [];
  let totalDefectCount = 0;;
//////////////////////////////////////
    if (
      response.data?.data?.defectTypes &&
      Array.isArray(response.data.data.defectTypes)
    )
     {
      defectTypes = response.data.data.defectTypes;
      totalDefectCount = response.data.data.totalDefectCount || 0;
    } //////////////////////////
    else if (
      response.data?.defectTypes &&
      Array.isArray(response.data.defectTypes)
    ) {
      defectTypes = response.data.defectTypes;
      totalDefectCount = response.data.totalDefectCount || 0;
    } else if (Array.isArray(response.data)) {
      defectTypes = response.data;
      totalDefectCount = defectTypes.reduce(
        (sum, item) => sum + (item.defectCount || item.count || 0),
        0,
      );
    } else if (Array.isArray(response.data?.data)) {
      defectTypes= response.data.data;
      totalDefectCount = defectTypes.reduce(
        (sum, item) => sum + (item.defectCount || item.count || 0),
        0,
      );
    }

    const mappedDefectTypes = defectTypes.map((item: any) => ({
      defectTypeName:
        item.defectTypeName || item.type || item.name || "Unknown",
      defectCount: item.defectCount || item.count || item.value || 0,
      percentage: item.percentage || 0,
    }));

    const total =
      totalDefectCount ||
      mappedDefectTypes.reduce((sum, item) => sum + item.defectCount, 0);
    const defectTypesWithPercentages = mappedDefectTypes.map((item) => ({
      ...item,
      percentage:
        item.percentage || (total > 0 ? (item.defectCount / total) * 100 : 0),
    }));

    const mostCommon = defectTypesWithPercentages.reduce(
      (prev, current) =>
        prev.defectCount > current.defectCount ? prev : current,
      { defectTypeName: "", defectCount: 0, percentage: 0 },
    );

    const result = {
      status: "success",
      data: {
        defectTypes: defectTypesWithPercentages,
        totalDefectCount: total,
        mostCommonDefectType: mostCommon.defectTypeName,
        mostCommonDefectCount: mostCommon.defectCount,
      },
    };

    return result;
  } catch (error) {
    throw error;
  }
}
