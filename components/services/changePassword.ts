import { http } from "./http";
import { toast } from "sonner";

type ChangePasswordPayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export async function changePasswordRequest(
  data: ChangePasswordPayload,
  setLoading: (v: boolean) => void,
  lang: string
): Promise<{ ok: boolean; error?: string }> {
  setLoading(true);

  const formData = new FormData();
  formData.append("current_password", data.current_password);
  formData.append("password", data.password);
  formData.append("password_confirmation", data.password_confirmation);

  try {
    const response = await http.post("/change-password", formData, {
      headers: { lang },
    });

    setLoading(false);
    const message = response?.data?.message;

    if (!response?.data?.status) {
      toast(message || "Failed to change password", {
        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
      });
      return { ok: false, error: message || "Failed to change password" };
    }

    toast(message || "Password changed successfully", {
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
