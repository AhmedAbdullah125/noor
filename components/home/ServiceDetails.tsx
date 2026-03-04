"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, CreditCard, Loader2, ShoppingBag, ShoppingCart, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import parse from "html-react-parser";
import { motion, AnimatePresence } from "framer-motion";

import ImageCarousel from "../ImageCarousel";
import { Product, ServiceAddon, ServiceAddonGroup, ServiceSubscription, } from "../../types";
import { createRequest } from "../services/createRequest";
import { useAddToCart } from "../services/useAddToCart";
import { useNavigate } from "react-router-dom";
import { getLang, translations } from "../../services/i18n";
import { API_BASE_URL } from "@/lib/apiConfig";
import { useGetProfile } from "../services/useGetProfile";
import { useGetPaymentMethods, PaymentMethod } from "../services/useGetPaymentMethods";

type Props = {
    product: Product;
    onBack: () => void;
    onCreated?: (data: any) => void;
};



function parsePrice(val: any): number {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    const s = String(val);
    const n = parseFloat(s.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function getTodayDate() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}


const timeSlots: string[] = [];

// 12 PM to 4 PM
for (let h = 12; h <= 16; h++) {
    timeSlots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 16) {
        timeSlots.push(`${String(h).padStart(2, "0")}:30`);
    }
}

// 9 PM to 12 AM
for (let h = 21; h <= 23; h++) {
    timeSlots.push(`${String(h).padStart(2, "0")}:00`);
    timeSlots.push(`${String(h).padStart(2, "0")}:30`);
}
timeSlots.push("00:00");

