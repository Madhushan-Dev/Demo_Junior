
import apiClient from "../../lib/api";

export const deleteSubmodule = async (submoduleId: number, moduleId: number) => {
  console.log('DELETE API - Received:', { submoduleId, moduleId });

  if (!submoduleId || !moduleId) {
    console.error('Missing IDs:', { submoduleId, moduleId });
    throw new Error('Missing required IDs for delete');
  }
  
  const response = await apiClient.delete(
    `/module/${moduleId}/sub-module/${submoduleId}`
  );
  
  console.log('Delete response:', response.data);
  
  return {
    status: "success",
    message: response.data?.message || "Submodule deleted successfully",
    data: response.data
  };
};