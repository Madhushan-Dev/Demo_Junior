import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export const deleteProject = async (projectId: number): Promise<any> => {
  try {
    const url = ENDPOINTS.projectdelete(projectId);
    const response = await apiClient.delete(url);
    return response.data;
  } catch (error: any) {
    throw new Error("Project Can't Delete");
  }
};