export default function ServiceDetails({ product, onBack, onCreated }: Props) {
    const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
    const lang = getLang();
    const t = translations[lang];
    const isAr = lang === 'ar';

    const navigate = useNavigate();
    const [creating, setCreating] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);

    const { mutate: addToCart, isPending: addingToCart } = useAddToCart({
        successMessage: t.addToCartSuccess,
        onSuccess: () => {
            setCartAdded(true);
            setBookingStep(3);
        },
    });
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const descriptionCharLimit = 150;

    const [bookingModal, setBookingModal] = useState<{
        subscriptionId: number | null;
        title: string;
        sessionsCount: number;
        validityDays: number;
        finalTotal: number;
    } | null>(null);

    const [paymentType, setPaymentType] = useState<string>("wallet");

    const [startDate, setStartDate] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [showPolicyConfirm, setShowPolicyConfirm] = useState(false);
    const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

    const { data: profile } = useGetProfile(lang);
    const [couponCode, setCouponCode] = useState("");
    const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
    const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string; discount_type?: string; discount_value?: number } | null>(null);
    const [isCouponApplied, setIsCouponApplied] = useState(false);

    // Parse wallet balance safely
    const walletBalance = useMemo(() => {
        return parsePrice(profile?.wallet ?? 0);
    }, [profile?.wallet]);

    const isWalletInsufficient = useMemo(() => {
        if (paymentType !== 'wallet' || !bookingModal) return false;
        return walletBalance < bookingModal.finalTotal;
    }, [paymentType, bookingModal, walletBalance]);

    useEffect(() => {
        setSelectedAddonIds(new Set());
        setBookingModal(null);
        setPaymentType("wallet");
        setStartDate("");
        setStartTime("");
        setShowPolicyConfirm(false);
        setCouponCode("");
        setIsCheckingCoupon(false);
        setCouponStatus(null);
        setIsCouponApplied(false);
    }, [product?.id]);

    const resolvedAddonGroups: ServiceAddonGroup[] = useMemo(() => {
        return product?.addonGroups ? [...product.addonGroups] : [];
    }, [product]);

    const basePrice = useMemo(() => {
        return parsePrice((product as any)?.price ?? (product as any)?.current_price ?? 0);
    }, [product]);

    const addonsTotal = useMemo(() => {
        let sum = 0;

        const legacyAddons: ServiceAddon[] = (product as any)?.addons ?? [];
        legacyAddons.forEach((a) => {
            if (selectedAddonIds.has(a.id)) sum += parsePrice((a as any).price_kwd ?? 0);
        });

        resolvedAddonGroups.forEach((g) => {
            g.options?.forEach((opt: any) => {
                if (selectedAddonIds.has(opt.id)) sum += parsePrice(opt.price_kwd ?? opt.price ?? 0);
            });
        });

        return sum;
    }, [product, resolvedAddonGroups, selectedAddonIds]);

    const total = useMemo(() => basePrice + addonsTotal, [basePrice, addonsTotal]);

    const priceData = useMemo(
        () => ({
            base: basePrice,
            addons: addonsTotal,
            total,
            display: `${total.toFixed(3)} ${t.currency}`,
            duration: (product as any)?.duration || "0",
        }),
        [basePrice, addonsTotal, total, product, t.currency]
    );

    const { data: paymentMethods = [] } = useGetPaymentMethods(total);


    const getImages = () => {
        const imgs = (product as any)?.images ?? [];
        if (Array.isArray(imgs) && imgs.length > 0) return imgs;
        const fallback = (product as any)?.image;
        return fallback ? [fallback] : [];
    };

    const handleGroupOptionSelect = (groupId: string, optionId: string, type: "single" | "multi") => {
        setSelectedAddonIds((prev) => {
            const next = new Set(prev);

            if (type === "single") {
                const group = resolvedAddonGroups.find((g) => g.id === groupId);
                group?.options?.forEach((opt) => next.delete(opt.id));
                next.add(optionId);
            } else {
                if (next.has(optionId)) next.delete(optionId);
                else next.add(optionId);
            }

            return next;
        });
    };

    const missingRequiredGroups = useMemo(() => {
        return resolvedAddonGroups
            .filter((g: any) => g?.required)
            .filter((g: any) => !(g.options ?? []).some((opt: any) => selectedAddonIds.has(opt.id)));
    }, [resolvedAddonGroups, selectedAddonIds]);

    const canSubscribe = useMemo(() => missingRequiredGroups.length === 0, [missingRequiredGroups]);

    const validateRequiredGroups = () => {
        if (missingRequiredGroups.length === 0) return true;
        toast(`${t.selectRequired}: ${isAr ? missingRequiredGroups[0]?.title_ar : missingRequiredGroups[0]?.title_en || missingRequiredGroups[0]?.title_ar}`, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
        });
        return false;
    };

    const buildRequestOptions = () => {
        const out: { option_id: number; option_value_id: number }[] = [];

        resolvedAddonGroups.forEach((group: any) => {
            const selected = (group.options ?? []).filter((opt: any) => selectedAddonIds.has(opt.id));
            selected.forEach((opt: any) => {
                out.push({
                    option_id: Number(group.id),
                    option_value_id: Number(opt.id),
                });
            });
        });

        const legacyAddons: any[] = (product as any)?.addons ?? [];
        legacyAddons.forEach((a: any) => {
            if (selectedAddonIds.has(a.id)) {
                const optionId = Number(a.option_id ?? a.group_id ?? 0);
                const valueId = Number(a.option_value_id ?? a.id);
                if (optionId) out.push({ option_id: optionId, option_value_id: valueId });
            }
        });

        return out;
    };

    const discountedTotal = useMemo(() => {
        if (!bookingModal || !isCouponApplied || !couponStatus?.valid) return null;
        const subTotal = bookingModal.finalTotal;
        if (couponStatus.discount_type === "fixed") {
            return Math.max(0, subTotal - (couponStatus.discount_value || 0));
        }
        if (couponStatus.discount_type === "percentage") {
            return subTotal * (1 - (couponStatus.discount_value || 0) / 100);
        }
        return null;
    }, [bookingModal, isCouponApplied, couponStatus]);

    const openBookingModal = (data: {
        subscriptionId: number | null;
        title: string;
        sessionsCount: number;
        validityDays: number;
        finalTotal: number;
    }) => {
        if (!validateRequiredGroups()) return;
        setStartDate("");
        setStartTime("");
        setPaymentType("wallet");
        setBookingModal(data);
        setCouponCode("");
        setIsCheckingCoupon(false);
        setCouponStatus(null);
        setIsCouponApplied(false);
        setBookingStep(1);
        setCartAdded(false);
    };

    const handleCheckCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsCheckingCoupon(true);
        setCouponStatus(null);
        setIsCouponApplied(false);

        try {
            const formData = new FormData();
            formData.append("code", couponCode);
            formData.append("service_id", String(product.id));

            const res = await fetch(`${API_BASE_URL}/coupons/check`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (data.status && data.data?.valid) {
                const coupon = data.data.coupon;
                setCouponStatus({
                    valid: true,
                    message: t.couponValid,
                    discount_type: coupon.discount_type,
                    discount_value: parsePrice(coupon.discount_value),
                });
                setIsCouponApplied(true);
            } else {
                setCouponStatus({ valid: false, message: data.data?.message || t.couponInvalid });
                setIsCouponApplied(false);
            }
        } catch (error) {
            console.error("Coupon check failed", error);
            setCouponStatus({ valid: false, message: t.couponInvalid });
            setIsCouponApplied(false);
        } finally {
            setIsCheckingCoupon(false);
        }
    };

    const doCreateRequest = async () => {
        if (creating) return;
        if (!bookingModal) return;
        if (!validateRequiredGroups()) return;

        if (paymentType === 'wallet' && isWalletInsufficient) {
            toast.error(t.insufficientBalance, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return;
        }

        const time = startTime.length === 5 ? `${startTime}:00` : startTime;
        if (!startDate) {
            toast(t.pleaseSelectDate, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return;
        }
        if (!time || time.length < 5) {
            toast(t.pleaseSelectTime, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return;
        }

        setCreating(true);

        const payload = {
            service_id: Number(product.id),
            subscription_id: bookingModal.subscriptionId,
            options: buildRequestOptions(),
            start_date: startDate,
            start_time: time,
            payment_type: paymentType,
            coupon_code: isCouponApplied ? couponCode : undefined,
        };

        const res = await createRequest(payload, "ar", "json");
        setCreating(false);

        if (!res.ok) return;

        if (res.data?.payment_url) {
            toast(t.redirectingPayment, { style: { background: "#198754", color: "#fff", borderRadius: "10px" } });
            window.location.href = res.data.payment_url;
            return;
        }

        toast(t.requestSuccess, { style: { background: "#198754", color: "#fff", borderRadius: "10px" } });
        setBookingModal(null);
        onCreated?.(res.data);
    };

    const handleAddToCart = () => {
        if (!bookingModal) return;
        if (!validateRequiredGroups()) return;

        const time = startTime.length === 5 ? `${startTime}:00` : startTime;
        if (!startDate) {
            toast(t.pleaseSelectDate, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return;
        }
        if (!time || time.length < 5) {
            toast(t.pleaseSelectTime, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return;
        }

        addToCart({
            service_id: Number(product.id),
            subscription_id: bookingModal.subscriptionId,
            options: buildRequestOptions(),
            start_date: startDate,
            start_time: time,
            coupon_code: isCouponApplied && couponCode.trim() ? couponCode : undefined,
            lang,
        });
    };

    const handleSubscriptionClick = (sub: ServiceSubscription) => {
        const sessionsCount = (sub as any).sessionsCount ?? (sub as any).session_count ?? 1;
        const pricePercent = parsePrice((sub as any).pricePercent ?? (sub as any).price_percentage ?? 100);
        const fixedPrice = parsePrice((sub as any).fixedPrice ?? (sub as any).fixed_price ?? 0);

        const originalTotal = priceData.total * sessionsCount;
        const computedFinal = originalTotal * (pricePercent / 100);
        const finalTotal = fixedPrice > 0 ? fixedPrice : computedFinal;

        const title = (sub as any).titleText ?? (sub as any).title ?? (sub as any).name ?? "";
        const validityDays = (sub as any).validityDays ?? (sub as any).validity_days ?? 30;

        openBookingModal({
            subscriptionId: Number((sub as any).id) || null,
            title: title || (isAr ? `باقة ${sessionsCount} جلسات` : `${sessionsCount} Sessions Package`),
            sessionsCount,
            validityDays,
            finalTotal,
        });
    };

    const handleSingleSessionClick = () => {
        openBookingModal({
            subscriptionId: null,
            title: t.bookSession,
            sessionsCount: 1,
            validityDays: 0,
            finalTotal: priceData.total,
        });
    };

    return (
        <div className="pt-2" dir={lang == "ar" ? "rtl" : "ltr"}>
            <AnimatePresence>
                {bookingModal && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/40 z-[140]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setBookingModal(null)}
                        />

                        {/* Bottom Sheet */}
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[1500] flex flex-col max-h-[85vh]"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Sheet Handle */}
                            <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
                                <div className="w-10 h-1 bg-app-card/50 rounded-full" />
                            </div>

                            {/* Step header */}
                            <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3">
                                <div className="flex items-center gap-2">
                                    {bookingStep > 1 && (
                                        <button
                                            onClick={() => setBookingStep((s) => (s - 1) as 1 | 2 | 3)}
                                            className="p-1.5 rounded-full hover:bg-app-bg transition-colors"
                                        >
                                            {isAr ? <ChevronRight size={20} className="text-app-textSec" /> : <ChevronLeft size={20} className="text-app-textSec" />}
                                        </button>
                                    )}
                                    <h3 className="text-base font-bold text-app-text">
                                        {bookingStep === 1 && (isAr ? "التفاصيل والموعد" : "Details & Appointment")}
                                        {bookingStep === 2 && (isAr ? "كود الخصم والدفع" : "Coupon & Checkout")}
                                        {bookingStep === 3 && (isAr ? "طريقة الدفع" : "Payment Method")}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Step dots */}
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3].map((s) => (
                                            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${bookingStep === s ? "w-5 bg-app-gold" : "w-1.5 bg-app-card/40"}`} />
                                        ))}
                                    </div>
                                    <button onClick={() => setBookingModal(null)} className="p-1.5 rounded-full hover:bg-app-bg transition-colors">
                                        <X size={18} className="text-app-textSec" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">

                                {/* ── STEP 1: Service, Date, Time ─────────────────── */}
                                {bookingStep === 1 && (
                                    <>
                                        <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                            <span className="text-xs text-app-textSec">{t.service}</span>
                                            <span className="text-sm font-semibold text-app-text">{product.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                            <span className="text-xs text-app-textSec">{t.package}</span>
                                            <span className="text-sm font-semibold text-app-text">{bookingModal.title}</span>
                                        </div>
                                        {bookingModal.subscriptionId != null && (
                                            <>
                                                <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                                    <span className="text-xs text-app-textSec">{t.sessionsCount}</span>
                                                    <span className="text-sm font-semibold text-app-text">{bookingModal.sessionsCount}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                                    <span className="text-xs text-app-textSec">{t.validity}</span>
                                                    <span className="text-sm font-semibold text-app-text">{bookingModal.validityDays || 30} {t.day}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                            <span className="text-xs text-app-textSec">{t.total}</span>
                                            <span className="text-sm font-bold text-app-gold">{bookingModal.finalTotal.toFixed(3)} {t.currency}</span>
                                        </div>

                                        {/* Date + Time */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-app-bg/60 rounded-xl border border-app-card/30 p-2">
                                                <label className="block text-[11px] font-semibold text-app-text mb-1.5">{t.date}</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-white rounded-xl p-1.5 text-sm outline-none border border-app-card/30 focus:border-app-gold"
                                                    value={startDate}
                                                    min={getTodayDate()}
                                                    onChange={(e) => {
                                                        if (e.target.value && e.target.value < getTodayDate()) return;
                                                        setStartDate(e.target.value);
                                                    }}
                                                />
                                            </div>
                                            <div className="bg-app-bg/60 rounded-xl border border-app-card/30 p-2">
                                                <label className="block text-[11px] font-semibold text-app-text mb-1.5">{t.time}</label>
                                                <select
                                                    className="w-full bg-white rounded-xl p-1.5 text-sm outline-none border border-app-card/30 focus:border-app-gold appearance-none"
                                                    value={startTime.slice(0, 5)}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                >
                                                    <option value="">{t.chooseTime}</option>
                                                    {timeSlots.map((time) => {
                                                        const [hStr, mStr] = time.split(":");
                                                        const h = parseInt(hStr, 10);
                                                        const period = h < 12 ? "ص" : "م";
                                                        const displayH = h % 12 || 12;
                                                        return (
                                                            <option key={time} value={time}>{displayH}:{mStr} {period}</option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const time = startTime.length === 5 ? `${startTime}:00` : startTime;
                                                if (!startDate) { toast(t.pleaseSelectDate, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } }); return; }
                                                if (!time || time.length < 5) { toast(t.pleaseSelectTime, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } }); return; }
                                                setBookingStep(2);
                                            }}
                                            className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-[0.98] transition-transform mt-1"
                                        >
                                            {isAr ? "التالي" : "Next"} →
                                        </button>
                                    </>
                                )}

                                {/* ── STEP 2: Coupon + Add to Cart vs Checkout ─────── */}
                                {bookingStep === 2 && (
                                    <>
                                        {/* Coupon */}
                                        <div className="bg-app-bg/60 rounded-xl border border-app-card/30 p-3">
                                            <label className="block text-[11px] font-semibold text-app-text mb-2">{t.couponCode}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 bg-white rounded-xl px-3 py-2 text-sm outline-none border border-app-card/30 focus:border-app-gold"
                                                    placeholder={t.couponCode}
                                                    value={couponCode}
                                                    onChange={(e) => { setCouponCode(e.target.value); setCouponStatus(null); setIsCouponApplied(false); }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCheckCoupon}
                                                    disabled={isCheckingCoupon || !couponCode.trim()}
                                                    className="bg-app-gold text-white text-xs font-bold px-4 rounded-xl disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    {isCheckingCoupon ? t.checkingCoupon : t.apply}
                                                </button>
                                            </div>
                                            {couponStatus && (
                                                <p className={`text-[10px] mt-1.5 font-medium ${couponStatus.valid ? "text-green-600" : "text-red-500"}`}>
                                                    {couponStatus.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Total with discount */}
                                        <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                            <span className="text-xs text-app-textSec">{t.total}</span>
                                            <div className="flex flex-col items-end">
                                                {discountedTotal !== null ? (
                                                    <>
                                                        <span className="text-[10px] text-app-textSec line-through opacity-60">
                                                            {bookingModal.finalTotal.toFixed(3)} {t.currency}
                                                        </span>
                                                        <span className="text-sm font-bold text-app-gold">{discountedTotal.toFixed(3)} {t.currency}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm font-bold text-app-gold">{bookingModal.finalTotal.toFixed(3)} {t.currency}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <button
                                            onClick={() => setBookingStep(3)}
                                            className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                        >
                                            <CreditCard size={18} />
                                            {isAr ? "المتابعة للدفع" : "Proceed to Checkout"}
                                        </button>

                                        <button
                                            onClick={handleAddToCart}
                                            disabled={addingToCart}
                                            className="w-full bg-white border-2 border-app-gold text-app-gold font-semibold py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {addingToCart
                                                ? <Loader2 size={18} className="animate-spin" />
                                                : <ShoppingBag size={18} />
                                            }
                                            {addingToCart ? t.addingToCart : t.addToCart}
                                        </button>
                                    </>
                                )}

                                {/* ── STEP 3a: Added to Cart — continue or go to cart ─ */}
                                {bookingStep === 3 && cartAdded && (
                                    <motion.div
                                        className="flex flex-col items-center text-center py-4"
                                        initial={{ opacity: 0, scale: 0.88 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                            <ShoppingCart size={32} className="text-green-500" />
                                        </div>
                                        <h3 className="text-base font-bold text-app-text mb-1">
                                            {isAr ? "تمت الإضافة إلى السلة!" : "Added to Cart!"}
                                        </h3>
                                        <p className="text-sm text-app-textSec mb-6">
                                            {isAr ? "يمكنك متابعة التسوق أو الانتقال إلى السلة" : "Continue browsing or head to your cart"}
                                        </p>
                                        <div className="w-full space-y-3">
                                            <button
                                                onClick={() => navigate("/cart")}
                                                className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                            >
                                                <ShoppingCart size={18} />
                                                {isAr ? "الذهاب إلى السلة" : "Go to Cart"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setBookingModal(null)
                                                    navigate("/")
                                                }}
                                                className="w-full bg-white border-2 border-app-gold text-app-gold font-semibold py-4 rounded-2xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                            >
                                                <ShoppingBag size={18} />
                                                {isAr ? "متابعة التسوق" : "Continue Shopping"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── STEP 3b: Payment Method + Confirm ─────────────── */}
                                {bookingStep === 3 && !cartAdded && (
                                    <>
                                        {/* Total reminder */}
                                        <div className="flex justify-between items-center bg-app-bg/60 px-4 py-3 rounded-xl border border-app-card/30">
                                            <span className="text-sm text-app-textSec">{isAr ? "المبلغ الإجمالي" : "Total Amount"}</span>
                                            <span className="text-lg font-bold text-app-gold">
                                                {(discountedTotal ?? bookingModal.finalTotal).toFixed(3)} {t.currency}
                                            </span>
                                        </div>

                                        {/* Wallet warning */}
                                        {isWalletInsufficient && (
                                            <p className="text-[11px] text-red-500 font-medium px-1">
                                                {t.insufficientBalance} ({walletBalance.toFixed(3)} {t.currency})
                                            </p>
                                        )}

                                        {/* Payment methods */}
                                        <div className="space-y-2">
                                            {paymentMethods.map((p) => {
                                                const isActive = paymentType === p.code;
                                                const isApple = p.code === "apple_pay";
                                                return (
                                                    <button
                                                        key={p.code}
                                                        type="button"
                                                        onClick={() => setPaymentType(p.code)}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isActive
                                                            ? isApple ? "bg-black text-white border-black" : "border-app-gold bg-app-gold/5"
                                                            : "border-app-card/30 bg-white"
                                                            }`}
                                                    >
                                                        {p.code === "wallet"
                                                            ? <Wallet size={20} className={isActive ? "text-app-gold" : "text-app-textSec"} />
                                                            : <img src={p.icon} alt={p.name_en} className="h-5 object-contain rounded-sm" />
                                                        }
                                                        <span className={`flex-1 text-sm font-semibold text-start ${isActive && !isApple ? "text-app-gold" : "text-app-text"}`}>
                                                            {isAr ? p.name_ar : p.name_en}
                                                        </span>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? "border-app-gold bg-app-gold" : "border-app-card/50"}`}>
                                                            {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Confirm */}
                                        <button
                                            onClick={doCreateRequest}
                                            disabled={creating || isWalletInsufficient}
                                            className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {creating
                                                ? <Loader2 size={18} className="animate-spin" />
                                                : <Check size={18} />
                                            }
                                            {creating ? t.bookingInProgress : t.agreeAndConfirm}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            {/* Image */}
            <motion.div
                className="px-6 mb-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
                <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-md bg-white border border-app-card/30">
                    <ImageCarousel images={getImages()} alt={product.name} className="w-full h-full" />
                </div>
            </motion.div>

            {/* Product info */}
            <motion.div
                className="px-8 mb-4"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
                <h2 className="text-xl font-semibold text-app-text font-active leading-tight mb-2">{product.name}</h2>
                <div>
                    <div className="text-sm text-app-text/70">
                        {product?.description && product.description.length > descriptionCharLimit ? (
                            <>
                                {isDescriptionExpanded
                                    ? parse(product.description)
                                    : parse(`${product.description.slice(0, descriptionCharLimit)}...`)
                                }
                            </>
                        ) : (
                            product?.description ? parse(product.description) : null
                        )}
                    </div>
                    {product?.description && product.description.length > descriptionCharLimit && (
                        <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="text-xs font-semibold text-app-gold hover:text-app-goldDark transition-colors mt-1 active:scale-95"
                        >
                            {isDescriptionExpanded ? t.showLess : t.showMore}
                        </button>
                    )}
                </div>
                <div className="mt-2 mb-1 flex flex-wrap gap-2">
                    {resolvedAddonGroups.length > 0 && (
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">
                            {t.optionalAddons}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-semibold text-app-gold">{priceData.display}</span>
                        {(product as any).oldPrice && (
                            <span className="text-sm text-app-textSec line-through opacity-60">{(product as any).oldPrice}</span>
                        )}
                    </div>

                    {priceData.addons > 0 && (
                        <div className="text-[10px] text-app-textSec font-normal space-y-0.5">
                            <div className="flex items-center gap-1">
                                <span>{t.basePrice}:</span>
                                <span>{priceData.base.toFixed(3)} {t.currency}</span>
                            </div>
                            <div className="flex items-center gap-1 text-app-gold">
                                <span>{t.addons}:</span>
                                <span>+{priceData.addons.toFixed(3)} {t.currency}</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {resolvedAddonGroups.length > 0 && (
                <div className="px-6 mb-6 space-y-6">
                    {resolvedAddonGroups.map((group) => (
                        <div key={group.id}>
                            <div className="mb-3 flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-app-text">{isAr ? group.title_ar : group.title_en || group.title_ar}</h3>
                                {(group as any).required && (
                                    <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-md font-semibold">{t.required}</span>
                                )}
                            </div>

                            <div className="space-y-2">
                                {(group.options ?? []).map((option: any) => {
                                    const isSelected = selectedAddonIds.has(option.id);
                                    const isRadio = (group as any).type === "single";

                                    return (
                                        <div
                                            key={option.id}
                                            onClick={() => handleGroupOptionSelect(String(group.id), option.id, (group as any).type)}
                                            className={`flex relative items-center justify-between p-3.5 pb-8 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${isSelected ? "bg-app-gold/5 border-app-gold shadow-sm" : "bg-white border-app-card/30 hover:border-app-card"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {isRadio ? (
                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-app-gold" : "border-app-textSec/30"
                                                            }`}
                                                    >
                                                        {isSelected && <div className="w-2.5 h-2.5 bg-app-gold rounded-full" />}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-app-gold border-app-gold" : "border-app-textSec/30"
                                                            }`}
                                                    >
                                                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                )}

                                                <div>
                                                    <p className={`text-sm font-semibold ${isSelected ? "text-app-gold" : "text-app-text"}`}>{isAr ? option.title_ar : option.title_en || option.title_ar}</p>
                                                    {(isAr ? option.desc_ar : option.desc_en) && <p className="text-[10px] text-app-textSec">{isAr ? option.desc_ar : option.desc_en}</p>}
                                                </div>
                                            </div>

                                            <span className="text-[10px] absolute bottom-1 end-1 font-bold text-white bg-app-gold px-2.5 py-1 rounded-lg">
                                                +{parsePrice(option.price_kwd ?? option.price ?? 0).toFixed(3)} {t.currency}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!canSubscribe && (
                <div className="px-8 mb-4">
                    <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3 text-[12px] font-semibold">
                        {t.selectRequired}
                    </div>
                </div>
            )}

            {(priceData.base > 0 || resolvedAddonGroups.length > 0 || ((product as any)?.addons?.length ?? 0) > 0) && (
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

                                        <button
                                            onClick={() => handleSubscriptionClick(sub)}
                                            disabled={creating || !canSubscribe}
                                            className="w-full bg-app-gold text-white font-semibold py-3 px-4 rounded-2xl shadow-lg shadow-app-gold/20 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between disabled:opacity-60"
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="flex items-center gap-2">
                                                    <ShoppingBag size={18} />
                                                    {sessionsCount > 1 && (
                                                        <span className="text-sm">{isAr ? `حجز ${sessionsCount} جلسات` : `${t.book} ${sessionsCount} ${t.sessions}`}</span>
                                                    )}
                                                    {sessionsCount === 1 && (
                                                        <span className="text-sm">{t.bookSession}</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-normal">{sessionsCount} {sessionsCount === 1 ? t.session : t.sessions}</div>
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
            )}
        </div>
    );
}
