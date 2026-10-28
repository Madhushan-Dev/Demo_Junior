// import ENDPOINTS from "../../utils/endpoints";
// import apiClient from "../../lib/api";

// export interface CalculateKlocRequest {
//   backendRepo: string;
//   frontendRepo: string;
//   githubUsername: string;
//   githubToken: string;
// }

// export interface CalculateKlocResponse {
//   status: string;
//   statusCode: number;
//   statusMessage: string;
//   data: {
//     backendLOC: number;
//     frontendLOC: number;
//     backendKLOC: number;
//     frontendKLOC: number;
//     totalKLOC: number;
//   };
// }

// export interface UpdateKlocResponse {
//   status: string;
//   statusCode: number;
//   statusMessage: string;
//   data: number;
// }

// export const updateProjectKloc = async (
//   projectId: number,
//   kloc: number,
// ): Promise<UpdateKlocResponse> => {
//   const response = await apiClient.patch(
//     ENDPOINTS.projectKloc(projectId),
//     {
//       kloc: kloc,
//     },
//   );

//   return response.data;
// };

// export const calculateKlocFromGithub = async (
//   projectId: number,
//   payload: CalculateKlocRequest,
// ): Promise<CalculateKlocResponse> => {
//   const response = await apiClient.post(
//     ENDPOINTS.gitKloc(projectId),
//     payload,
//   );

//   return response.data;
// };

import ENDPOINTS from "../../utils/endpoints";

import apiClient from "../../lib/api";

export interface CalculateKlocRequest {
  backendRepo: string;
  frontendRepo: string;
  githubUsername: string;
  githubToken: string;
}
export interface CalculateKlocResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: {
    backendLOC: number;
    frontendLOC: number;
    backendKLOC: number;
    frontendKLOC: number;
    totalKLOC: number;
  };
}
export interface UpdateKlocResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: {
    kiloOfCode: number;
  };
}

export interface StandardResponse {
  status: string;
  message: string;
  data: any;
  statusCode: number;
}

export const updateProjectKloc = async (
  projectId: number,
  kloc: number,
): Promise<UpdateKlocResponse> => {
  const response = await apiClient.patch(ENDPOINTS.projectKloc(projectId), {
    kloc: kloc,
  });
  return response.data;
};


export const calculateKlocFromGithub = async (
  projectId: number,
  payload: CalculateKlocRequest,
): Promise<CalculateKlocResponse> => {
  const response = await apiClient.post(
    ENDPOINTS.gitKloc(projectId),
    payload,
  );

  return response.data;
};