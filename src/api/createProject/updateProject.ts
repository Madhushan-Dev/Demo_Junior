import apiClient from "../../lib/api";
import { ProjectFormData } from "../../types";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function updateProject(
  id: string | number,
  projectData: ProjectFormData,
) {
  try {
    const payload = {
      projectName: projectData.name,
      projectStatus: projectData.status
        ? projectData.status.toUpperCase()
        : "ACTIVE",
      startDate: projectData.startDate || null,
      endDate: projectData.endDate || null,
      userId: String(projectData.userId || projectData.manager || ""),
      description: projectData.description,
      clientName: projectData.clientName,
      country: projectData.clientCountry,
      state: projectData.clientState,
      email: projectData.clientEmail,
      phoneNo: projectData.clientPhone,
    };

    const response = await apiClient.put(`${BASE_URL}projects/${id}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to update project",
    );
  }
}
