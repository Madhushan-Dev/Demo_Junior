import ENDPOINTS from "../../utils/endpoints";
import apiClient from "../../lib/api";

export async function getReopenCountSummary(projectId: number) {
  const response = await apiClient.get(
    ENDPOINTS.dashboardReopenedByProject(projectId),
  );

  const data = response.data;

  return {
    status: "success",
    data: [
      {
        label: "Reopened",
        count: data.reopenedMultipleTimesCount || 0,
      },
      {
        label: "Not Reopened",
        count: data.notReopenedMultipleTimesCount || 0,
      },
    ],
  };
}