import apiClient from "../../lib/api";

export const createRoles = async (data: {
  roleName: string;
  roleType: string;
}) => {
  
    const response = await apiClient.post("/Role/save", data);
return response.data;
  
};
