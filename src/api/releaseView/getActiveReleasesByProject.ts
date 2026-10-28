import apiClient from "../../lib/api";

export interface ActiveRelease {
  id: string;
  name: string;
  status: string;
}

export const getActiveReleasesByProject = async (
  projectId: string | number,
): Promise<ActiveRelease[]> => {
  try {
    const response = await apiClient.get(`/ReleaseView/project/${projectId}`);
    console.log("active release:", response.data);
    const data =
      response.data?.data?.content ||
      response.data?.content ||
      response.data?.data ||
      response.data ||
      [];

    return Array.isArray(data) ? data : [];
  } catch (error) {
console.error("Failed to fetch releases:", error);
    throw error;
  }
};
