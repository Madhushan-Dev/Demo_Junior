import apiClient from "../../lib/api";
import ENDPOINTS from "../../utils/endpoints";

export interface ReleaseTestCaseCount {
  releaseId: number;
  testCaseCount: number;
}

export const getReleaseTestCaseCount = async (
  releaseId: number,
): Promise<ReleaseTestCaseCount> => {
  const response = await apiClient.get(
    ENDPOINTS.releaseTestCaseCount(releaseId)
  );

  console.log("COUNT RESPONSE:", response.data);

  return response.data?.data;
};