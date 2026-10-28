import apiClient from "../../lib/api";

export interface QAMember {
  userId: number;
  userFullName: string;
}

export interface QAMembersResponse {
  status: string;
  statusCode: number;
  message: string;
  data: QAMember[];
}

export const getQAMembersByProjectId = async (
  projectId: number,
): Promise<QAMembersResponse> => {
  try {
    const response = await apiClient.get(
      `projectAllocations/quality-lead/${projectId}`,
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error("No QA members found for this project");
    }
    if (error.response?.status === 403) {
      throw new Error("You do not have permission to access QA members");
    }
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please login again.");
    }
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch QA members",
    );
  }
};
