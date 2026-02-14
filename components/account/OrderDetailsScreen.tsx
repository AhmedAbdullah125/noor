"use client";

import React from "react";
import AppHeader from "../AppHeader";
import { translations, getLang } from "@/services/i18n";
import { Order } from "../../App";

export default function OrderDetailsScreen({
    order,
    onBack,
}: {
    order: Order | null;
    onBack: () => void;
}) {
    const lang = getLang();
    const t = translations[lang] || translations['ar'];
    const isAr = lang === 'ar';

    if (!order) {
        return (
            <div className="flex flex-col h-full bg-app-bg">
                <AppHeader title={t.bookingDetails} onBack={onBack} />
                <div className="flex-1 flex items-center justify-center text-app-textSec">
                    <p>{t.noResults || "Order not found"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg" dir={isAr ? 'rtl' : 'ltr'}>
            <AppHeader title={t.bookingDetails} onBack={onBack} />

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-28">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30 space-y-4">

                    {/* Header Info */}
                    <div className="flex justify-between items-center border-b border-app-card/30 pb-4">
                        <span className="text-sm font-semibold text-app-text">#{order.id}</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold 
                            ${order.status === 'completed' ? 'bg-green-50 text-green-600' :
                                order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                    'bg-yellow-50 text-yellow-600'}`}>
                            {order.status || t.pending}
                        </span>
                    </div>

                    {/* Date */}
                    <div className="flex justify-between text-xs text-app-textSec">
                        <span>{t.bookingDate}</span>
                        <span className="text-app-text font-medium" dir="ltr">{order.date} {order.time}</span>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-semibold text-app-text">{t.services || "Services"}</h3>
                        {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-xs bg-gray-50 p-3 rounded-xl">
                                <div>
                                    <p className="font-medium text-app-text">
                                        {isAr ? (item.product as any).name : (item.product as any).nameEn || (item.product as any).name}
                                        {item.quantity > 1 && ` x${item.quantity}`}
                                    </p>
                                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                                        <p className="text-app-textSec mt-1 text-[10px]">
                                            + {item.selectedAddons.map(a => isAr ? a.title_ar : a.title_en || a.title_ar).join(", ")}
                                        </p>
                                    )}
                                </div>
                                <span className="font-semibold text-app-text">
                                    {(item.customFinalPrice || Number(item.product.price) * item.quantity).toFixed(3)} {t.currency}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-app-card/30 flex justify-between items-center">
                        <span className="text-sm font-bold text-app-text">{t.total}</span>
                        <span className="text-base font-bold text-app-gold">{order.total} {t.currency}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
