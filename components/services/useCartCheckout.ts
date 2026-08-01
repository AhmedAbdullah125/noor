import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";
import { http } from "./http";

export interface CartCheckoutPayload {
    payment_type: string; // e.g. "knet", "wallet", "credit_card"
    coupon_code?: string;
}

export interface CartCheckoutItems {
    payment_url?: string;
    redirect_url?: string;
    payment_status?: string;
    checkout_id?: number;
    checkout_reference?: string;
    request_ids?: number[];
    final_price?: number;
}

export interface CartCheckoutResult {
    status: boolean;
    statusCode?: number;
    message?: string;
    data?: CartCheckoutItems;
    items?: CartCheckoutItems;
    redirect_url?: string;
    payment_url?: string;
}

async function cartCheckoutRequest(payload: CartCheckoutPayload): Promise<CartCheckoutResult> {
    const fd = new FormData();
    fd.append("payment_type", payload.payment_type);
    if (payload.coupon_code) fd.append("coupon_code", payload.coupon_code);

    const res = await http.post(`${API_BASE_URL}/cart/checkout`, fd);
    return res.data as CartCheckoutResult;
}

export function useCartCheckout(options?: {
    onSuccess?: (data: CartCheckoutResult) => void;
    onError?: (msg: string) => void;
}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CartCheckoutPayload) => cartCheckoutRequest(payload),
        onSuccess: (data) => {
            if (data.status) {
                // Invalidate cart so badge resets
                queryClient.invalidateQueries({ queryKey: ["cart"] });

            }
            options?.onSuccess?.(data);
        },
        onError: (e: any) => {
            const msg = e?.response?.data?.message || e?.message || "Checkout failed";
            options?.onError?.(msg);
        },
    });
}
