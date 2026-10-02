const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "customer";
  phone?: string | null;
}

export interface AuthResponse {
  status: string;
  message: string;
  access_token: string;
  token_type: string;
  user: User;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  database: string;
  service: string;
  environment?: string;
  version?: string;
}

export interface AdminDashboardResponse {
  status: string;
  message: string;
  admin: User;
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Client-side token storage helper
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("apex_auth_token");
  },
  set: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("apex_auth_token", token);
    }
  },
  remove: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("apex_auth_token");
    }
  },
};

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = tokenStorage.get();

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
      credentials: "include",
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(
        (errorBody as { message?: string })?.message ||
          `API request failed with status ${response.status}`,
        response.status,
        errorBody
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network error occurred while contacting API"
    );
  }
}

export const api = {
  health: {
    check: () => fetchApi<HealthCheckResponse>("/health"),
  },
  auth: {
    login: (credentials: { email: string; password: string }) =>
      fetchApi<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    logout: () =>
      fetchApi<{ status: string; message: string }>("/auth/logout", {
        method: "POST",
      }),
    me: () => fetchApi<{ status: string; user: User }>("/auth/me"),
  },
  admin: {
    dashboard: () => fetchApi<AdminDashboardResponse>("/admin/dashboard"),
  },
};
