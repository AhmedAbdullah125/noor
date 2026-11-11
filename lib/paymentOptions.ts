// Category-level payment restrictions (pay at salon vs online).
// Missing flags always mean "allowed" so older backends keep today's behaviour.

export const AT_SALON_CODES = ["cash"];
export const ONLINE_CODES = ["knet", "apple_pay", "Visa/Master", "taly", "deema", "wallet"];

export type PaymentFlags = {
    allowPayAtSalon?: boolean | null;
    allowPayOnline?: boolean | null;
};

export function filterPaymentMethods<T extends { code: string }>(
    methods: T[],
    { allowPayAtSalon, allowPayOnline }: PaymentFlags,
): T[] {
    return methods.filter((method) => {
        if (AT_SALON_CODES.includes(method.code)) return allowPayAtSalon !== false;
        if (ONLINE_CODES.includes(method.code)) return allowPayOnline !== false;
        return true;
    });
}

export function defaultPaymentCode({ allowPayOnline }: PaymentFlags): string {
    return allowPayOnline !== false ? "wallet" : "cash";
}

export type PaymentRestriction = "salon_only" | "online_only" | null;

export function getPaymentRestriction({ allowPayAtSalon, allowPayOnline }: PaymentFlags): PaymentRestriction {
    if (allowPayAtSalon !== false && allowPayOnline === false) return "salon_only";
    if (allowPayOnline !== false && allowPayAtSalon === false) return "online_only";
    return null;
}

// The public payment-methods catalogue has no "cash" row today, so customers
// never see it. When a service can only be paid at the salon, add a
// pay-at-salon option so it can still be booked. Unrestricted services keep
// exactly today's list.
export function withAtSalonOption<T extends { id: number; name_ar: string; name_en: string; code: string; icon: string; is_active: boolean; sort_order: number }>(
    methods: T[],
    needed: boolean,
    label: { ar: string; en: string },
): T[] {
    if (!needed || methods.some((m) => AT_SALON_CODES.includes(m.code))) return methods;
    return [
        { id: 9992, name_ar: label.ar, name_en: label.en, code: "cash", icon: "", is_active: true, sort_order: -1 } as T,
        ...methods,
    ];
}
