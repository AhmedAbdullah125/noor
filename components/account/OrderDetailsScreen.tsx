"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    CalendarDays, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    CreditCard, 
    FileText,
    Receipt
} from "lucide-react";
import AppHeader from "../AppHeader";
import { translations, getLang } from "@/services/i18n";
import { getBookings, type BookingItem } from "../services/getBookings";
import { DEMO_PRODUCTS, FALLBACK_IMAGE_URL } from "../../constants";

export default function OrderDetailsScreen({
    onBack,
}: {
    onBack: () => void;
}) {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const lang = getLang();
    const t = translations[lang] || translations['ar'];
    const isAr = lang === 'ar';

    const [booking, setBooking] = useState<BookingItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setIsLoading(true);
                const res = await getBookings(lang);
                if (!mounted) return;

                if (res.ok) {
                    const found = res.data.find(it => String(it.id) === orderId);
                    if (found) {
                        setBooking(found);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch booking details:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [orderId, lang]);

    const formatMoney = (val?: string) => {
        if (!val) return `0.000 ${t.currency}`;
        const n = Number(val);
        return `${n.toFixed(3)} ${t.currency}`;
    };

    const normalizeTime = (t?: string) => {
        if (!t) return "";
        return t.slice(0, 5);
    };

    const getStatusStyle = (status: string) => {
        const s = String(status || "").toLowerCase();
        if (s === 'confirmed' || s === 'completed') return 'bg-green-100 text-green-700 border-green-200';
        if (s === 'cancelled' || s === 'canceled') return 'bg-red-100 text-red-700 border-red-200';
        if (s === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getStatusLabel = (status: string) => {
        const s = String(status || "").toLowerCase();
        if (s === 'confirmed') return t.confirmed || "مؤكد";
        if (s === 'pending') return t.pending || "قيد الانتظار";
        if (s === 'cancelled' || s === 'canceled') return t.cancelled || "ملغي";
        if (s === 'completed') return t.completed || "مكتمل";
        return status;
    };

    const serviceInfo = useMemo(() => {
        if (!booking) return null;
        const name = booking.service.trim();
        const found = DEMO_PRODUCTS.find(p => p.name === name || name.includes(p.name) || p.name.includes(name));
        return {
            name: booking.service,
            image: found?.image || FALLBACK_IMAGE_URL
        };
    }, [booking]);

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-app-bg animate-fadeIn">
                <AppHeader title={t.bookingDetails} onBack={onBack} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-app-gold border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="flex flex-col h-full bg-app-bg">
                <AppHeader title={t.bookingDetails} onBack={onBack} />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-app-text mb-2">{t.errorLoading || "حدث خطأ"}</h3>
                    <p className="text-sm text-app-textSec mb-6">{t.noResults || "لم يتم العثور على هذا الحجز"}</p>
                    <button
                        onClick={onBack}
                        className="bg-app-gold text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
                    >
                        {t.back || "العودة"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg relative overflow-hidden min-h-screen" dir={isAr ? 'rtl' : 'ltr'}>
            <AppHeader title={t.bookingDetails} onBack={onBack} />

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-24 pb-28 space-y-6">
                
                {/* 1) Status Banner if Unpaid */}
                {booking.payment_status === 'un_paid' && (
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 text-orange-600 animate-slideDown">
                        <AlertCircle size={20} />
                        <span className="font-semibold text-sm">
                            {isAr ? 'هذا الحجز غير مدفوع' : 'This booking is unpaid'}
                        </span>
                    </div>
                )}

                {/* 2) Main Summary Card */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-app-card/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-app-gold/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    
                    <div className="flex justify-between items-start mb-6 relative">
                        <div className="max-w-[70%]">
                            <h2 className="text-[10px] font-bold text-app-gold uppercase tracking-wider mb-1 opacity-60">
                                {t.bookingId}: {booking.request_number}
                            </h2>
                            <h3 className="text-lg font-bold text-app-text leading-tight">{serviceInfo?.name}</h3>
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border-2 ${getStatusStyle(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 py-4 border-t border-app-bg/60">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 text-app-textSec">
                                <CalendarDays size={14} className="text-app-gold" />
                                <span className="text-[11px] font-semibold">{t.bookingDate}</span>
                            </div>
                            <span className="text-sm font-bold text-app-text" dir="ltr">{booking.start_date}</span>
                        </div>
                        <div className="w-px h-8 bg-app-bg" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 text-app-textSec">
                                <Clock size={14} className="text-app-gold" />
                                <span className="text-[11px] font-semibold">{t.startSlot || "وقت البدء"}</span>
                            </div>
                            <span className="text-sm font-bold text-app-text" dir="ltr">{normalizeTime(booking.start_time)}</span>
                        </div>
                    </div>
                </div>

                {/* 3) Pricing Details Card */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-app-card/30">
                    <div className="flex items-center gap-2 mb-5">
                        <Receipt size={18} className="text-app-gold" />
                        <h4 className="text-sm font-bold text-app-text">{t.priceDetails || "تفاصيل السعر"}</h4>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-app-textSec font-medium">{t.startingFrom || "السعر الأساسي"}</span>
                            <span className="text-app-text font-bold" dir="ltr">{formatMoney(booking.base_price)}</span>
                        </div>
                        
                        {(Number(booking.options_price) > 0) && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-app-textSec font-medium">{t.addons || "الإضافات"}</span>
                                <span className="text-app-text font-bold" dir="ltr">+{formatMoney(booking.options_price)}</span>
                            </div>
                        )}

                        <div className="pt-4 border-t border-dashed border-app-bg flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-app-text">{t.total}</span>
                                <span className="text-[10px] text-app-textSec font-medium">
                                    {isAr ? 'شامل الرسوم والضرائب' : 'Incl. taxes and fees'}
                                </span>
                            </div>
                            <span className="text-xl font-black text-app-gold" dir="ltr">
                                {formatMoney(booking.final_price)}
                            </span>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mt-6 p-4 bg-app-bg/40 rounded-2xl flex items-center justify-between border border-app-card/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-app-gold shadow-sm">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-app-textSec uppercase tracking-tight">
                                    {t.paymentMethod || "طريقة الدفع"}
                                </span>
                                <span className="text-xs font-bold text-app-text uppercase">{booking.payment_type.replace('_', ' ')}</span>
                            </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                            booking.payment_status === 'paid' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'
                        }`}>
                            {booking.payment_status === 'paid' ? (t.paid || "مدفوع") : (t.unpaid || "غير مدفوع")}
                        </div>
                    </div>
                </div>

                {/* 4) Additional Info / Note */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-app-card/30">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={18} className="text-app-gold" />
                        <h4 className="text-sm font-bold text-app-text">{t.importantNotes || "ملاحظات هامة"}</h4>
                    </div>
                    <ul className="space-y-3">
                        {[
                            isAr ? 'يرجى الحضور قبل الموعد بـ 10 دقائق.' : 'Please arrive 10 minutes before your slot.',
                            isAr ? 'يمكنك إلغاء أو تعديل الموعد قبل 24 ساعة من البدء.' : 'You can cancel or reschedule 24 hours before starts.',
                            isAr ? 'في حال عدم الحضور، قد يتم تطبيق رسوم إلغاء.' : 'No-shows may be subject to cancellation fees.'
                        ].map((note, i) => (
                            <li key={i} className="flex gap-3 text-xs text-app-textSec leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-app-gold/30 mt-1.5 shrink-0" />
                                <span>{note}</span>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
}
