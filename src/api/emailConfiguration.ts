import apiClient from "../lib/api";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export interface CreateSmtpConfigRequest {
   name: string;
   fromEmail: string;
   host: string;
   port: number;
   status: boolean;
   smtpUserName: string;
   smtpPassword: string;
}

export interface CreateSmtpConfigResponse {
    id: number;
    name: string;
    fromEmail: string;
    host: string;
    port: number;
    status: boolean;
    smtpUserName: string;
    smtpPassword?: string;
}

export const createSmtpConfig = async (
  data: CreateSmtpConfigRequest,
): Promise<CreateSmtpConfigResponse> => {
  try {
    const response = await apiClient.post(`${BASE_URL}smtp-config`, data);
    return response.data;
  } catch (error) {
throw error;
  }
};

export const getSmtpConfigs = async (): Promise<CreateSmtpConfigResponse[]> => {
  try {
    const response = await apiClient.get(`${BASE_URL}smtp-config`);
    const result = response.data;
if (Array.isArray(result)) {
      return result;
    } else if (result && typeof result === "object") {
      return [result];
    } else {
      return [];
    }
  } catch (error) {
throw error;
  }
};

export const updateSmtpConfig = async (
  id: number,
  data: CreateSmtpConfigRequest,
): Promise<CreateSmtpConfigResponse> => {
  try {


    const response = await apiClient.put(`${BASE_URL}smtp-config/${id}`, data);


    const result = response.data;
return result;
  } catch (error) {
throw error;
  }
};

export const deleteSmtpConfig = async (id: number): Promise<void> => {
  try {
const response = await apiClient.delete(`${BASE_URL}smtp-config/${id}`);

} catch (error) {
throw error;
  }
};
