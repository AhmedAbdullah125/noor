import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";
import { getLang } from "@/services/i18n";
import { http } from "./http";

export interface CartCheckoutPayload {
    payment_type: string; // e.g. "knet", "wallet", "credit_card"
    coupon_code?: string;
}

export interface CartCheckoutItems {
    payment_url?: string;
    redirect_url?: string;
    status?: string;
    provider_status?: string;
    payment_status?: string;
    checkout_id?: number;
    checkout_reference?: string;
    request_ids?: number[];
    request_numbers?: string[];
    order_number?: string;
    final_price?: number;
    payment_type?: string;
}

export type CompleteCartCheckoutItems = CartCheckoutItems & {
    payment_status: string;
    request_numbers: string[];
    order_number: string;
    final_price: number;
    payment_type: string;
};

export function isCompleteCartCheckoutItems(value: unknown): value is CompleteCartCheckoutItems {
    if (!value || typeof value !== "object") return false;

    const checkout = value as CartCheckoutItems;
    return typeof checkout.payment_status === "string"
        && checkout.payment_status.length > 0
        && Array.isArray(checkout.request_numbers)
        && checkout.request_numbers.length > 0
        && checkout.request_numbers.every((number) => typeof number === "string" && number.length > 0)
        && typeof checkout.order_number === "string"
        && checkout.order_number.length > 0
        && typeof checkout.final_price === "number"
        && Number.isFinite(checkout.final_price)
        && typeof checkout.payment_type === "string"
        && checkout.payment_type.length > 0;
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

    const res = await http.post(`${API_BASE_URL}/cart/checkout`, fd, {
        headers: { lang: getLang() },
    });
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
            if (!data.status) {
                options?.onError?.(data.message || "Checkout failed");
                return;
            }

            // Invalidate cart so badge resets
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            options?.onSuccess?.(data);
        },
        onError: (e: any) => {
            const msg = e?.response?.data?.message || e?.message || "Checkout failed";
            options?.onError?.(msg);
        },
    });
}
