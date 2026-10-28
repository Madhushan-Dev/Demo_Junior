import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface Designations {
  designationId: number;
  designationName: string;
}

export interface CreateDesignations {
  designationName: string;
}

// GET
export async function getDesignations(
  page: number = 0,
  size: number = 1000,
) {
  const response = await apiClient.get(
    ENDPOINTS.designationPagination(page, size),
  );

  return response.data;
}

export const getAllDesignations = getDesignations;


// POST - Create Designation
export async function createDesignation(
  data: CreateDesignations
) {
  try {
    const response = await apiClient.post(
      ENDPOINTS.designationCreate,
      data
    );

    return response.data;

  } catch (error: any) {

    const message =
      error.response?.data?.data?.[0]?.message ||
      error.response?.data?.message ||
      "Unable to create designation.";

    throw new Error(message);
  }
}


// PUT - Update Designation
export async function putDesignation(
  id: number,
  data: CreateDesignations
) {
  try {
    const response = await apiClient.put(
      ENDPOINTS.designationUpdate(id),
      data
    );

    return response.data;

  } catch (error: any) {

    const message =
      error.response?.data?.data?.[0]?.message ||
      error.response?.data?.message ||
      "Unable to update designation.";

    throw new Error(message);
  }
}

export const updateDesignation = putDesignation;


// DELETE - Delete Designation
export async function deleteDesignation(id: number) {
  try {
    const response = await apiClient.delete(
      ENDPOINTS.designationDelete(id)
    );

    return response.data;

  } catch (error: any) {

    const message =
      error.response?.data?.data?.[0]?.message ||
      error.response?.data?.message ||
      "Unable to delete designation.";

    throw new Error(message);
  }
}