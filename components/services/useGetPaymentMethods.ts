import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";
import { getLang, translations } from "../../services/i18n";
import { getAccessToken } from "../auth/authStorage";

export interface PaymentMethod {
    id: number;
    name_ar: string;
    name_en: string;
    code: string;
    icon: string;
    is_active: boolean;
    sort_order: number;
}

async function fetchPaymentMethods(amount: number, lang: string, walletLabel: string, headers: any): Promise<PaymentMethod[]> {
    const res = await fetch(
        `${API_BASE_URL}/payment-methods?per_page=10&is_active=1&amounts=${amount}`,
        { headers }
    );
    const data = await res.json();

    if (!data.status || !Array.isArray(data.data?.data)) return [];

    const methods: PaymentMethod[] = data.data.data;

    // Inject wallet option if not already present
    if (!methods.find((m) => m.code === "wallet")) {
        methods.push({
            id: 9991,
            name_ar: walletLabel,
            name_en: walletLabel,
            code: "wallet",
            icon: "",
            is_active: true,
            sort_order: 999,
        });
    }

    return methods;
}

export function useGetPaymentMethods(amount: number) {
    const lang = getLang();
    const t = translations[lang];
    const token = getAccessToken();
    const headers = {
        lang,
        "x-skip-auth": "1",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return useQuery<PaymentMethod[]>({
        queryKey: ["payment-methods", amount, lang],
        queryFn: () => fetchPaymentMethods(amount, lang, t.wallet, headers),
        enabled: amount > 0,
        staleTime: 1000 * 60 * 5,
    });
}
