import apiClient from "../../lib/api";

export interface Role {
  roleId: number;
  roleName: string;
  roleType: string;
}



export interface PageData {
  content: Role[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// export interface GetRolesResponse {
//   statusCode: number;
//   statusMessage: string;
//   data: PageData;
// }

export const getAllRoles = async (
  page: number = 0,
  size: number = 10000,
): Promise<PageData> => {
  try {
    const response = await apiClient.get("/Role", {
      params: {
        page,
        size,
      },
    });

    console.log("ROLE GET RESPONSE:", response.data);

    return response.data.data;
  } catch (error: any) {
    console.error(
      "GET ROLES ERROR:",
      error.response?.data || error
    );

    throw error;
  }
};