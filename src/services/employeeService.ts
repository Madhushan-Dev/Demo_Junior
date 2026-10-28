import apiClient from "../lib/api";
import realApiClient from "./realApiClient";

const EMPLOYEE_URL = "/Employee";

export const getAllEmployees = async () => {
  const response = await apiClient.get(
    `${EMPLOYEE_URL}/view/paged`,
    {
      params: {
        page: 0,
        size: 1000,
      },
    }
  );

  return response.data;
};

export const filterEmployees = async (
  keyword = "",
  gender = "",
  status = "",
  designation = ""
) => {
  const response = await apiClient.get(
    `${EMPLOYEE_URL}/search`,
    {
      params: {
        keyword: keyword.trim() || undefined,
        gender: gender || undefined,
        status: status || undefined,
        designation: designation || undefined,
      },
    }
  );

  return response.data;
};