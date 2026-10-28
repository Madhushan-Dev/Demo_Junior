import apiClient from "../../lib/api";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function updateReleaseStatus(
  id: string | number,
  status: "Active" | "Hold",
) {
  let url = "";
  if (status === "Active") {
    url = `${BASE_URL}releases/activate/${id}`;
    return apiClient.put(url);
  } else if (status === "Hold") {
    url = `${BASE_URL}releases/hold/${id}`;
    return apiClient.put(url);
  }
}

export type ExecutionStatus =
  "not-started" | "in-progress" | "passed" | "failed" | "blocked";

const EXECUTION_STATUS_KEY = "executionStatuses";

export function getExecutionStatuses(
  projectId: string | number,
  releaseId: string | number,
): Record<string, ExecutionStatus> {
  try {
    const raw = localStorage.getItem(EXECUTION_STATUS_KEY);
    if (!raw) return {};
    const all: Record<string, any> = JSON.parse(raw);
    const proj = all[String(projectId)] || {};
    return (proj[String(releaseId)] || {}) as Record<string, ExecutionStatus>;
  } catch {
    return {};
  }
}

export function setExecutionStatus(
  projectId: string | number,
  releaseId: string | number,
  testCaseId: string | number,
  status: ExecutionStatus,
): Record<string, ExecutionStatus> {
  let all: Record<string, any> = {};
  try {
    const raw = localStorage.getItem(EXECUTION_STATUS_KEY);
    all = raw ? JSON.parse(raw) : {};
  } catch {
    all = {};
  }

  const pid = String(projectId);
  const rid = String(releaseId);
  if (!all[pid]) all[pid] = {};
  if (!all[pid][rid]) all[pid][rid] = {};
  all[pid][rid][String(testCaseId)] = status;

  localStorage.setItem(EXECUTION_STATUS_KEY, JSON.stringify(all));
  return all[pid][rid] as Record<string, ExecutionStatus>;
}

export function setBulkExecutionStatuses(
  projectId: string | number,
  releaseId: string | number,
  statuses: Record<string, ExecutionStatus>,
): void {
  let all: Record<string, any> = {};
  try {
    const raw = localStorage.getItem(EXECUTION_STATUS_KEY);
    all = raw ? JSON.parse(raw) : {};
  } catch {
    all = {};
  }

  const pid = String(projectId);
  const rid = String(releaseId);
  if (!all[pid]) all[pid] = {};
  all[pid][rid] = { ...(all[pid][rid] || {}), ...statuses };
  localStorage.setItem(EXECUTION_STATUS_KEY, JSON.stringify(all));
}

export const updateReleaseTestCaseStatus = async (
  releaseId: number,
  releaseTestCaseId: number,
  passOrFail: "PASS" | "FAIL",
): Promise<any> => {

  const formData = new FormData();

  const data = {
    passOrFail,
  };

  formData.append(
    "data",
    new Blob(
      [JSON.stringify(data)],
      { type: "application/json" }
    )
  );

  const response = await apiClient.patch(
    `/release-test-cases/release/${releaseId}/test-case/${releaseTestCaseId}/status`,
    formData
  );

  return response.data;
};

export const updateReleaseTestCaseStatusWithImage = async (
  releaseId: number,
  releaseTestCaseId: number,
  formData: FormData,
): Promise<any> => {
  const response = await apiClient.patch(
    `/release-test-cases/release/${releaseId}/test-case/${releaseTestCaseId}/status`,
    formData,
  );

  return response.data;
};
