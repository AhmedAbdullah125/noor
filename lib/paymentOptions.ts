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
