// src/services/forgotPassword.ts
import { http } from "./http";
import { toast } from "sonner";

type ForgotPasswordPayload = { phone: string; country_code: string };
type ResetPasswordPayload = ForgotPasswordPayload & { code: string; password: string };

export async function forgotPasswordRequest(
  data: ForgotPasswordPayload,
  setLoading: (v: boolean) => void,
  lang: string
): Promise<{ ok: boolean; error?: string }> {
  setLoading(true);

  const formData = new FormData();
  formData.append("phone", data.phone);
  formData.append("country_code", data.country_code);

  try {
    const response = await http.post("/forgot-password", formData, {
      headers: { lang, "x-skip-auth": "1" },
    });

    setLoading(false);
    const message = response?.data?.message;

    if (!response?.data?.status) {
      toast(message || "Failed to send reset request", {
        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
      });
      return { ok: false, error: message || "Failed to send reset request" };
    }

    toast(message || "Request sent successfully", {
      style: { background: "#1B8354", color: "#fff", borderRadius: "10px" },
    });

    return { ok: true };
  } catch (error: any) {
    setLoading(false);
    const errorMessage =
      error?.response?.data?.message || error?.message || "Error";
    toast(errorMessage, {
      style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
    });
    return { ok: false, error: errorMessage };
  }
}

export async function resetPasswordRequest(
  data: ResetPasswordPayload,
  setLoading: (value: boolean) => void,
  lang: string,
): Promise<{ ok: boolean; error?: string }> {
  setLoading(true);
  const formData = new FormData();
  formData.append('phone', data.phone);
  formData.append('country_code', data.country_code);
  formData.append('code', data.code);
  formData.append('password', data.password);
  try {
    const response = await http.post('/reset-password', formData, { headers: { lang, 'x-skip-auth': '1' } });
    const message = response?.data?.message;
    if (!response?.data?.status) return { ok: false, error: message || 'Unable to reset password' };
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.response?.data?.message || error?.message || 'Unable to reset password' };
  } finally {
    setLoading(false);
  }
}
