import apiClient from "./apiClient";

export interface SignUpRequest {
  userName: string;
  email: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  statusCode: string;
  responseData: T | null;
  responseMessage: string;
  responseStatus: number;
}

export interface SignUpResponseData {
  userName: string;
  userRoles: string[];
  userMail: string;
}

/**
 * Sign up a new user
 * @param data User signup data
 * @returns Promise resolving to API response
 */
export async function signUp(
  data: SignUpRequest,
): Promise<ApiResponse<SignUpResponseData>> {
  const response = await apiClient.post("/auth/signup", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
}

/**
 * Login Returning user
 * @param data Username or email and password
 * @returns Promise resolving to API response
 */
export async function login(
  data: LoginRequest,
): Promise<ApiResponse<LoginResponseData>> {
  const response = await apiClient.post("/auth/login", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

/**
 * Logout user
 * @param null
 * @returns Promise resolving to API response
 */
export async function logout(): Promise<ApiResponse<null>> {
  const response = await apiClient.post("/auth/logout", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
}
