let BASE_URL = import.meta.env.VITE_BASE_URL || "/api/v1/";

if (BASE_URL && !BASE_URL.endsWith("/")) {
  BASE_URL = BASE_URL + "/";
}

export const getBulkSuboduleAllocation = async (
  projectId: number,
  moduleId: number,
  submoduleId: number,
) => {
return [];
};
