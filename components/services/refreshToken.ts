// src/services/http/refreshToken.ts
import { http } from "./http";
import { getRefreshToken, getUser, clearAuth, setAuth } from "../auth/authStorage";

export async function refreshToken(lang: string) {
    const refresh_token = getRefreshToken();
    if (!refresh_token) return { ok: false as const, error: "No refresh token" };

    const formData = new FormData();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refresh_token);
    formData.append("client_id", import.meta.env.VITE_CLIENT_OAUTH_CLIENT_ID ?? "");
    formData.append("client_secret", import.meta.env.VITE_CLIENT_OAUTH_CLIENT_SECRET ?? "");

    try {
        const res = await http.post("/refresh-token", formData, {
            headers: { lang, "x-skip-auth": "1" },
        });

        if (!res?.data?.status) {
            return { ok: false as const, error: res?.data?.message || "Refresh failed" };
        }

        const t = res?.data?.items;
        if (!t?.access_token || !t?.refresh_token) {
            return { ok: false as const, error: "Invalid refresh response" };
        }

        const existingUser = getUser() || undefined;

        setAuth(
            {
                access_token: t.access_token,
                refresh_token: t.refresh_token,
                token_type: t.token_type,
                expires_in: t.expires_in,
            },
            existingUser
        );

        return { ok: true as const };
    } catch (e: any) {
        clearAuth();
        return {
            ok: false as const,
            error: e?.response?.data?.message || e?.message || "Refresh error",
        };
    }
}
