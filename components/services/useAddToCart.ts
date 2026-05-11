import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/apiConfig";
import { http } from "./http";

export interface AddToCartPayload {
    service_id: number;
    subscription_id?: number | null;
    options: { option_id: number; option_value_id: number }[];
    start_date: string;
    start_time: string;
    coupon_code?: string;
    lang?: string;
}

async function addToCartRequest(payload: AddToCartPayload): Promise<any> {
    const body: Record<string, any> = {
        service_id: payload.service_id,
        options: payload.options,
        start_date: payload.start_date,
        start_time: payload.start_time,
    };

    if (payload.subscription_id != null) {
        body.subscription_id = payload.subscription_id;
    }

    if (payload.coupon_code) {
        body.coupon_code = payload.coupon_code;
    }

    // Use absolute URL to bypass the /v1 prefix baked into the http baseURL
    const res = await http.post(`${API_BASE_URL}/cart/items`, body, {
        headers: { "Content-Type": "application/json" },
    });

    return res.data;
}

export interface UseAddToCartOptions {
    onSuccess?: () => void;
    successMessage?: string;
    errorMessage?: string;
}

export function useAddToCart({
    onSuccess,
    successMessage = "Added to cart successfully",
    errorMessage = "Failed to add to cart",
}: UseAddToCartOptions = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: AddToCartPayload) => addToCartRequest(payload),

        onSuccess: (data: any) => {
            if (data?.status) {
                toast(successMessage, {
                    style: { background: "#198754", color: "#fff", borderRadius: "10px" },
                });
                queryClient.invalidateQueries({ queryKey: ["cart"] });
                onSuccess?.();
            } else {
                const msg = data?.message || errorMessage;
                toast(msg, {
                    style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
                });
            }
        },

        onError: (e: any) => {
            if (e?.isUnauthorized) return;
            const msg = e?.response?.data?.message || e?.message || errorMessage;
            toast(msg, {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
        },
    });
}
