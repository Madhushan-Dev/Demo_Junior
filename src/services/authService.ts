import ENDPOINTS from "../utils/endpoints";

//import apiClient, { tokenManager } from "../lib/api";

import apiClient, { tokenManager } from "../lib/api";

const AUTH_BASE_URL = "";

const clearAuthDataHelper = (): void => {
  tokenManager.clearAuthData();

  const APP_STORAGE_KEYS = [
    "user",
    "currentUser",
    "authToken",
    "auth_token",
    "token",
    "jwt",
    "refreshToken",
    "selectedProjectId",
    "statusWorkflowNodes",
    "statusWorkflowEdges",
    "emailConfigTab",
    "assignments",
    "redirectUrl",
  ];

  APP_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  try {
    sessionStorage.clear();
  } catch {}

  if (typeof document !== "undefined") {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }
};

export interface LoginRequest {
  email: string;
  password: string;
}

// export interface LoginResponse {
//   status: string;
//   statusCode: number;
//   statusMessage: string;

//   data: {
//     token: string;
//     refreshToken: string;
//     type: string;
//     userId: number;
//     employeeId: number | null;
//     companyStaffId: number | null;
//     email: string;
//     firstName: string;
//     lastName: string;
//     userType: string;
//     roles: string[];
//     globalPermissions: string[];
//     projectAccessList: string[];
//   };
// }

export interface LoginResponse {
  message: string;
  token: string;
  employeeId: number;
  employeeName: string;
  email?: string;
  roles: string[];
}


export interface AuthError {
  message: string;
  status?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

 export class AuthService {
//   static async login(email: string, password: string): Promise<LoginResponse> {
//     try {
//       this.clearAuthData();

//       const mockUserData = {
//         token: "mock-jwt-token",
//         refreshToken: "mock-refresh-token",
//         type: "Bearer",
//         userId: 1,
//         employeeId: 1,
//         companyStaffId: 1,
//         email: email || "admin@example.com",
//         firstName: "John",
//         lastName: "Doe",
//         userType: "ADMIN",
//         roles: ["ADMIN"],
//         globalPermissions: ["ALL"],
//         projectAccessList: ["1"],
//       };

//       const responseData: LoginResponse = {
//         status: "success",
//         statusCode: 200,
//         statusMessage: "Login successful",
//         data: mockUserData,
//       };

//       const { token, refreshToken, ...userData } = responseData.data;

//       tokenManager.setToken(token);
//       tokenManager.setRefreshToken(refreshToken);
//       localStorage.setItem("user", JSON.stringify(userData));

//       return responseData;
//     } catch (error: any) {
//       throw new Error(error.message || "Login failed");
//     }
//   }

//   static async login(
//   email: string,
//   password: string,
// ): Promise<LoginResponse> {
//   try {
//     this.clearAuthData();

//     // Call real backend login API
//     const response = await apiClient.post(
//       "/auth/login",
//       {
//         email,
//         password,
//       },
//     );

//     const backendData = response.data;

//     // Backend response:
//     // {
//     //   "message": "Login successful",
//     //   "token": "eyJ..."
//     // }

//     const responseData: LoginResponse = {
//       status: "success",
//       statusCode: 200,
//       statusMessage:
//         backendData.message || "Login successful",

//       data: {
//         token: backendData.token,
//         refreshToken: "",
//         type: "Bearer",

//         userId: 0,
//         employeeId: null,
//         companyStaffId: null,

//         email: email,
//         firstName: "",
//         lastName: "",
//         userType: "",
//         roles: [],
//         globalPermissions: [],
//         projectAccessList: [],
//       },
//     };

//     const {
//       token,
//       refreshToken,
//       ...userData
//     } = responseData.data;

//     // Save REAL JWT
//     tokenManager.setToken(token);

//     // Backend currently doesn't return refresh token
//     if (refreshToken) {
//       tokenManager.setRefreshToken(refreshToken);
//     }

//     // Save logged-in user information
//     localStorage.setItem(
//       "user",
//       JSON.stringify(userData),
//     );

//     return responseData;

//   } catch (error: any) {

//     console.error(
//       "Login error:",
//       error.response?.data || error,
//     );

//     throw new Error(
//       error.response?.data?.message ||
//       "Login failed",
//     );
//   }
// }

static async login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  try {
    this.clearAuthData();

    const response = await apiClient.post(
      "/auth/login",
      {
        email,
        password,
      },
    );

    const backendData: LoginResponse = response.data;

    // Save real JWT
    tokenManager.setToken(backendData.token);

    // Save logged-in user details
    const names = (backendData.employeeName || "").trim().split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";

    localStorage.setItem(
      "user",
      JSON.stringify({
        userId: backendData.employeeId,
        employeeId: backendData.employeeId,
        id: backendData.employeeId,
        employeeName: backendData.employeeName,
        username: backendData.employeeName,
        firstName: firstName,
        lastName: lastName,
        email: email,
        roles: backendData.roles,
      }),
    );

    return backendData;

  } catch (error: any) {
    console.error(
      "Login error:",
      error.response?.data || error,
    );

    throw new Error(
      error.response?.data?.message || "Login failed",
    );
  }
}

  
  static async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    email?: string,
    empId?: number,
  ): Promise<any> {
    if (newPassword !== confirmPassword) {
      throw new Error("New passwords do not match");
    }

    const currentUser = this.getCurrentUser();
    const userEmail = email || currentUser?.email;
    const userEmpId =
      empId ||
      currentUser?.employeeId ||
      currentUser?.userId ||
      currentUser?.id;

    const parsedEmpId =
      userEmpId != null
        ? typeof userEmpId === "number"
          ? userEmpId
          : parseInt(userEmpId, 10)
        : undefined;

    const response = await apiClient.post(ENDPOINTS.changePassword, {
      empId: isNaN(parsedEmpId as any) ? undefined : parsedEmpId,
      email: userEmail,
      currentPassword,
      newPassword,
    });

    return response.data;
  }



  static async logout(): Promise<void> {
    this.clearAuthData();
  }

  static clearAuthData(): void {
    clearAuthDataHelper();
  }

  static logoutImmediate(): void {
    this.clearAuthData();
  }

  static isAuthenticated(): boolean {
    const token = tokenManager.getToken();
    return token !== null && tokenManager.isTokenValid();
  }

  static getCurrentUser(): any | null {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  static getToken(): string | null {
    return tokenManager.getToken();
  }
}

export default AuthService;
