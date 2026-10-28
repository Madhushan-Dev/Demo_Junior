import apiClient from "../../lib/api";

export async function getDefectSeverityIndex(projectId: string) {
  try {
    const response = await apiClient.get(
      `/project/${projectId}/dashboard/severity-index`,
    );
  console.log("DSI API response:", response.data);

    return response.data;
  } catch (error) {
    console.error("DSI API error:", error);
    throw error;
  }
}
