import axios from "axios";
import { API_BASE_URL } from "@/lib/apiConfig";
import { toast } from "sonner";

type RegisterPayload = {
  name: string;
  phone: string; // "0123..." or "+2012..."
  phone_confirm: string;
  password: string;
};

export async function registerRequest(
  data: RegisterPayload,
  setLoading: (v: boolean) => void,
  lang: string
) {
  setLoading(true);

  const url = `${API_BASE_URL}/register`;
  const formData = new FormData();

  formData.append("name", data.name);
  formData.append("phone", data.phone);
  formData.append("phone_confirm", data.phone_confirm);
  formData.append("password", data.password);
  formData.append("grant_type", "password");
  formData.append("client_id", "a0ebbcdd-f4d7-4b9b-9ac0-752d55d6d2be");
  formData.append("client_secret", "ZsifN3q9uKXTLPDIIUnMVFQVAFP7umZ7pGCc8VUF");

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

    const tokenData = response?.data?.items?.token;
    const userData = response?.data?.items?.user;

    if (!tokenData?.access_token || !tokenData?.refresh_token) {
      toast("Invalid token response", {
        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
      });
      return { ok: false as const, error: "Invalid token response" };
    }

    // Registration successful
    toast(message || "تم التسجيل بنجاح", {
      style: { background: "#1B8354", color: "#fff", borderRadius: "10px" },
      description: userData?.name ? `مرحباً ${userData.name}` : undefined,
    });

    return {
      ok: true as const,
      token: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
      },
      user: userData
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
