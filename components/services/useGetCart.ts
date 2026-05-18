"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "./http";
import { isLoggedIn } from "../auth/authStorage";
import { API_BASE_URL } from "@/lib/apiConfig";
import { getLang } from "../../services/i18n";

export type CartOption = {
    id: number;
    cart_item_id: number;
    option_id: number;
    option_value_id: number;
    price: string;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
};

export type CartItem = {
    id: number;
    service_id: number;
    subscription_id: number | null;
    session_count: number;
    start_date: string;
    start_time: string;
    customer_notes: string | null;
    base_price: number;
    options_price: number;
    total_price: number;
    options: CartOption[];
    service_name: string;
};

export type Cart = {
    id: number;
    status: string;
    coupon_code: string | null;
    subtotal: number;
    discount_amount: number;
    total: number;
    items: CartItem[];
};

async function fetchCart(lang: string): Promise<Cart> {
    const res = await http.get(`${API_BASE_URL}/cart`, { headers: { lang } });
    return res.data?.data as Cart;
}

export function useGetCart(lang: string = getLang()) {
    return useQuery<Cart>({
        queryKey: ["cart", lang],
        queryFn: () => fetchCart(lang),
        enabled: isLoggedIn(),
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 2,
        retry: (count, err: any) => {
            if (err?.isUnauthorized) return false;
            return count < 2;
        },
    });
}
