import ENDPOINTS from "../../utils/endpoints";
import apiClient from "../../lib/api";
import { useEffect } from "react";

export interface DefectCreate {
  briefDescription: string;
  steps: string;

  projectId?: number;
  moduleId?: number;
  subModuleId?: number;
  

  defectTypeId?: number;
  severityId?: number;
  priorityId?: number;
  statusTypeId?: number;

  releaseIds?: number[];

  enterBy?: number;
  subDevId?: number;

  testCaseRequired?: boolean;
  testCaseId?: number | null;

  expectedResult?: string;
  actualResult?: string;
}

export interface DefectCreateProps {
  message: string;
  data: DefectCreate[];
  status: string;
  statusCode: number;
}

// export const addDefects = async (
//   payload: DefectCreate,
// ): Promise<DefectCreateProps> => {
//   const response = await apiClient.post(ENDPOINTS.defect, payload);
// return response.data;
// };


export const addDefects = async (
  defectData: DefectCreate,
  attachmentImage?: File | null
) => {
  const formData = new FormData();

  formData.append(
    "defect",
    new Blob([JSON.stringify(defectData)], {
      type: "application/json",
    })
  );

  if (attachmentImage) {
    formData.append("attachmentImage", attachmentImage);
  }

  const response= await apiClient.post(
    ENDPOINTS.defect,
    formData
  );
  return response.data
};