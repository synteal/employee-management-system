import axios, { AxiosError } from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const isLoopbackApiUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
};

const resolveBaseUrl = (): string => {
  if (!configuredApiUrl) {
    return "/";
  }

  if (!import.meta.env.PROD) {
    return configuredApiUrl;
  }

  if (isLoopbackApiUrl(configuredApiUrl)) {
    return "/";
  }

  if (typeof window === "undefined") {
    return configuredApiUrl;
  }

  try {
    const configuredUrl = new URL(configuredApiUrl, window.location.origin);

    if (configuredUrl.hostname === window.location.hostname) {
      return "/";
    }

    if (
      window.location.protocol === "https:" &&
      configuredUrl.protocol === "http:"
    ) {
      configuredUrl.protocol = "https:";
      return configuredUrl.toString();
    }

    return configuredUrl.toString();
  } catch {
    return configuredApiUrl;
  }
};

const baseURL = resolveBaseUrl();

const api = axios.create({
  // Production should never talk to a loopback API URL from a deployed browser bundle.
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if unauthorized, except on login
      const originalRequest = error.config;
      if (originalRequest.url !== "/auth/login") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        // Dispatch event or reload or handle via Context (Context can listen to a custom event)
        window.dispatchEvent(new Event("unauthorized"));
      }
    }
    return Promise.reject(error);
  },
);

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface FastAPIError {
  detail: string | ValidationError[];
}

export const isApiError = (
  error: unknown,
): error is AxiosError<FastAPIError> => {
  return axios.isAxiosError(error);
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string = "An unexpected error occurred",
): string => {
  if (isApiError(error) && error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d: ValidationError) => d.msg || JSON.stringify(d))
        .join("; ");
    } else if (typeof detail === "object" && detail !== null) {
      return (
        ((detail as Record<string, unknown>).msg as string) ||
        JSON.stringify(detail)
      );
    } else {
      return String(detail);
    }
  }
  return fallback;
};

export default api;
