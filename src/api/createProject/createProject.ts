import apiClient from "../../lib/api";
import { ProjectFormData } from "../../types";
import ENDPOINTS from "../../utils/endpoints";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_URL = `${BASE_URL}${ENDPOINTS.project}`;

export async function createProject(projectData: ProjectFormData) {
  try {
    const payload = {
      projectName: projectData.name,
      projectDescription: projectData.description,
      projectStatus: projectData.status
        ? projectData.status.toUpperCase()
        : "ACTIVE",
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      clientName: projectData.clientName,
      country: projectData.clientCountry,
      state: projectData.clientState,
      email: projectData.clientEmail,
      phoneNumber: projectData.clientPhone,
      projectManagerId: projectData.userId || projectData.manager,
    };
const response = await apiClient.post(API_URL, payload);
return response.data;
  } catch (error: any) {
throw new Error(
      error.response?.data?.message || "Failed to create project",
    );
  }
}
