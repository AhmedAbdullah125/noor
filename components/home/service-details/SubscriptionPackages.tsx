import React from "react";
import { ShoppingBag } from "lucide-react";
import { Product, ServiceSubscription } from "../../../types";
import { parsePrice } from "./utils";

type Props = {
    product: Product;
    priceData: {
        total: number;
    };
    canSubscribe: boolean;
    creating: boolean;
    handleSubscriptionClick: (sub: ServiceSubscription) => void;
    handleSingleSessionClick: () => void;
    t: any;
    isAr: boolean;
};

export const SubscriptionPackages: React.FC<Props> = ({
    product,
    priceData,
    canSubscribe,
    creating,
    handleSubscriptionClick,
    handleSingleSessionClick,
    t,
    isAr
}) => {
    const hasAddons = (product as any)?.addonGroups?.length > 0 || ((product as any)?.addons?.length ?? 0) > 0;
    const basePrice = parsePrice((product as any)?.price ?? (product as any)?.current_price ?? 0);

    if (basePrice === 0 && !hasAddons) return null;

    return (
        <div className="px-8 mb-10 space-y-3 pb-28">
            {product.subscriptions && product.subscriptions.length > 0 ? (
                <div className="space-y-4">
                    {product.subscriptions.map((sub: any) => {
                        const sessionsCount = sub.sessionsCount ?? sub.session_count ?? 1;
                        const fixedPrice = parsePrice(sub.fixedPrice ?? sub.fixed_price ?? 0);
                        const pricePercent = parsePrice(sub.pricePercent ?? sub.price_percentage ?? 100);
                        const originalTotal = priceData.total * sessionsCount;
                        const computedFinal = originalTotal * (pricePercent / 100);
                        const finalTotal = fixedPrice > 0 ? fixedPrice : computedFinal;

                        return (
                            <div key={sub.id} className="w-full">
                                {sub.titleText || sub.title || sub.name ? (
                                    <p className="text-xs font-semibold text-app-text mb-1.5 px-1">{sub.titleText || sub.title || sub.name}</p>
                                ) : null}

                                <button onClick={() => handleSubscriptionClick(sub)} disabled={creating || !canSubscribe}
                                    className="w-full bg-app-gold text-white font-semibold py-3 px-4 rounded-2xl shadow-lg shadow-app-gold/20 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between disabled:opacity-60"
                                >
                                    <div className="flex flex-col items-start gap-1">
                                        <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-normal">{sessionsCount} {sessionsCount === 1 ? t.session : t.sessions}</div>
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag size={18} />
                                            {sessionsCount === 1 && (
                                                <span className="text-sm">{t.bookSession}</span>
                                            )}
                                            {sessionsCount > 1 && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm">{isAr ? "احجزي الان " : "Book Now"}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-semibold">{finalTotal.toFixed(3)} {t.currency}</span>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <button
                    onClick={handleSingleSessionClick}
                    disabled={creating || !canSubscribe}
                    className="w-full bg-app-gold text-white font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-app-gold/30 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between disabled:opacity-60"
                >
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={20} />
                        <span>{creating ? t.bookingInProgress : t.bookNow}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{priceData.total.toFixed(3)} {t.currency}</span>
                    </div>
                </button>
            )}
        </div>
    );
};
