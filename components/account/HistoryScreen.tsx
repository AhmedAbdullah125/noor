"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList } from "lucide-react";
import AppHeader from "../AppHeader";
import { getBookings, type BookingItem } from "../services/getBookings";
import { translations, getLang } from "@/services/i18n";

// ─── module-level cache (survives unmount) ────────────────────────────────────
const CACHE_TTL_MS = 60_000; // 1 minute
let _cachedItems: BookingItem[] | null = null;
let _cacheTimestamp = 0;
let _savedScrollTop = 0;
// ─────────────────────────────────────────────────────────────────────────────

type UiBooking = {
    id: string;
    status: string;
    date: string;
    packageName: string;
    total: string;
};

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

export default function HistoryScreen({
    onBack,
    onNavigateToHome,
    onOpenOrder,
}: {
    onBack: () => void;
    onNavigateToHome: () => void;
    onOpenOrder: (id: string) => void;
}) {
    const [isLoading, setIsLoading] = useState(() => _cachedItems === null);
    const [items, setItems] = useState<BookingItem[]>(() => _cachedItems ?? []);
    const lang = getLang();
    const t = translations[lang] || translations['ar'];
    const scrollRef = useRef<HTMLDivElement>(null);

    function formatMoney(val: string) {
        const n = Number(String(val).replace(/[^\d.]/g, ""));
        if (!Number.isFinite(n)) return val;
        return `${n.toFixed(3)} ${t.currency}`;
    }

    // ── Fetch (or serve from cache) ───────────────────────────────────────────
    useEffect(() => {
        const now = Date.now();
        const cacheValid = _cachedItems !== null && (now - _cacheTimestamp) < CACHE_TTL_MS;

        if (cacheValid) {
            setItems(_cachedItems!);
            setIsLoading(false);
            return;
        }

        let mounted = true;
        setIsLoading(true);

        (async () => {
            const res = await getBookings(lang);
            if (!mounted) return;

            if (res.ok) {
                _cachedItems = res.data;
                _cacheTimestamp = Date.now();
                setItems(res.data);
            }
            setIsLoading(false);
        })();

        return () => { mounted = false; };
    }, []);

    // ── Restore scroll position after mount / data ready ─────────────────────
    useEffect(() => {
        if (isLoading) return;
        const el = scrollRef.current;
        if (el && _savedScrollTop > 0) {
            el.scrollTop = _savedScrollTop;
        }
    }, [isLoading]);

    // ── Save scroll position on scroll ────────────────────────────────────────
    const handleScroll = () => {
        if (scrollRef.current) {
            _savedScrollTop = scrollRef.current.scrollTop;
        }
    };

    const bookings: UiBooking[] = useMemo(() => {
        const sorted = [...items].sort((a, b) => {
            const da = new Date(`${a.start_date}T${a.start_time || "00:00:00"}`).getTime();
            const db = new Date(`${b.start_date}T${b.start_time || "00:00:00"}`).getTime();
            return db - da;
        });

        return sorted.map((x) => ({
            id: String(x.id),
            status: mapStatusLabel(x.status, x.is_confirmed),
            date: `${x.start_date} ${formatTime(x.start_time)}`.trim(),
            packageName: x.service || t.specificService,
            total: formatMoney(x.final_price),
        }));
    }, [items, t.specificService]);

    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AppHeader title={t.bookingHistoryTitle} onBack={onBack} />

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24"
            >
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-[2rem] h-40 animate-pulse border border-app-card/30" />
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
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
                        {items
                            .slice()
                            .sort((a, b) => {
                                const da = new Date(`${a.start_date}T${a.start_time || "00:00:00"}`).getTime();
                                const db = new Date(`${b.start_date}T${b.start_time || "00:00:00"}`).getTime();
                                return db - da;
                            })
                            .map((order) => {
                                const pill = statusPillClass(order.status, order.is_confirmed);
                                const label = mapStatusLabel(order.status, order.is_confirmed);
                                const dateStr = `${order.start_date} ${formatTime(order.start_time)}`.trim();

                                return (
                                    <div key={order.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm font-semibold text-app-text">{t.bookingId}: {order.request_number}</span>
                                            <span className={`text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap ${pill}`}>
                                                {label}
                                            </span>
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
                                            onClick={() => onOpenOrder(String(order.id))}
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

