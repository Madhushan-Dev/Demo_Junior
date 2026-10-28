import apiClient from "../../lib/api";
export async function getDefectRemarkRatioByProjectId(
  projectId: string | number,
) {
  try {
    const response = await apiClient.get(
      `/project/${projectId}/dashboard/remark-ratio`,
    );

    // Your backend directly returns the DTO,
    // so use response.data, NOT response.data.data
    const backendData = response?.data;

    if (!backendData) {
      return { data: {} };
    }

    const ratio = Number(backendData.ratio ?? 0);

    // Decide the display category from the ratio.
    // Change these thresholds if your project specification
    // defines different ranges.
    let category: string;
    let color: string;

    if (ratio >= 70) {
      category = "High";
      color = "red";
    } else if (ratio >= 50) {
      category = "Medium";
      color = "yellow";
    } else {
      category = "Low";
      color = "green";
    }

    return {
      data: {
        ratio: `${ratio}%`,
        category,
        color,
      },
    };
  } catch (error) {
    throw error;
  }
}
