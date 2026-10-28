import apiClient from "../api/apiClient";


const ENDPOINTS = {
    projectById: (id: number) => `/projects/${id}`,
};

export const deleteProject = async (id: number) => {
    try {
        const response = await apiClient.delete(
            ENDPOINTS.projectById(id)
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting project", error);
        throw error;
    }
};