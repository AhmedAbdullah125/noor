import axios from "axios";
import { API_BASE_URL } from "@/lib/apiConfig";
import { toast } from "sonner";

type RegisterPayload = {
  name: string;
  phone: string; // "0123..." or "+2012..."
  phone_confirm: string;
  password: string;
  country_code: string;
};

export async function registerRequest(
  data: RegisterPayload,
  setLoading: (v: boolean) => void,
  lang: string
) {
  setLoading(true);

  const url = `${API_BASE_URL}/v1/register`;
  const formData = new FormData();

  formData.append("name", data.name);
  formData.append("phone", data.phone);
  formData.append("phone_confirm", data.phone_confirm);
  formData.append("password", data.password);
  formData.append("grant_type", "password");
  formData.append("client_id", import.meta.env.VITE_CLIENT_OAUTH_CLIENT_ID ?? "");
  formData.append("client_secret", import.meta.env.VITE_CLIENT_OAUTH_CLIENT_SECRET ?? "");
  formData.append("country_code", data.country_code);

  try {
    const response = await axios.post(url, formData, {
      headers: { lang, "x-skip-auth": "1" }
    });
    const message = response?.data?.message;

    setLoading(false);

    if (!response?.data?.status) {
      toast(message || "Register failed", {
        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
      });
      return { ok: false as const, error: message || "Register failed" };
    }

    // Registration now returns a verification challenge, NOT tokens: the account
    // is created unverified and the user must confirm the OTP before logging in.
    const items = response?.data?.items ?? {};

    toast(message || "تم إرسال رمز التحقق", {
      style: { background: "#1B8354", color: "#fff", borderRadius: "10px" },
    });

    return {
      ok: true as const,
      requiresVerification: true as const,
      phone: items.phone as string | undefined,
      country_code: items.country_code as string | undefined,
    };
  } catch (error: any) {
    setLoading(false);
    const errorMessage = error?.response?.data?.message || error?.message || "Error";
    toast(errorMessage, {
      style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
    });
    return { ok: false as const, error: errorMessage };
  }
}
