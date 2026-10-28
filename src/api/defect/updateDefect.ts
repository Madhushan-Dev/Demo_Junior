import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export const updateDefectById = async (
  defectId: string | number,
  payload: Record<string, unknown>,
  attachmentImage?: File | null,
) => {
  const formData = new FormData();

  formData.append(
    "defect",
    new Blob([JSON.stringify(payload)], {
      type: "application/json",
    }),
  );

  if (attachmentImage) {
    formData.append("attachmentImage", attachmentImage);
  } else {
    // The backend PATCH endpoint declares the "attachmentImage" part, so it must
    // always be present in the request (otherwise: "Required part
    // 'attachmentImage' is not present."). When there is no new file - including
    // when the user is removing the existing image - send an empty placeholder.
    // The backend treats a zero-byte part as isEmpty() and skips it, so the
    // removeAttachment flag in the "defect" part still drives the delete.
    formData.append(
      "attachmentImage",
      new Blob([], { type: "application/octet-stream" }),
      "empty",
    );
  }

  const response = await apiClient.patch(
    `${ENDPOINTS.updatedefect}/${defectId}`,
    formData,
  );

  return response;
};
