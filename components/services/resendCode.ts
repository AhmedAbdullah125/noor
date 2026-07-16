import { toast } from "sonner";
import { http } from "./http";

/**
 * Requests a fresh verification code for an unverified account. The backend
 * (POST /api/v1/resend-code) is rate-limited and applies a per-account cooldown,
 * and always answers generically so it cannot be used to probe for accounts.
 */
export async function resendCodeRequest(
    data: { phone: string; country_code?: string },
    lang: string
): Promise<{ ok: boolean; error?: string }> {
    const formData = new FormData();
    formData.append("phone", data.phone);
    if (data.country_code) formData.append("country_code", data.country_code);

    try {
        const response = await http.post("/resend-code", formData, {
            headers: { lang, "x-skip-auth": "1" },
        });

        toast(response?.data?.message || (lang === "ar" ? "تم إرسال رمز جديد" : "A new code was sent"), {
            style: { background: "#1B8354", color: "#fff", borderRadius: "10px" },
        });
        return { ok: true };
    } catch (error: any) {
        const msg = error?.response?.data?.message || error?.message || "Error";
        toast(msg, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
        });
        return { ok: false, error: msg };
    }
}
