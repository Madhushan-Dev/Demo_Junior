import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface ForgotPasswordResponse {
  status: string;
  statusMessage: string;
  data: any;
  statusCode: number;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}


export async function forgotPassword(
  email: string,
): Promise<ForgotPasswordResponse> {
  const response = await apiClient.post(
    `${ENDPOINTS.forgetPassword}?email=${encodeURIComponent(email)}`,
  );

  return response.data;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ForgotPasswordResponse> {
  const response = await apiClient.post(
    `${ENDPOINTS.resetPassword}?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`,
  );

  return response.data;
}


export async function validateResetToken(
  token: string,
): Promise<ForgotPasswordResponse> {
  const response = await apiClient.get(
    `${ENDPOINTS.validateResetToken}?token=${encodeURIComponent(token)}`,
  );

  return response.data;
}