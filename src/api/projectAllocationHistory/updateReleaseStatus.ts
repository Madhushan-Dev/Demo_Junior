import ENDPOINTS from "../../utils/endpoints";
import apiClient from "../../lib/api";

export interface UpdateReleaseStatusResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: any;
}

export const updateReleaseStatus = async (
  releaseId: number,
  status: "ACTIVE" | "HOLD",
): Promise<UpdateReleaseStatusResponse> => {

  const backendStatus =
    status === "HOLD" ? "ON_HOLD" : "ACTIVE";

  const response = await apiClient.patch(
    ENDPOINTS.releaseStatus(releaseId),
    backendStatus,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};