"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, ShoppingBag, X } from "lucide-react";
import AppHeader from "../AppHeader";
import { getBookings, type BookingItem } from "../services/getBookings";
import { translations, getLang } from "@/services/i18n";

function formatTime(t?: string) {
    if (!t) return "";
    return t.slice(0, 5);
}



function mapStatusLabel(status: string, isConfirmed: boolean) {
    const lang = getLang();
    const t = translations[lang] || translations['ar'];
    const s = String(status || "").toLowerCase();
    if (isConfirmed || s === "confirmed") return t.confirmed;
    if (s === "pending") return t.pending;
    if (s === "cancelled" || s === "canceled") return t.cancelled;
    if (s === "completed") return t.completed;
    return status;
}

function statusPillClass(status: string, isConfirmed: boolean) {
    const s = String(status || "").toLowerCase();
    if (isConfirmed || s === "confirmed") return "bg-green-50 text-green-600";
    if (s === "pending") return "bg-yellow-50 text-yellow-700";
    if (s === "cancelled" || s === "canceled") return "bg-red-50 text-red-600";
    if (s === "completed") return "bg-blue-50 text-blue-700";
    return "bg-gray-50 text-gray-600";
}

export default function OrderDetailsScreen({
    onBack,
    onNavigateToHome,
}: {
    onBack: () => void;
    onNavigateToHome: () => void;
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState<BookingItem[]>([]);
    const [openId, setOpenId] = useState<string | null>(null);
    const lang = getLang();
    const t = translations[lang] || translations['ar'];

    function formatMoney(val: string) {
        const n = Number(String(val).replace(/[^\d.]/g, ""));
        if (!Number.isFinite(n)) return val;
        return `${n.toFixed(3)} ${t.currency}`;
    }

    useEffect(() => {
        let mounted = true;

        (async () => {
            setIsLoading(true);
            const res = await getBookings(lang);
            if (!mounted) return;
            if (res.ok) setItems(res.data);
            setIsLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const sortedItems = useMemo(() => {
        return items
            .slice()
            .sort((a, b) => {
                const da = new Date(`${a.start_date}T${a.start_time || "00:00:00"}`).getTime();
                const db = new Date(`${b.start_date}T${b.start_time || "00:00:00"}`).getTime();
                return db - da;
            });
    }, [items]);

    const selected = useMemo(() => {
        if (!openId) return null;
        return items.find((x) => String(x.id) === openId) ?? null;
    }, [openId, items]);

    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AppHeader title={t.bookingHistoryTitle} onBack={onBack} />

            {selected && (
                <div
                    className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setOpenId(null)}
                >
                    <div
                        className="bg-app-bg w-full max-w-[420px] rounded-[2rem] overflow-hidden shadow-2xl border border-app-card/30 animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-app-card/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-app-bg rounded-xl text-app-gold">
                                    <ShoppingBag size={20} />
                                </div>
                                <span className="text-sm font-semibold text-app-text">{t.bookingDetails}</span>
                            </div>

                            <button
                                onClick={() => setOpenId(null)}
                                className="p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors active:scale-95"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 pb-6 pt-5 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs text-app-textSec">
                                        <span>{t.bookingId}</span>
                                        <span className="font-semibold text-app-text" dir="ltr">
                                            {selected.request_number}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-xs text-app-textSec">
                                        <span>{t.serviceLabel}</span>
                                        <span className="font-semibold text-app-text">{selected.service || t.specificService}</span>
                                    </div>

                                    <div className="flex justify-between text-xs text-app-textSec">
                                        <span>{t.bookingDate}</span>
                                        <span className="font-normal text-app-text" dir="ltr">
                                            {`${selected.start_date} ${formatTime(selected.start_time)}`.trim()}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-xs text-app-textSec">
                                        <span>{t.status}</span>
                                        <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${statusPillClass(selected.status, selected.is_confirmed)}`}>
                                            {mapStatusLabel(selected.status, selected.is_confirmed)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-xs text-app-textSec">
                                        <span>{t.payment}</span>
                                        <span className="font-semibold text-app-text">{selected.payment_type || "-"}</span>
                                    </div>

                                    <div className="flex justify-between text-xs text-app-textSec">
                                        <span>{t.paymentStatus}</span>
                                        <span className="font-semibold text-app-text">{selected.payment_status || "-"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs text-app-textSec">
                                        <span>{t.basePrice}</span>
                                        <span className="font-semibold text-app-text">{formatMoney(String(selected.base_price ?? "0"))}</span>
                                    </div>

                                    <div className="flex justify-between text-xs text-app-textSec">
                                        <span>{t.addonsPrice}</span>
                                        <span className="font-semibold text-app-text">{formatMoney(String(selected.options_price ?? "0"))}</span>
                                    </div>

                                    <div className="pt-3 flex justify-between items-center">
                                        <span className="text-sm font-semibold text-app-text">{t.grandTotal}</span>
                                        <span className="text-base font-semibold text-app-gold">{formatMoney(String(selected.final_price ?? "0"))}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setOpenId(null)}
                                className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
                            >
                                {t.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-[2rem] h-40 animate-pulse border border-app-card/30" />
                        ))}
                    </div>
                ) : sortedItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-app-gold/40 border border-app-card/30">
                            <ClipboardList size={48} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-base font-semibold text-app-text mb-6">{t.noBookings}</h2>
                        <button
                            onClick={onNavigateToHome}
                            className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
                        >
                            {t.exploreServices}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedItems.map((order) => {
                            const pill = statusPillClass(order.status, order.is_confirmed);
                            const label = mapStatusLabel(order.status, order.is_confirmed);
                            const dateStr = `${order.start_date} ${formatTime(order.start_time)}`.trim();

                            return (
                                <div key={order.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-semibold text-app-text">{t.bookingId}: {order.request_number}</span>
                                        <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${pill}`}>{label}</span>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-xs text-app-textSec">
                                            <span>{t.bookingDate}:</span>
                                            <span className="font-normal" dir="ltr">
                                                {dateStr}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-app-textSec">
                                            <span>{t.serviceLabel}:</span>
                                            <span className="font-normal">{order.service || t.specificService}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-semibold text-app-text">
                                            <span>{t.total}:</span>
                                            <span className="text-app-gold">{formatMoney(order.final_price)}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setOpenId(String(order.id))}
                                        className="w-full py-3 text-app-gold font-semibold text-sm bg-app-bg rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    >
                                        {t.viewBookingDetails}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
