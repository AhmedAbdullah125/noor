import { toast } from "sonner";
import { http } from "./http";
import { setAuth } from "../auth/authStorage";

type ConfirmCodePayload = {
    phone: string;
    verification_code: string;
    password: string;
};

export async function confirmCodeRequest(
    data: ConfirmCodePayload,
    setLoading: (v: boolean) => void,
    lang: string
) {
    setLoading(true);

    const formData = new FormData();
    formData.append("phone", data.phone);
    formData.append("verification_code", data.verification_code);
    formData.append("grant_type", "password");
    formData.append("client_id", "a0ebbcdd-f4d7-4b9b-9ac0-752d55d6d2be");
    formData.append("client_secret", "ZsifN3q9uKXTLPDIIUnMVFQVAFP7umZ7pGCc8VUF");
    formData.append("password", data.password);

    try {
        const response = await http.post("/confirm-code", formData, {
            headers: { lang, "x-skip-auth": "1" },
        });

        const message = response?.data?.message;
        setLoading(false);

        if (!response?.data?.status) {
            toast(message || "Verification failed", {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
            return { ok: false as const, error: message || "Verification failed" };
        }

        const tokenData = response?.data?.items?.token;
        const userData = response?.data?.items?.user;

        if (!tokenData?.access_token || !tokenData?.refresh_token) {
            toast("Invalid token response", {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
            return { ok: false as const, error: "Invalid token response" };
        }

        setAuth(
            {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                token_type: tokenData.token_type,
                expires_in: tokenData.expires_in,
            },
            userData
        );

        toast(message || "تم التحقق بنجاح", {
            style: { background: "#1B8354", color: "#fff", borderRadius: "10px" },
            description: userData?.name ? `مرحباً ${userData.name}` : undefined,
        });

        return { ok: true as const, user: userData };
    } catch (error: any) {
        setLoading(false);
        const errorMessage = error?.response?.data?.message || error?.message || "Error";
        toast(errorMessage, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
        });
        return { ok: false as const, error: errorMessage };
    }
}
