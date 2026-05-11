// src/services/http/http.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/lib/apiConfig";
import { refreshToken } from "./refreshToken";
import { getAccessToken, getRefreshToken, clearAuth } from "../auth/authStorage";

export class UnauthorizedError extends Error {
    isUnauthorized = true;
    reason?: string;
    apiMessage?: string;
    constructor(reason?: string, apiMessage?: string) {
        super("unauthorized");
        this.name = "UnauthorizedError";
        this.reason = reason;
        this.apiMessage = apiMessage;
    }
}

export const authEvents = { onLogout: (reason?: string, message?: string) => { } };

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let isLoggingOut = false;

/** Call this after a successful login to reset the logout-guard flag. */
export function resetAuthState() {
    isLoggingOut = false;
    isRefreshing = false;
    refreshPromise = null;
}

function isSessionExpiredResponse(data: any) {
    return data?.status === false && data?.statusCode === 401;
}
function isAuthEndpoint(url?: string) {
    if (!url) return false;
    return url.includes("/login") || url.includes("/refresh-token");
}

export const http: AxiosInstance = axios.create({ baseURL: API_BASE_URL + "/v1" });

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const skipAuth = (config.headers as any)?.["x-skip-auth"];
    config.headers = config.headers ?? {};

    if (!skipAuth) {
        const token = getAccessToken?.();
        if (token) (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

async function handleUnauthorized(originalConfig: any, apiMessage?: string) {
    // لا تعمل refresh على auth endpoints
    if (isAuthEndpoint(originalConfig?.url)) throw new UnauthorizedError("auth_endpoint", apiMessage);

    if (originalConfig?._retry) {
        if (!isLoggingOut) {
            isLoggingOut = true;
            clearAuth();
            authEvents.onLogout?.("session_expired", apiMessage);
        }
        throw new UnauthorizedError("already_retried", apiMessage);
    }
    originalConfig._retry = true;

    const hasRefresh = !!getRefreshToken?.();
    if (!hasRefresh) {
        if (!isLoggingOut) {
            isLoggingOut = true;
            clearAuth();
            authEvents.onLogout?.("no_refresh_token", apiMessage);
        }
        throw new UnauthorizedError("no_refresh_token", apiMessage);
    }

    if (!isRefreshing) {
        isRefreshing = true;
        const lang = (originalConfig.headers?.lang as string) || "ar";
        refreshPromise = refreshToken(lang).then((r) => {
            isRefreshing = false;
            return r.ok;
        });
    }

    const ok = await refreshPromise!;
    if (!ok) {
        if (!isLoggingOut) {
            isLoggingOut = true;
            clearAuth();
            authEvents.onLogout?.("refresh_failed", apiMessage);
        }
        throw new UnauthorizedError("refresh_failed", apiMessage);
    }

    const newToken = getAccessToken?.();
    if (newToken) originalConfig.headers.Authorization = `Bearer ${newToken}`;

    return http.request(originalConfig);
}

http.interceptors.response.use(
    async (response) => {
        if (isAuthEndpoint(response.config?.url)) return response;

        if (isSessionExpiredResponse(response.data)) {
            const apiMessage: string | undefined = response.data?.message;
            return handleUnauthorized(response.config, apiMessage);
        }

        return response;
    },
    async (error: AxiosError) => {
        const originalConfig: any = error.config;
        if (isAuthEndpoint(originalConfig?.url)) return Promise.reject(error);

        const status = error.response?.status;
        const data: any = error.response?.data;
        const apiMessage: string | undefined = data?.message;

        if (status === 401 || isSessionExpiredResponse(data)) {
            try {
                return await handleUnauthorized(originalConfig, apiMessage);
            } catch (e) {
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);
